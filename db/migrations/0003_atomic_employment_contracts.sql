-- 0003_atomic_employment_contracts.sql
--
-- Increment B: the employment contract stage between an accepted job offer and
-- deployment.
--
-- WHY (verified against the live catalog before writing):
--
--   1. `employment_contracts` had one broad policy (`employment_contracts_staff_all`,
--      ALL to public/active staff), so any active staff session could insert a
--      "signed" contract directly, with no offer, no file and no history — the
--      same hole migration 0002 closed for job_offers.
--   2. Nothing tied a contract to an *accepted* offer, and nothing stopped two
--      contracts existing for one offer.
--   3. Nothing enforced draft -> printed -> signed, and a row could be marked
--      signed with no file, no signer and no timestamp.
--   4. start_date was client-supplied and could disagree with the offer the
--      applicant actually accepted.
--
-- HOW: three permission-scoped SECURITY DEFINER RPCs own every write, in the
-- same style as prepare_job_offer (0002): actor from auth.uid(), semantic
-- UPPER_SNAKE error codes, application row locked before the offer/contract row,
-- and idempotent retries. Direct table writes are revoked; authenticated keeps
-- SELECT only.
--
-- SAFETY: forward-only. `employment_contracts` currently holds 0 rows, so the
-- new NOT NULL/CHECK/UNIQUE rules need no backfill (verified). No table is
-- dropped, POS is untouched, and the application transition graph is unchanged —
-- Increment C is what will consume a signed contract.
--
-- APPLY:
--   docker exec -i supabase_db_jmac-suite psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 < db/migrations/0003_atomic_employment_contracts.sql

begin;

-- ---------------------------------------------------------------------------
-- 1. Integrity: one contract per offer, and "signed" must mean signed
-- ---------------------------------------------------------------------------
create unique index if not exists employment_contracts_job_offer_unique
  on public.employment_contracts (job_offer_id);

alter table public.employment_contracts
  drop constraint if exists employment_contracts_signed_complete;
alter table public.employment_contracts
  add constraint employment_contracts_signed_complete check (
    status <> 'signed'
    or (contract_file_url is not null and signed_at is not null and signed_by is not null)
  );

-- ---------------------------------------------------------------------------
-- 2. Generate the contract from the accepted offer (status: draft)
-- ---------------------------------------------------------------------------
create or replace function public.generate_employment_contract(
  p_application_id uuid,
  p_terms text default null,
  p_company_policies text default null,
  p_additional_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_application_status public.application_status;
  v_offer public.job_offers%rowtype;
  v_contract public.employment_contracts%rowtype;
  v_terms text := nullif(trim(p_terms), '');
  v_policies text := nullif(trim(p_company_policies), '');
  v_notes text := nullif(trim(p_additional_notes), '');
  v_contract_id uuid;
begin
  if v_actor_id is null or not public.has_permission('deployment.manage') then
    raise exception 'CONTRACT_NOT_AUTHORIZED';
  end if;
  if p_application_id is null then
    raise exception 'CONTRACT_APPLICATION_REQUIRED';
  end if;

  -- Application first, then offer: the same lock order prepare_job_offer and
  -- respond_to_job_offer use, so the three cannot deadlock against each other.
  select a.status into v_application_status
  from public.applications a
  where a.id = p_application_id
  for update of a;

  if not found then
    raise exception 'CONTRACT_APPLICATION_NOT_FOUND';
  end if;

  select o.* into v_offer
  from public.job_offers o
  where o.application_id = p_application_id
    and o.status = 'accepted'
  order by o.created_at desc, o.id desc
  limit 1
  for update;

  if not found then
    raise exception 'CONTRACT_OFFER_NOT_ACCEPTED';
  end if;

  select c.* into v_contract
  from public.employment_contracts c
  where c.job_offer_id = v_offer.id
  for update;

  if found then
    if v_contract.status = 'signed' then
      raise exception 'CONTRACT_ALREADY_SIGNED';
    end if;
    -- Regenerating before signature refreshes the wording rather than creating a
    -- second contract for the same offer.
    update public.employment_contracts
    set terms = coalesce(v_terms, terms),
        company_policies = coalesce(v_policies, company_policies),
        additional_notes = coalesce(v_notes, additional_notes),
        start_date = v_offer.start_date
    where id = v_contract.id;
    return v_contract.id;
  end if;

  -- start_date is the offer's: the applicant accepted that date, so it is not
  -- the browser's to restate.
  insert into public.employment_contracts (
    job_offer_id, status, start_date, terms, company_policies, additional_notes
  )
  values (v_offer.id, 'draft', v_offer.start_date, v_terms, v_policies, v_notes)
  returning id into v_contract_id;

  insert into public.application_history (application_id, event, actor_id)
  values (p_application_id, 'contract_prepared', v_actor_id);

  return v_contract_id;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 3. Mark the contract issued for signature (draft -> printed)
-- ---------------------------------------------------------------------------
create or replace function public.mark_contract_printed(p_contract_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_contract public.employment_contracts%rowtype;
  v_application_id uuid;
begin
  if v_actor_id is null or not public.has_permission('deployment.manage') then
    raise exception 'CONTRACT_NOT_AUTHORIZED';
  end if;

  select o.application_id into v_application_id
  from public.employment_contracts c
  join public.job_offers o on o.id = c.job_offer_id
  where c.id = p_contract_id;

  if v_application_id is null then
    raise exception 'CONTRACT_NOT_FOUND';
  end if;

  perform 1 from public.applications a where a.id = v_application_id for update;

  select c.* into v_contract
  from public.employment_contracts c
  where c.id = p_contract_id
  for update;

  if v_contract.status = 'signed' then
    raise exception 'CONTRACT_ALREADY_SIGNED';
  end if;
  -- Already printed: reopening the printable copy is not a new event.
  if v_contract.status = 'printed' then
    return;
  end if;

  update public.employment_contracts set status = 'printed' where id = p_contract_id;

  insert into public.application_history (application_id, event, actor_id)
  values (v_application_id, 'contract_generated', v_actor_id);
end;
$function$;

-- ---------------------------------------------------------------------------
-- 4. Record the signed copy (printed -> signed)
-- ---------------------------------------------------------------------------
create or replace function public.record_contract_signing(
  p_contract_id uuid,
  p_file_path text,
  p_signing_notes text default null
)
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_contract public.employment_contracts%rowtype;
  v_application_id uuid;
  v_path text := nullif(trim(p_file_path), '');
  v_notes text := nullif(trim(p_signing_notes), '');
begin
  if v_actor_id is null or not public.has_permission('deployment.manage') then
    raise exception 'CONTRACT_NOT_AUTHORIZED';
  end if;
  -- A signed contract without its scanned copy is an assertion, not evidence.
  if v_path is null then
    raise exception 'CONTRACT_FILE_REQUIRED';
  end if;

  select o.application_id into v_application_id
  from public.employment_contracts c
  join public.job_offers o on o.id = c.job_offer_id
  where c.id = p_contract_id;

  if v_application_id is null then
    raise exception 'CONTRACT_NOT_FOUND';
  end if;

  perform 1 from public.applications a where a.id = v_application_id for update;

  select c.* into v_contract
  from public.employment_contracts c
  where c.id = p_contract_id
  for update;

  if v_contract.status = 'signed' then
    raise exception 'CONTRACT_ALREADY_SIGNED';
  end if;
  -- draft -> printed -> signed: the copy being signed is the one that was issued.
  if v_contract.status <> 'printed' then
    raise exception 'CONTRACT_NOT_ISSUED';
  end if;

  update public.employment_contracts
  set status = 'signed',
      contract_file_url = v_path,
      signed_at = now(),
      signed_by = v_actor_id,
      signing_notes = v_notes
  where id = p_contract_id;

  insert into public.application_history (application_id, event, actor_id)
  values (v_application_id, 'contract_signed', v_actor_id);
end;
$function$;

-- ---------------------------------------------------------------------------
-- 5. Writes belong to the RPCs, not to the client
-- ---------------------------------------------------------------------------
drop policy if exists employment_contracts_staff_all on public.employment_contracts;
drop policy if exists employment_contracts_staff_select on public.employment_contracts;
create policy employment_contracts_staff_select
  on public.employment_contracts
  for select
  to authenticated
  using (public.is_active_staff());

revoke insert, update, delete on public.employment_contracts from authenticated;

revoke all on function public.generate_employment_contract(uuid, text, text, text) from public, anon;
revoke all on function public.mark_contract_printed(uuid) from public, anon;
revoke all on function public.record_contract_signing(uuid, text, text) from public, anon;
grant execute on function public.generate_employment_contract(uuid, text, text, text) to authenticated;
grant execute on function public.mark_contract_printed(uuid) to authenticated;
grant execute on function public.record_contract_signing(uuid, text, text) to authenticated;

commit;
