-- 0001_harden_recruitment.sql
--
-- Recruitment hardening for Slices 1-3, applied to the jmac-suite database.
--
-- WHY (each change answers a hole proven against the live database with
-- `set local role authenticated` + simulated JWT claims inside rolled-back
-- transactions, not a theoretical concern):
--
--   1. Transition bypass. An HR Staff session could UPDATE an application
--      straight from 'qualified' to 'offered' or 'deployed', skipping both
--      interview rounds and the hiring decision entirely. Only the
--      'hired' transition was guarded (protect_interview_ownership).
--      Proven: `qualified -> deployed` returned UPDATE 1.
--
--   2. HR Staff could not see any eligible final interviewer. `profiles` is a
--      security_invoker view, so the directory query returns 0 rows for the
--      very role that runs the initial round and must nominate a manager.
--      Proven: hr_staff sees 0 eligible rows.
--
--   3. Applicant identity forked on email case. submit_job_application matched
--      with `where email = p_email`, so "Juan@x.com" and "juan@x.com" became
--      two applicants. (lookup_application already normalised; submit did not.)
--
-- SAFETY: forward-only, compatible with existing rows (no backfill needed —
-- the trigger fires on UPDATE only), scoped to recruitment, and it touches
-- nothing POS. No table is dropped and no policy is weakened.
--
-- APPLY:
--   docker exec -i supabase_db_jmac-suite psql -U postgres -d postgres \
--     < db/migrations/0001_harden_recruitment.sql

begin;

-- ---------------------------------------------------------------------------
-- 1. Enforce the application transition graph
-- ---------------------------------------------------------------------------
create or replace function public.enforce_application_transition()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  -- No JWT means this is not a user request: seeds, migrations and
  -- service-role maintenance run with auth.uid() null. Same carve-out the
  -- existing protect_final_interviewer_assignment trigger already uses.
  if (select auth.uid()) is null then
    return new;
  end if;

  if new.status = old.status then
    return new;
  end if;

  -- Rejection and closure stay available from any live application; the
  -- interview-ownership trigger separately decides who may reject during
  -- the interview stage. A finished application does not reopen.
  if new.status in ('rejected', 'closed') then
    if old.status in ('deployed', 'rejected', 'closed') then
      raise exception 'This application is already closed and cannot change status.';
    end if;
    return new;
  end if;

  -- Forward path. 'hired' additionally requires the assigned final
  -- interviewer (protect_interview_ownership) — this only fixes the order.
  -- Note: hired -> deployed is permitted because offers are not implemented
  -- yet (Slice 4). Remove that edge once an offer record is required.
  if not (
       (old.status = 'submitted'           and new.status in ('under_review', 'qualified'))
    or (old.status = 'under_review'        and new.status = 'qualified')
    or (old.status = 'qualified'           and new.status = 'interview_scheduled')
    or (old.status = 'interview_scheduled' and new.status = 'hired')
    or (old.status = 'hired'               and new.status in ('offered', 'deployed'))
    or (old.status = 'offered'             and new.status = 'deployed')
  ) then
    raise exception 'Invalid application transition: % -> %.', old.status, new.status;
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_enforce_application_transition on public.applications;
create trigger trg_enforce_application_transition
  before update on public.applications
  for each row execute function public.enforce_application_transition();

-- ---------------------------------------------------------------------------
-- 2. RLS-safe directory of eligible final interviewers
--
-- Returns exactly who protect_final_interviewer_assignment will accept
-- (profiles.role is hr_role_for(id)), so the picker cannot offer someone the
-- assignment trigger would then reject. SECURITY DEFINER because the caller —
-- HR Staff — deliberately cannot read the user directory itself; the function
-- exposes only id and name, and only to a caller holding interview.manage.
-- ---------------------------------------------------------------------------
create or replace function public.eligible_final_interviewers()
returns table (id uuid, full_name text)
language plpgsql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  if not public.has_permission('interview.manage') then
    raise exception 'You are not authorized to view interviewers.';
  end if;

  return query
    select u.id, u.full_name
    from public.users u
    where u.status = 'active'
      and public.hr_role_for(u.id) in ('hr_manager', 'admin')
    order by u.full_name;
end;
$function$;

revoke all on function public.eligible_final_interviewers() from public;
revoke all on function public.eligible_final_interviewers() from anon;
grant execute on function public.eligible_final_interviewers() to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Normalise applicant email on submission
--
-- Body preserved verbatim from the live definition; only the identity match
-- and the stored value are folded to lower(trim(...)). lookup_application
-- already compares case-insensitively, so this makes the two agree.
--
-- NOTE: submit_job_application has two overloads. This replaces the 12-argument
-- one (with p_province/p_city/p_barangay) — the only one the JMAC client calls.
-- The legacy 8-argument overload still matches case-sensitively; it should be
-- dropped or patched once nothing depends on it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_job_application(p_job_posting_id uuid, p_first_name text, p_last_name text, p_email text, p_phone text, p_address text, p_resume_path text, p_cover_letter text DEFAULT NULL::text, p_middle_name text DEFAULT NULL::text, p_province text DEFAULT NULL::text, p_city text DEFAULT NULL::text, p_barangay text DEFAULT NULL::text)
 RETURNS TABLE(application_id uuid, applicant_id uuid, reference_code text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_status job_posting_status;
  v_closing_date date;
  v_applicant_id uuid;
  v_application_id uuid;
  v_reference_code text;
begin
  select status, closing_date into v_status, v_closing_date
  from job_postings
  where id = p_job_posting_id;

  if not found then
    raise exception 'JOB_NOT_FOUND';
  end if;

  if v_status <> 'open' or (v_closing_date is not null and v_closing_date < current_date) then
    raise exception 'JOB_CLOSED';
  end if;

  select id into v_applicant_id from applicants where lower(email) = lower(trim(p_email));

  if v_applicant_id is null then
    insert into applicants (
      first_name, middle_name, last_name, email, phone,
      address, province, city, barangay, resume_url, cover_letter
    )
    values (
      p_first_name, p_middle_name, p_last_name, lower(trim(p_email)), p_phone,
      p_address, p_province, p_city, p_barangay, p_resume_path, p_cover_letter
    )
    returning id into v_applicant_id;
  else
    if exists (
      select 1 from applications
      where applications.applicant_id = v_applicant_id and applications.job_posting_id = p_job_posting_id
    ) then
      raise exception 'DUPLICATE_APPLICATION';
    end if;

    update applicants
    set first_name = p_first_name,
        middle_name = p_middle_name,
        last_name = p_last_name,
        phone = p_phone,
        address = p_address,
        province = coalesce(p_province, province),
        city = coalesce(p_city, city),
        barangay = coalesce(p_barangay, barangay),
        resume_url = p_resume_path,
        cover_letter = coalesce(p_cover_letter, cover_letter),
        updated_at = now()
    where id = v_applicant_id;
  end if;

  insert into applications (applicant_id, job_posting_id)
  values (v_applicant_id, p_job_posting_id)
  returning id, applications.reference_code into v_application_id, v_reference_code;

  insert into application_history (application_id, event)
  values (v_application_id, 'submitted');

  return query select v_application_id, v_applicant_id, v_reference_code;
end;
$function$;

commit;
