# Recruitment Pipeline — Slice 2: HR Screening

Date: 2026-08-09
Status: Approved (design), implementation pending
Module: HRMS · Recruitment (People)

## Context

Slice 1 (public Apply flow) lets candidates submit applications. Those land as
`applications` rows with status `submitted` and nothing acts on them. This slice
gives HR the screening surface: review each application and move it to
`qualified` or `rejected`.

## Goal

An HR Manager (holder of `applicant.screen`) opens `/dashboard/recruitment`,
reviews submitted applications with the applicant's details and résumé, and
qualifies or rejects each one. Qualified applications are the input to Slice 3
(Interviews).

## Backend (already exists — no changes)

- `applications` (`applications_staff_all` — staff full access), status enum
  incl. `submitted`, `qualified`, `rejected`.
- Trigger `protect_application_screening`: `submitted → qualified|rejected`
  requires `is_hr_manager_or_admin()` (= `leave.approve OR payroll.approve`).
  The UI gate is `applicant.screen`; the DB is the real enforcer.
- `application_history` (`application_history_staff_all`, staff INSERT): columns
  `application_id` (NN), `event` (NN, free text), `notes`, `actor_id`.
- `applicants.resume_url` holds the storage path (set by
  `submit_job_application`); bucket `resumes` is private with
  `staff_can_read_resume` → `createSignedUrl` works for staff.
- `applicant.screen` held by HR Manager, General Manager, Owner, System
  Administrator.

No migration/RLS/trigger/function change.

## Frontend

### New files

- `src/lib/applicationLabels.ts` — `APPLICATION_STATUS_LABEL: Record<status,
  string>` and `APPLICATION_STATUS_BADGE: Record<status, BadgeVariant>` for
  every value of `application_status`. A test asserts full enum coverage (guard
  against an unlabelled raw status rendering).
- `src/services/recruitment.ts`:
  - `fetchApplications(): Promise<ApplicationRow[]>` — select with `applicants`
    (name, email, phone, address parts, resume_url, cover_letter) and
    `job_postings → positions(title), departments(name)`, ordered newest first.
  - `fetchApplicationStats()` — head/count queries for `submitted`,
    `qualified`, `rejected`.
  - `qualifyApplication(id)` — update `status='qualified'`, `reviewed_by` (auth
    uid), `reviewed_at`; then insert `application_history` `event:'qualified'`.
  - `rejectApplication(id, reason)` — update `status='rejected'`,
    `rejection_reason`, `reviewed_by`, `reviewed_at`; then insert history
    `event:'rejected'`, `notes:reason`.
  - `resumeSignedUrl(path)` — `storage.from('resumes').createSignedUrl(path,
    300)`.
  - query keys: `applicationsQueryKey`, `applicationStatsQueryKey`.
  - `reviewerId()` helper (auth uid), same shape as `leave.ts`.
- `src/features/people/RecruitmentPage.tsx` — header + compact stat row
  (New/Qualified/Rejected) + status filter (All/New/Qualified/Rejected) +
  `DataTable` (Applicant · Position · Department · Status badge · Applied). Row
  click opens the detail sheet.
- `src/features/people/recruitment/ApplicantDetailSheet.tsx` — applicant
  contact + address + cover letter + "View résumé" (signed URL, opens in a new
  tab) + position/status. Qualify / Reject-with-reason actions shown only while
  `status === 'submitted'`. Reject reason via a small confirm within the sheet
  (reuse the `ReviewLeaveDialog` reason-entry shape).
- `src/services/recruitment.test.ts` — mocked-Supabase tests for qualify,
  reject (incl. history writes), stats, and label coverage.

### Modified files

- `src/router/routes.tsx` — add protected route `/dashboard/recruitment` under
  `RequirePermission permission="applicant.screen"`, lazy-loaded.
- `src/router/navigation.ts` — Recruitment item `status: 'planned'` → `'ready'`.

### Reused unchanged

`DataTable`, `Sheet`, `Badge`, `Button`, `Select`, `EmptyState`, `ErrorState`,
`Skeleton`, `Loader`, the `applications`/`application_history` tables, the
`resumes` bucket. Patterns modelled on `LeavePage` + `ReviewLeaveDialog` +
`EmployeeDetailSheet`.

### Untouched

`integration/`, DB schema/RLS/functions/triggers, UI color tokens, FMS.

## Data flow

```
/dashboard/recruitment (applicant.screen)
  fetchApplications() + fetchApplicationStats()
  → DataTable (filter by status)
     row → ApplicantDetailSheet
        View résumé → resumeSignedUrl(applicants.resume_url) → new tab
        Qualify  → qualifyApplication(id)  [DB trigger checks HR Manager]
        Reject   → rejectApplication(id, reason)
        → invalidate applications + stats
```

## Error handling

- Résumé signed-URL failure → inline "couldn't open résumé"; no crash.
- Qualify/Reject blocked by the trigger (caller lacks manager rights) → surface
  the DB message via toast.
- Empty list / error / loading → EmptyState / ErrorState / Skeleton.

## Testing / verification

1. `tsc --noEmit` clean.
2. `vitest run` — all pass incl. `recruitment.test.ts`.
3. Live browser: sign in as an HR Manager, open Recruitment, confirm the
   submitted application(s) from Slice-1 testing list, open the sheet, view the
   résumé, and (optionally) qualify one — a real status change + history row
   (the feature working; flagged for optional revert).

## Out of scope (later slices)

Interview scheduling (Slice 3), offers/hiring/deployment (Slice 4), realtime
toasts, `under_review` step, history timeline display, résumé preview inline.

## Constraints honored

No commit/push. No DB reset/schema change. No `integration/` edits. No UI color
changes. FMS untouched.
