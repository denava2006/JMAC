# Recruitment Pipeline — Slice 3: Interviews

Date: 2026-08-09
Status: Approved (design), implementation pending
Module: HRMS · Recruitment (People)

## Context

Screening (Slice 2) produces `qualified` applications. This slice runs the
two-round interview process that turns a qualified applicant into a `hired` one
(or rejects them). Slice 4 then converts `hired` into an employee record.

## State machine (enforced by DB triggers — cannot be shortcut)

```
qualified
  → [schedule initial]        interview row (initial, self-assigned) ; app.status = interview_scheduled
  → [evaluate initial]
        fail → app.status = rejected
        pass → app.final_interviewer_id = <an HR Manager/admin>   (still interview_scheduled)
  → [schedule final]          interview row (final) — only the final interviewer may insert
  → [evaluate final]
        fail → app.status = rejected
        pass → app.status = hired      (only the final interviewer may set this)
```

Relevant rules:
- `interviews_insert_owner`: `interviewer_id = auth.uid()`; initial by any staff,
  final only by the application's `final_interviewer_id`.
- `interviews_update_owner`: only the interview's own interviewer.
- `protect_final_interviewer_assignment`: `final_interviewer_id` must be an
  active `hr_manager`/`admin`; reassignment is admin-only.
- `protect_interview_ownership`: `→ hired` requires the passed final interview's
  interviewer; `interview_scheduled → rejected` requires the failed interview's
  interviewer.

`admin@jmac.com` (role `admin`) satisfies all of these, so one account can drive
the whole flow — important for Playwright.

## Scope decisions

- **Evaluation = pass/fail + notes only** (user choice). Rating columns stay
  null. Rejection needs a reason.
- Skip the reference's separate "mark completed" step — evaluate sets the
  interview straight to `passed`/`failed`.
- Skip realtime toasts.

## Backend (exists — no changes)

`interviews` table, `application_status`/`interview_status`/`interview_type`
enums, `application_history` (staff insert), the triggers above. Final
interviewers come from `profiles` where `role in ('hr_manager','admin')` and
`status='active'`.

## Frontend

### New files

- `src/lib/interviewLabels.ts` — `INTERVIEW_STATUS_LABEL/VARIANT`,
  `interviewStatusLabel/Variant`, `INTERVIEW_STAGE_LABEL`.
- `src/services/interviews.ts`:
  - types `InterviewRecord`, `InterviewApplication`.
  - `fetchInterviewQueue()` — applications in
    `['qualified','interview_scheduled','hired','rejected']` with applicants,
    job_postings→positions/departments, and `interviews`.
  - `scopeInterviewQueue(rows, role, profileId)` — pure filter: admin → all;
    hr_manager → my `final_interviewer_id`; else → unassigned; and drop
    `rejected` rows that never had an interview.
  - `fetchInterviewStats()` — scheduled / hired / rejected counts.
  - `fetchFinalInterviewers()` — active `hr_manager`/`admin` profiles.
  - `scheduleInterview(input)`, `submitInitialEvaluation(input)`,
    `submitFinalEvaluation(input)` — writes + `application_history`.
  - `interviewQueueQueryKey`, `interviewStatsQueryKey`.
- `src/features/people/InterviewsPage.tsx` — stats + queue table + detail sheet;
  gated `interview.manage`; queue scoped by the signed-in profile.
- `src/features/people/interviews/InterviewDetailSheet.tsx` — applicant + both
  rounds + the single contextual next action.
- `src/features/people/interviews/ScheduleInterviewDialog.tsx` — datetime (no
  past), mode (online/face-to-face), meeting link or location, notes.
- `src/features/people/interviews/EvaluateInterviewDialog.tsx` — pass/fail +
  notes; fail needs a reason; initial-pass picks the final interviewer.
- `src/services/interviews.test.ts` — schedule, both evaluations (pass/fail),
  `scopeInterviewQueue`, label coverage.

### Modified

- `src/router/routes.tsx` — `/dashboard/interviews`, gated `interview.manage`.
- `src/router/navigation.ts` — Interviews `planned → ready`.

### Reused / untouched

DataTable, Drawer, Dialog, Badge, Button, Select, Textarea, Input. `integration/`,
DB schema/RLS/triggers, colors, FMS — untouched.

## Error handling

Trigger/RLS rejections (wrong actor for schedule/hire/reject) surface via toast.
Loading/empty/error use the shared states.

## Verification

1. `tsc --noEmit`, `vitest run` (incl. `interviews.test.ts`).
2. Live Playwright as `admin@jmac.com`: qualify an applicant, then schedule
   initial → pass (assign self) → schedule final → pass → **hired**. Asserts the
   status reaches Hired and `application_history` records the steps.

## Out of scope (Slice 4)

Turning `hired` into an employee record + position assignment (Deployment).

## Constraints honored

No commit/push, no DB/schema/RLS changes, no `integration/` edits, no color
changes, FMS untouched.
