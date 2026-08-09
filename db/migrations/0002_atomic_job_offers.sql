-- 0002_atomic_job_offers.sql
--
-- Increment A: mandatory, atomic job offers.
--
-- WHY:
--   * Preparing an offer was previously three independent Data API writes
--     (offer, application status, history), so partial failures were possible.
--   * Active staff could mutate job_offers directly even without
--     deployment.manage.
--   * The existing compatibility triggers map the already-normalized
--     regular/part_time enum through core_to_hr_employment_type(), which turns
--     both values into part_time and rejects valid regular offers.
--   * respond_to_job_offer read pending status before an unconditional update,
--     allowing concurrent responses to overwrite one another and duplicate
--     history.
--   * Deployment must remain impossible until Increment C adds the accepted
--     offer + signed contract gate.
--
-- This migration keeps declined offers as history and permits a new pending
-- revision only when the newest offer was declined. A pending or accepted offer
-- is the single live offer for an application.
--
-- VERIFY WITHOUT PERSISTING:
--   psql ... -v ON_ERROR_STOP=1 -c "begin" -f this-file -c "rollback"
--
-- APPLY ONCE:
--   psql ... -v ON_ERROR_STOP=1 -1 -f this-file

-- ---------------------------------------------------------------------------
-- 1. Offer row invariants and lookup indexes
-- ---------------------------------------------------------------------------

do $preflight$
begin
  if exists (
    select 1
    from public.job_offers
    where salary_grade_id is null
       or work_schedule_id is null
       or start_date is null
       or working_hours is null
       or working_days is null
       or prepared_by is null
       or proposed_salary <= 0
       or start_date <= offer_date
       or (status = 'declined' and nullif(trim(decline_reason), '') is null)
  ) then
    raise exception 'Existing job offers do not satisfy Increment A required fields.';
  end if;

  if exists (
    select 1
    from public.job_offers
    group by application_id
    having count(*) filter (where status in ('pending', 'accepted')) > 1
  ) then
    raise exception 'An application has more than one pending or accepted offer.';
  end if;
end;
$preflight$;

alter table public.job_offers
  alter column salary_grade_id set not null,
  alter column work_schedule_id set not null,
  alter column start_date set not null,
  alter column working_hours set not null,
  alter column working_days set not null,
  alter column prepared_by set not null;

-- A historical offer must retain its preparer. The inherited foreign key used
-- ON DELETE SET NULL, which contradicts the required audit actor above and
-- would turn user deletion into a surprising NOT NULL error.
alter table public.job_offers
  drop constraint if exists job_offers_prepared_by_fkey,
  add constraint job_offers_prepared_by_fkey
    foreign key (prepared_by) references public.users(id) on delete restrict;

alter table public.job_offers
  drop constraint if exists job_offers_salary_positive,
  add constraint job_offers_salary_positive
    check (proposed_salary > 0),
  drop constraint if exists job_offers_start_after_offer,
  add constraint job_offers_start_after_offer
    check (start_date > offer_date),
  drop constraint if exists job_offers_response_consistent,
  add constraint job_offers_response_consistent check (
       (status = 'pending'  and responded_at is null
                            and decline_reason is null
                            and decline_notes is null)
    or (status = 'accepted' and responded_at is not null
                            and decline_reason is null
                            and decline_notes is null)
    or (status = 'declined' and responded_at is not null
                            and decline_reason is not null)
  );

alter table public.job_offers
  validate constraint job_offers_decline_reason_required;

create index if not exists job_offers_application_created_idx
  on public.job_offers (application_id, created_at desc, id desc);

create unique index if not exists job_offers_one_live_per_application_idx
  on public.job_offers (application_id)
  where status in ('pending'::public.offer_status, 'accepted'::public.offer_status);

-- ---------------------------------------------------------------------------
-- 2. Replace the broken offer compatibility triggers with direct enum checks
-- ---------------------------------------------------------------------------

drop trigger if exists trg_job_offers_employment_type_compatible on public.job_offers;
drop trigger if exists trg_job_offers_inherit_employment_type on public.job_offers;

create or replace function public.validate_job_offer_terms()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_application_status public.application_status;
  v_posting_type public.employment_type;
  v_grade_type public.employment_type;
  v_grade_min numeric;
  v_grade_max numeric;
  v_schedule_type public.employment_type;
  v_schedule_days smallint[];
  v_schedule_start time;
  v_schedule_end time;
  v_working_days text;
begin
  select a.status, jp.employment_type
    into v_application_status, v_posting_type
  from public.applications a
  join public.job_postings jp on jp.id = a.job_posting_id
  where a.id = new.application_id;

  if not found then
    raise exception 'OFFER_APPLICATION_NOT_FOUND';
  end if;

  if new.employment_type is distinct from v_posting_type then
    raise exception 'OFFER_EMPLOYMENT_TYPE_MISMATCH';
  end if;

  if v_application_status not in ('hired', 'offered') then
    raise exception 'OFFER_APPLICATION_NOT_READY';
  end if;

  if upper(trim(new.currency)) <> 'PHP' then
    raise exception 'OFFER_CURRENCY_NOT_SUPPORTED';
  end if;
  new.currency := 'PHP';

  if new.start_date is null or new.start_date <= current_date then
    raise exception 'OFFER_START_DATE_INVALID';
  end if;

  select g.employment_type, g.min_salary, g.max_salary
    into v_grade_type, v_grade_min, v_grade_max
  from public.salary_grades g
  where g.id = new.salary_grade_id;

  if not found then
    raise exception 'OFFER_SALARY_GRADE_NOT_FOUND';
  end if;

  if v_grade_type is distinct from v_posting_type then
    raise exception 'OFFER_SALARY_GRADE_MISMATCH';
  end if;

  if new.proposed_salary < v_grade_min or new.proposed_salary > v_grade_max then
    raise exception 'OFFER_SALARY_OUT_OF_RANGE';
  end if;

  select s.employment_type, s.working_days, s.start_time, s.end_time
    into v_schedule_type, v_schedule_days, v_schedule_start, v_schedule_end
  from public.work_schedules s
  where s.id = new.work_schedule_id;

  if not found then
    raise exception 'OFFER_WORK_SCHEDULE_NOT_FOUND';
  end if;

  if v_schedule_type is distinct from v_posting_type then
    raise exception 'OFFER_WORK_SCHEDULE_MISMATCH';
  end if;

  select string_agg(
           case day_item.day_number
             when 0 then 'Sunday'
             when 1 then 'Monday'
             when 2 then 'Tuesday'
             when 3 then 'Wednesday'
             when 4 then 'Thursday'
             when 5 then 'Friday'
             when 6 then 'Saturday'
             else 'Day ' || day_item.day_number::text
           end,
           ', ' order by day_item.ordinality
         )
    into v_working_days
  from unnest(v_schedule_days) with ordinality
    as day_item(day_number, ordinality);

  new.working_days := v_working_days;
  new.working_hours :=
    to_char(v_schedule_start, 'FMHH12:MI AM') || ' - ' ||
    to_char(v_schedule_end, 'FMHH12:MI AM');

  return new;
end;
$function$;

revoke all on function public.validate_job_offer_terms() from public, anon, authenticated;

drop trigger if exists trg_job_offers_validate_terms on public.job_offers;
create trigger trg_job_offers_validate_terms
  before insert or update of
    application_id,
    employment_type,
    salary_grade_id,
    proposed_salary,
    currency,
    work_schedule_id,
    start_date
  on public.job_offers
  for each row execute function public.validate_job_offer_terms();

create or replace function public.guard_job_offer_state()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'pending' then
      raise exception 'OFFER_MUST_START_PENDING';
    end if;
    return new;
  end if;

  if old.status <> 'pending' and (
       new.responded_at is distinct from old.responded_at
    or new.decline_reason is distinct from old.decline_reason
    or new.decline_notes is distinct from old.decline_notes
  ) then
    raise exception 'OFFER_RESPONSE_IMMUTABLE';
  end if;

  if new.status is distinct from old.status and not (
    old.status = 'pending' and new.status in ('accepted', 'declined')
  ) then
    raise exception 'INVALID_OFFER_TRANSITION: % -> %', old.status, new.status;
  end if;

  return new;
end;
$function$;

revoke all on function public.guard_job_offer_state() from public, anon, authenticated;

drop trigger if exists trg_job_offers_guard_state on public.job_offers;
create trigger trg_job_offers_guard_state
  before insert or update on public.job_offers
  for each row execute function public.guard_job_offer_state();

create or replace function public.protect_job_offer_terms()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  if row(
       new.application_id,
       new.offer_date,
       new.proposed_salary,
       new.employment_type,
       new.salary_grade_id,
       new.currency,
       new.working_hours,
       new.working_days,
       new.start_date,
       new.benefits,
       new.additional_compensation,
       new.notes,
       new.prepared_by,
       new.work_schedule_id
     ) is distinct from row(
       old.application_id,
       old.offer_date,
       old.proposed_salary,
       old.employment_type,
       old.salary_grade_id,
       old.currency,
       old.working_hours,
       old.working_days,
       old.start_date,
       old.benefits,
       old.additional_compensation,
       old.notes,
       old.prepared_by,
       old.work_schedule_id
     ) then
    raise exception 'OFFER_TERMS_IMMUTABLE';
  end if;

  return new;
end;
$function$;

revoke all on function public.protect_job_offer_terms() from public, anon, authenticated;

drop trigger if exists trg_job_offers_protect_terms on public.job_offers;
create trigger trg_job_offers_protect_terms
  before update on public.job_offers
  for each row execute function public.protect_job_offer_terms();

-- ---------------------------------------------------------------------------
-- 3. Atomic, permission-scoped offer preparation
-- ---------------------------------------------------------------------------

create or replace function public.prepare_job_offer(
  p_application_id uuid,
  p_proposed_salary numeric,
  p_salary_grade_id uuid,
  p_work_schedule_id uuid,
  p_start_date date,
  p_benefits text default null,
  p_additional_compensation text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_application_status public.application_status;
  v_employment_type public.employment_type;
  v_active public.job_offers%rowtype;
  v_benefits text := nullif(trim(p_benefits), '');
  v_additional_compensation text := nullif(trim(p_additional_compensation), '');
  v_notes text := nullif(trim(p_notes), '');
  v_offer_id uuid;
begin
  if v_actor_id is null or not public.has_permission('deployment.manage') then
    raise exception 'OFFER_NOT_AUTHORIZED';
  end if;

  if p_application_id is null then
    raise exception 'OFFER_APPLICATION_REQUIRED';
  end if;
  -- Every preparation and response path locks the application first.
  -- Concurrent preparations therefore serialize on one short-lived row lock.
  select a.status, jp.employment_type
    into v_application_status, v_employment_type
  from public.applications a
  join public.job_postings jp on jp.id = a.job_posting_id
  where a.id = p_application_id
  for update of a;

  if not found then
    raise exception 'OFFER_APPLICATION_NOT_FOUND';
  end if;

  select o.*
    into v_active
  from public.job_offers o
  where o.application_id = p_application_id
    and o.status in ('pending', 'accepted')
  order by o.created_at desc, o.id desc
  limit 1
  for update;

  if found then
    if v_application_status <> 'offered' then
      raise exception 'OFFER_APPLICATION_STATE_INVALID';
    end if;

    if v_active.status = 'accepted' then
      raise exception 'OFFER_ALREADY_ACCEPTED';
    end if;

    -- A network retry with the same request is successful and produces no
    -- duplicate row/history. Different terms require the pending response to
    -- be resolved first.
    if v_active.proposed_salary = p_proposed_salary
       and v_active.salary_grade_id = p_salary_grade_id
       and v_active.work_schedule_id = p_work_schedule_id
       and v_active.start_date = p_start_date
       and v_active.employment_type = v_employment_type
       and v_active.currency = 'PHP'
       and v_active.benefits is not distinct from v_benefits
       and v_active.additional_compensation is not distinct from v_additional_compensation
       and v_active.notes is not distinct from v_notes then
      return v_active.id;
    end if;

    raise exception 'OFFER_ALREADY_PENDING';
  end if;

  if p_salary_grade_id is null then
    raise exception 'OFFER_SALARY_GRADE_REQUIRED';
  end if;
  if p_proposed_salary is null or p_proposed_salary <= 0 then
    raise exception 'OFFER_SALARY_INVALID';
  end if;
  if p_work_schedule_id is null then
    raise exception 'OFFER_WORK_SCHEDULE_REQUIRED';
  end if;
  if p_start_date is null or p_start_date <= current_date then
    raise exception 'OFFER_START_DATE_INVALID';
  end if;

  if v_application_status = 'hired' and exists (
    select 1 from public.job_offers where application_id = p_application_id
  ) then
    raise exception 'OFFER_APPLICATION_STATE_INVALID';
  end if;

  if v_application_status = 'offered' and not exists (
    select 1
    from public.job_offers
    where application_id = p_application_id and status = 'declined'
  ) then
    raise exception 'OFFER_DECLINED_REVISION_REQUIRED';
  end if;

  if v_application_status not in ('hired', 'offered') then
    raise exception 'OFFER_APPLICATION_NOT_READY';
  end if;

  insert into public.job_offers (
    application_id,
    proposed_salary,
    employment_type,
    salary_grade_id,
    currency,
    work_schedule_id,
    working_hours,
    working_days,
    start_date,
    benefits,
    additional_compensation,
    notes,
    prepared_by,
    status
  ) values (
    p_application_id,
    p_proposed_salary,
    v_employment_type,
    p_salary_grade_id,
    'PHP',
    p_work_schedule_id,
    '',
    '',
    p_start_date,
    v_benefits,
    v_additional_compensation,
    v_notes,
    v_actor_id,
    'pending'
  )
  returning id into v_offer_id;

  if v_application_status = 'hired' then
    update public.applications
    set status = 'offered'
    where id = p_application_id and status = 'hired';

    if not found then
      raise exception 'OFFER_APPLICATION_CHANGED';
    end if;
  end if;

  insert into public.application_history (application_id, event, actor_id, notes)
  values (
    p_application_id,
    'job_offer_prepared',
    v_actor_id,
    case when v_application_status = 'offered'
      then 'A revised job offer was prepared.'
      else null
    end
  );

  return v_offer_id;
end;
$function$;

revoke all on function public.prepare_job_offer(uuid, numeric, uuid, uuid, date, text, text, text) from public;
revoke all on function public.prepare_job_offer(uuid, numeric, uuid, uuid, date, text, text, text) from anon;
revoke all on function public.prepare_job_offer(uuid, numeric, uuid, uuid, date, text, text, text) from authenticated;
revoke all on function public.prepare_job_offer(uuid, numeric, uuid, uuid, date, text, text, text) from service_role;
grant execute on function public.prepare_job_offer(uuid, numeric, uuid, uuid, date, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Race-safe applicant response. Signature remains client-compatible.
-- ---------------------------------------------------------------------------

create or replace function public.respond_to_job_offer(
  p_reference_code text,
  p_email text,
  p_decision text,
  p_decline_reason text default null,
  p_decline_notes text default null
)
returns text
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_application_id uuid;
  v_application_status public.application_status;
  v_offer_id uuid;
  v_offer_status public.offer_status;
  v_reason text := nullif(trim(p_decline_reason), '');
  v_notes text := nullif(trim(p_decline_notes), '');
begin
  if p_decision is null or p_decision not in ('accepted', 'declined') then
    raise exception 'INVALID_DECISION';
  end if;

  if p_decision = 'accepted' and (v_reason is not null or v_notes is not null) then
    raise exception 'INVALID_DECLINE_DETAILS';
  end if;

  if p_decision = 'declined' and v_reason is null then
    raise exception 'DECLINE_REASON_REQUIRED';
  end if;

  if p_decision = 'declined' and v_reason <> all (array[
    'Accepted another job offer',
    'Salary expectation',
    'Personal reason',
    'Location',
    'Schedule conflict',
    'Other'
  ]) then
    raise exception 'INVALID_DECLINE_REASON';
  end if;

  select a.id, a.status
    into v_application_id, v_application_status
  from public.applications a
  join public.applicants ap on ap.id = a.applicant_id
  where a.reference_code = upper(trim(p_reference_code))
    and lower(ap.email) = lower(trim(p_email))
  for update of a;

  if not found then
    raise exception 'NOT_FOUND';
  end if;

  if v_application_status <> 'offered' then
    raise exception 'OFFER_NOT_AVAILABLE';
  end if;

  select o.id, o.status
    into v_offer_id, v_offer_status
  from public.job_offers o
  where o.application_id = v_application_id
  order by o.created_at desc, o.id desc
  limit 1
  for update;

  if not found then
    raise exception 'NO_OFFER';
  end if;

  if v_offer_status <> 'pending' then
    raise exception 'ALREADY_RESPONDED';
  end if;

  update public.job_offers
  set status = p_decision::public.offer_status,
      responded_at = now(),
      decline_reason = case when p_decision = 'declined' then v_reason end,
      decline_notes = case when p_decision = 'declined' then v_notes end
  where id = v_offer_id and status = 'pending';

  if not found then
    raise exception 'ALREADY_RESPONDED';
  end if;

  if p_decision = 'declined' then
    insert into public.application_history (application_id, event, notes)
    values (
      v_application_id,
      'offer_declined',
      concat_ws(' - ', v_reason, v_notes)
    );
  else
    insert into public.application_history (application_id, event, notes)
    values (
      v_application_id,
      'offer_accepted',
      'Accepted by the applicant via the tracking portal.'
    );
  end if;

  return p_decision;
end;
$function$;

revoke all on function public.respond_to_job_offer(text, text, text, text, text) from public;
grant execute on function public.respond_to_job_offer(text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Enforce least-privilege offer access and fail-closed deployment status
-- ---------------------------------------------------------------------------

drop policy if exists job_offers_staff_all on public.job_offers;
drop policy if exists job_offers_staff_select on public.job_offers;
create policy job_offers_staff_select
  on public.job_offers
  for select
  to authenticated
  using (
    public.has_permission('deployment.view')
    or public.has_permission('deployment.manage')
  );

revoke all on table public.job_offers from anon, authenticated;
grant select on table public.job_offers to authenticated;

create or replace function public.enforce_application_transition()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
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

  return new;
end;
$function$;

drop trigger if exists trg_enforce_application_transition on public.applications;
create trigger trg_enforce_application_transition
  before update on public.applications
  for each row execute function public.enforce_application_transition();
