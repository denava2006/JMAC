-- 0004_atomic_deployment.sql
--
-- Increment C: deployment, reworked so it cannot bypass the offer/contract
-- stages. This supersedes the earlier direct `hired -> deployed` scaffold, which
-- was never reachable (no route, nav 'planned') and is replaced in code.
--
-- WHY (verified against the live catalog before writing):
--
--   1. After 0002 there was NO edge into 'deployed' at all, so deployment was
--      impossible by design until this migration supplies a gated one.
--   2. `deployment_records` still carried one broad `ALL` policy, so any active
--      staff session could insert a deployment row directly — no offer, no
--      contract, no history. The same hole 0002 closed for offers and 0003 for
--      contracts.
--   3. Deployment date was client-supplied and could contradict the start date
--      the applicant actually accepted.
--   4. Branch / work location / schedule were not cross-validated, so a location
--      belonging to another branch could be recorded against a deployment.
--
-- HOW: `deploy_applicant(...)` owns the whole step in one transaction, and the
-- transition trigger refuses `offered -> deployed` unless the accepted offer's
-- contract is signed — so a direct API call cannot skip the process either.
--
-- SAFETY: forward-only. The four legacy `deployed` applications predate this
-- flow; the trigger only inspects *transitions*, so they are untouched and must
-- not be silently rewritten (see the handoff).
--
-- APPLY:
--   docker exec -i supabase_db_jmac-suite psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 --single-transaction < db/migrations/0004_atomic_deployment.sql

begin;

-- ---------------------------------------------------------------------------
-- 1. Transition graph: add 'offered' -> 'deployed', gated on a signed contract.
--    Body preserved verbatim from the live 0002 definition; only the edge and
--    the guard are added.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_application_transition()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if (select auth.uid()) is null then
    return new;
  end if;

  if new.status = old.status then
    return new;
  end if;

  if new.status in ('rejected', 'closed') then
    if old.status in ('deployed', 'rejected', 'closed') then
      raise exception 'This application is already closed and cannot change status.';
    end if;
    return new;
  end if;

  if not (
       (old.status = 'submitted'           and new.status in ('under_review', 'qualified'))
    or (old.status = 'under_review'        and new.status = 'qualified')
    or (old.status = 'qualified'           and new.status = 'interview_scheduled')
    or (old.status = 'interview_scheduled' and new.status = 'hired')
    or (old.status = 'hired'               and new.status = 'offered')
    or (old.status = 'offered'             and new.status = 'deployed')
  ) then
    raise exception 'Invalid application transition: % -> %.', old.status, new.status;
  end if;

  if old.status = 'hired' and new.status = 'offered' and not exists (
    select 1
    from public.job_offers o
    where o.application_id = new.id and o.status = 'pending'
  ) then
    raise exception 'A pending job offer is required before this application can be marked offered.';
  end if;

  -- Increment C: deployment requires the accepted offer's contract to be signed.
  -- Without this the 'offered' -> 'deployed' edge would reintroduce the very
  -- shortcut migration 0001/0002 removed, just one step later.
  if old.status = 'offered' and new.status = 'deployed' and not exists (
    select 1
    from public.job_offers o
    join public.employment_contracts c on c.job_offer_id = o.id
    where o.application_id = new.id
      and o.status = 'accepted'
      and c.status = 'signed'
  ) then
    raise exception 'A signed employment contract is required before deployment.';
  end if;

  return new;
end;

$function$;

-- ---------------------------------------------------------------------------
-- 2. One atomic deployment step
-- ---------------------------------------------------------------------------
create or replace function public.deploy_applicant(
  p_application_id uuid,
  p_branch_id uuid,
  p_work_location_id uuid default null,
  p_work_schedule_id uuid default null,
  p_reporting_manager text default null,
  p_reporting_time text default null,
  p_remarks text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_status public.application_status;
  v_offer public.job_offers%rowtype;
  v_contract_status public.contract_status;
  v_branch record;
  v_location record;
  v_schedule record;
  v_existing uuid;
  v_deployment_id uuid;
  v_manager text := nullif(trim(p_reporting_manager), '');
  v_time text := nullif(trim(p_reporting_time), '');
  v_remarks text := nullif(trim(p_remarks), '');
begin
  if v_actor_id is null or not public.has_permission('deployment.manage') then
    raise exception 'DEPLOY_NOT_AUTHORIZED';
  end if;
  if p_application_id is null or p_branch_id is null then
    raise exception 'DEPLOY_BRANCH_REQUIRED';
  end if;

  -- Application first, then offer: the lock order prepare_job_offer,
  -- respond_to_job_offer and the contract RPCs all use.
  select a.status into v_status
  from public.applications a
  where a.id = p_application_id
  for update of a;

  if not found then
    raise exception 'DEPLOY_APPLICATION_NOT_FOUND';
  end if;

  select o.* into v_offer
  from public.job_offers o
  where o.application_id = p_application_id
    and o.status = 'accepted'
  order by o.created_at desc, o.id desc
  limit 1
  for update;

  if not found then
    raise exception 'DEPLOY_OFFER_NOT_ACCEPTED';
  end if;

  select c.status into v_contract_status
  from public.employment_contracts c
  where c.job_offer_id = v_offer.id
  for update;

  if v_contract_status is null or v_contract_status <> 'signed' then
    raise exception 'DEPLOY_CONTRACT_NOT_SIGNED';
  end if;

  -- Retry safety: application_id is UNIQUE on deployment_records, so a previous
  -- attempt that recorded the row but failed afterwards must not dead-end here.
  select d.id into v_existing from public.deployment_records d
  where d.application_id = p_application_id;

  select b.id, b.name, b.is_active into v_branch from public.branches b where b.id = p_branch_id;
  if v_branch.id is null or not v_branch.is_active then
    raise exception 'DEPLOY_BRANCH_INVALID';
  end if;

  if p_work_location_id is not null then
    select l.id, l.name, l.branch_id, l.is_active into v_location
    from public.work_locations l where l.id = p_work_location_id;
    if v_location.id is null or not v_location.is_active then
      raise exception 'DEPLOY_LOCATION_INVALID';
    end if;
    -- A work location belongs to exactly one branch; recording one from another
    -- branch would misstate where the employee actually reports.
    if v_location.branch_id <> p_branch_id then
      raise exception 'DEPLOY_LOCATION_BRANCH_MISMATCH';
    end if;
  end if;

  if p_work_schedule_id is not null then
    select s.id, s.employment_type into v_schedule
    from public.work_schedules s where s.id = p_work_schedule_id;
    if v_schedule.id is null then
      raise exception 'DEPLOY_SCHEDULE_INVALID';
    end if;
    if v_schedule.employment_type <> v_offer.employment_type then
      raise exception 'DEPLOY_SCHEDULE_MISMATCH';
    end if;
  end if;

  if v_existing is null then
    -- deployment_date is the accepted offer's start date. The applicant agreed
    -- to that date, so it is not the browser's to restate.
    insert into public.deployment_records (
      application_id, deployment_date, branch_id, assigned_branch,
      work_location_id, work_location, work_schedule_id,
      reporting_manager, reporting_time, remarks, deployed_by
    )
    values (
      p_application_id, v_offer.start_date, p_branch_id, v_branch.name,
      p_work_location_id, v_location.name, p_work_schedule_id,
      v_manager, v_time, v_remarks, v_actor_id
    )
    returning id into v_deployment_id;
  else
    v_deployment_id := v_existing;
  end if;

  -- Already deployed: an identical retry returns the same record rather than
  -- raising, so a lost response cannot strand the caller.
  if v_status = 'deployed' then
    return v_deployment_id;
  end if;
  if v_status <> 'offered' then
    raise exception 'DEPLOY_APPLICATION_STATE_INVALID';
  end if;

  update public.applications set status = 'deployed' where id = p_application_id;

  insert into public.application_history (application_id, event, actor_id)
  values (p_application_id, 'deployment_completed', v_actor_id);

  return v_deployment_id;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 3. Writes belong to the RPC, not to the client
-- ---------------------------------------------------------------------------
drop policy if exists deployment_records_staff_all on public.deployment_records;
drop policy if exists deployment_records_staff_select on public.deployment_records;
create policy deployment_records_staff_select
  on public.deployment_records
  for select
  to authenticated
  using (public.is_active_staff());

revoke insert, update, delete on public.deployment_records from authenticated;

revoke all on function public.deploy_applicant(uuid, uuid, uuid, uuid, text, text, text) from public, anon;
grant execute on function public.deploy_applicant(uuid, uuid, uuid, uuid, text, text, text) to authenticated;

commit;
