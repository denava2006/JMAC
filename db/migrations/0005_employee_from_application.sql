-- 0005_employee_from_application.sql
--
-- Increment D: turning a deployed applicant into an employee record — the point
-- where recruitment finally feeds the rest of the platform.
--
-- WHY (verified against the live catalog before writing):
--
--   1. `employees.application_id` had NO uniqueness, so the same application
--      could produce two employee records. PROJECT_CONTEXT is explicit:
--      never duplicate employee records.
--   2. Creating the employee client-side would mean the browser restating the
--      name, salary, schedule and start date that the offer and deployment
--      already fixed — the same class of drift 0002/0003/0004 removed.
--   3. `application_history` had no permitted event for this step, so the audit
--      trail stopped at deployment.
--
-- HOW: one permission-scoped RPC copies the record from the sources of truth
-- (applicant, accepted offer, deployment, posting) and is idempotent — calling
-- it again returns the existing employee instead of creating a second one.
--
-- NOTE: an employee row is NOT a POS account. User, role and store membership
-- remain a separate, deliberate step.
--
-- SAFETY: forward-only. 0 employees currently carry an application_id, so the
-- unique index needs no backfill; the CHECK change only *adds* a permitted
-- event value and cannot invalidate existing rows.
--
-- APPLY:
--   docker exec -i supabase_db_jmac-suite psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 --single-transaction < db/migrations/0005_employee_from_application.sql

begin;

-- ---------------------------------------------------------------------------
-- 1. One employee per application
-- ---------------------------------------------------------------------------
create unique index if not exists employees_application_id_unique
  on public.employees (application_id)
  where application_id is not null;

-- ---------------------------------------------------------------------------
-- 2. Let the audit trail record this step
-- ---------------------------------------------------------------------------
alter table public.application_history
  drop constraint if exists application_history_event_check;
alter table public.application_history
  add constraint application_history_event_check check (
    event = any (array[
      'submitted', 'reviewed', 'qualified', 'rejected', 'rejection_email_queued',
      'initial_interview_scheduled', 'initial_interview_started',
      'initial_interview_passed', 'initial_interview_rejected',
      'final_interview_scheduled', 'final_interview_started',
      'final_interview_rejected', 'hired', 'interview_scheduled_email_queued',
      'hired_email_queued', 'job_offer_prepared', 'offer_accepted',
      'offer_declined', 'application_closed', 'contract_prepared',
      'contract_generated', 'contract_signed', 'deployment_completed',
      'employee_created'
    ])
  );

-- ---------------------------------------------------------------------------
-- 3. Create the employee from the application's own evidence
-- ---------------------------------------------------------------------------
create or replace function public.create_employee_from_application(p_application_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_status public.application_status;
  v_applicant public.applicants%rowtype;
  v_offer public.job_offers%rowtype;
  v_deployment public.deployment_records%rowtype;
  v_position_id uuid;
  v_department_id uuid;
  v_position_title text;
  v_existing uuid;
  v_employee_id uuid;
begin
  if v_actor_id is null or not public.has_permission('employee.create') then
    raise exception 'EMPLOYEE_NOT_AUTHORIZED';
  end if;
  if p_application_id is null then
    raise exception 'EMPLOYEE_APPLICATION_REQUIRED';
  end if;

  select a.status into v_status
  from public.applications a
  where a.id = p_application_id
  for update of a;

  if not found then
    raise exception 'EMPLOYEE_APPLICATION_NOT_FOUND';
  end if;

  -- Idempotent: a second call returns the record that already exists rather
  -- than creating a duplicate person.
  select e.id into v_existing from public.employees e
  where e.application_id = p_application_id;
  if v_existing is not null then
    return v_existing;
  end if;

  if v_status <> 'deployed' then
    raise exception 'EMPLOYEE_NOT_DEPLOYED';
  end if;

  select ap.* into v_applicant
  from public.applicants ap
  join public.applications a on a.applicant_id = ap.id
  where a.id = p_application_id;

  select o.* into v_offer
  from public.job_offers o
  where o.application_id = p_application_id and o.status = 'accepted'
  order by o.created_at desc, o.id desc
  limit 1;

  if not found then
    raise exception 'EMPLOYEE_OFFER_NOT_FOUND';
  end if;

  select d.* into v_deployment
  from public.deployment_records d
  where d.application_id = p_application_id;

  select jp.position_id, jp.department_id, p.title
    into v_position_id, v_department_id, v_position_title
  from public.applications a
  join public.job_postings jp on jp.id = a.job_posting_id
  left join public.positions p on p.id = jp.position_id
  where a.id = p_application_id;

  -- The offer speaks the recruitment enum (regular | part_time); the employee
  -- record speaks the HR one (full_time | part_time).
  insert into public.employees (
    first_name, middle_name, last_name,
    personal_email, phone, address, province, city, barangay,
    branch_id, department_id, position_id, position_title,
    employment_type, employment_status, hire_date,
    salary_grade_id, basic_salary, currency, benefits,
    work_schedule_id, application_id
  )
  values (
    v_applicant.first_name, v_applicant.middle_name, v_applicant.last_name,
    v_applicant.email, v_applicant.phone, v_applicant.address,
    v_applicant.province, v_applicant.city, v_applicant.barangay,
    v_deployment.branch_id, v_department_id, v_position_id, v_position_title,
    case v_offer.employment_type when 'regular' then 'full_time' else 'part_time' end,
    'active',
    coalesce(v_deployment.deployment_date, v_offer.start_date),
    v_offer.salary_grade_id, v_offer.proposed_salary, coalesce(v_offer.currency, 'PHP'),
    v_offer.benefits,
    coalesce(v_deployment.work_schedule_id, v_offer.work_schedule_id), p_application_id
  )
  returning id into v_employee_id;

  insert into public.application_history (application_id, event, actor_id)
  values (p_application_id, 'employee_created', v_actor_id);

  return v_employee_id;
end;
$function$;

revoke all on function public.create_employee_from_application(uuid) from public, anon;
grant execute on function public.create_employee_from_application(uuid) to authenticated;

commit;
