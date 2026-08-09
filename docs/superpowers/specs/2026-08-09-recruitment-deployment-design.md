# Recruitment Pipeline — Slice 4: Hire → Employee → POS

Date: 2026-08-09
Status: Designed, not implemented
Module: HRMS · Recruitment / Employees (People)

## Context

Slice 3 ends with an application at `hired`. PROJECT_CONTEXT's Employee
Deployment workflow continues: *Hired → Employee Record → Assign Position →
Employee automatically becomes available inside POS.* This slice closes that gap
and is the point where recruitment finally feeds the rest of the platform.

## Backend that already exists (verified against jmac-suite)

- `deployment_records` — `application_id`, `deployment_date`, `branch_id`,
  `work_location_id`, `work_schedule_id`, `reporting_manager`, `assigned_branch`,
  `work_location`, `reporting_time`, `remarks`, `deployed_by`.
  Triggers: `trg_deployment_schedule_compatible`, `trg_set_updated_at`.
- `job_offers` — `application_id`, `proposed_salary`, `employment_type`,
  `salary_grade_id`, `start_date`, `benefits`, `working_hours/days`, `status`,
  `prepared_by`, `decline_reason/notes`. Triggers enforce employment-type
  inheritance/compatibility.
- `employment_contracts` — `job_offer_id`, `contract_file_url`, `status`,
  `start_date`, `signed_at`, `signed_by`, `terms`, `company_policies`.
- `respond_to_job_offer(reference_code, email, decision, …)` — **anon-callable**,
  already used by the HRMS applicant portal; our Track page can surface it.
- `employees.application_id` is the link from an application to its employee row.
  `employees` requires only `first_name`/`last_name` as non-defaulted NOT NULLs.
- Permissions `deployment.view` and `employee.create` are both held by
  System Administrator, Owner, General Manager, HR Manager, HR Staff.

**No new schema is required for 4a/4b.** Migration 0001's transition guard
already permits `hired → deployed` (that edge was kept deliberately because
offers are not implemented; remove it if 4c makes an offer mandatory).

## How the reference models it (integration/HRMS/.../useDeployment.ts, useEmployees.ts)

A "pending employee" is an application with `status = 'deployed'` that has **no**
`employees` row pointing at it (`usePendingEmployees` diffs those two sets).
Deployment does **not** create the employee; HR creates it afterwards with
`insert({ application_id, … })`. That two-step split is what makes the employee
record reviewable rather than auto-generated from applicant data.

## Increments

### 4a — Deployment (build first)

- Route `/dashboard/deployment`, gated `deployment.view`; nav item flips
  `planned → ready`.
- `src/services/deployment.ts`: `fetchHiredApplications()` (status `hired`,
  no deployment record yet), `deployApplicant(input)` — insert
  `deployment_records`, move the application to `deployed`, write
  `application_history`, all guarded on the expected status the way
  `interviews.ts` does.
- `DeploymentPage` + `DeployApplicantDialog` (deployment date, branch, work
  location, schedule, reporting manager, remarks), modelled on
  `InterviewsPage` + `ScheduleInterviewDialog`.
- Lookups: branches, work locations, work schedules. Confirm each is readable by
  the acting role before wiring the selects — the same
  security_invoker trap that made HR Staff see zero interviewers.

### 4b — Employee record (the POS hand-off)

- "Pending employees": `deployed` applications with no linked `employees` row.
- `createEmployeeFromApplication()` — insert `employees` with
  `application_id`, name/contact carried from `applicants`, plus
  position/department/branch and employment type/status.
- Surface on the existing Employees page (a "Pending" filter or banner) so the
  new hire appears where employees already live rather than in a new silo.
- **This is the POS hand-off**: once the employee row exists, POS consumes it —
  never duplicate the record (PROJECT_CONTEXT: *Never duplicate employee records*).

### 4c — Offers and contracts (optional, decide before building)

Slice 3 sets `hired` directly, and the applicant-facing `respond_to_job_offer`
RPC already exists. If offers become part of the flow: prepare offer → applicant
accepts/declines on the Track page → contract → then deploy. Requires deciding
whether `hired → deployed` should stop being legal (edit migration 0001).

## Verification plan

1. `tsc`, `lint`, `vitest run` with new service unit tests (mock Supabase, same
   `vi.hoisted` pattern as `interviews.test.ts`).
2. Extend `e2e/recruitment-pipeline.spec.ts` past `hired`: deploy the applicant,
   create the employee record, and assert the new employee appears on the
   Employees page — proving the whole chain from public application to POS-ready
   employee in one test.
3. Probe the new transitions with rolled-back psql transactions before trusting
   the UI, as was done for Slice 3.

## Constraints

No commit/push. No DB reset/reseed. Schema changes (if any) go in
`db/migrations/`. `integration/` untouched. No colour changes. FMS untouched.
Preserve POS behaviour — this slice feeds POS, it does not modify it.
