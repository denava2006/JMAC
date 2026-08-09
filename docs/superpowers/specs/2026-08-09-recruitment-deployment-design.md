# Recruitment Pipeline - Offer to Employee Handoff

Date: 2026-08-09

Status: Increment A implemented locally; Increments B-D remain fail-closed

Module: HRMS - Recruitment / Employees (People)

## Outcome and required order

Slice 3 ends with an application at `hired`. The approved continuation is now
mandatory and must run in this order:

```text
hired -> pending job offer -> applicant accepts -> contract generated
      -> signed copy recorded -> deployment -> employee record
```

An application may not move directly from `hired` to `deployed`. Creating an
HRMS employee record is the last outcome currently in scope; it does not by
itself create a POS login, role, or store membership.

## Increment A decisions

The following decisions are implemented by `db/migrations/0002_atomic_job_offers.sql`:

1. One pending or accepted offer may exist for an application. Declined offers
   remain as immutable history.
2. HR may prepare a revision only after the latest live offer has been
   declined. An identical retry of a still-pending offer returns the existing
   offer ID and creates no duplicate history.
3. Offer preparation is authorized by `deployment.manage`, not by broad
   active-staff table access.
4. `prepare_job_offer(...)` owns the transaction. It locks the application,
   inserts the pending offer, moves `hired -> offered`, and writes
   `job_offer_prepared` atomically.
5. Employment type, PHP currency, schedule snapshots, and the actor are derived
   by the database. The client cannot supply them.
6. Salary grade and work schedule must match the posting employment type.
   Salary must be positive and within the selected grade. Start date must be
   later than the current date.
7. `respond_to_job_offer(...)` locks the application and current offer before a
   guarded pending-to-accepted/declined update, so two responses cannot both
   succeed. The application remains `offered`; Increment B consumes the current
   accepted offer.
8. Direct authenticated mutations of `job_offers` are revoked. Authorized HR
   users retain read access through a permission-scoped SELECT policy.
9. Deployment remains fail-closed. Migration 0002 removes both
   `hired -> deployed` and `offered -> deployed`; Increment C must add back only
   the accepted-offer plus signed-contract transition.

The local database had zero offers when migration 0002 was applied, so the new
required-field constraints and live-offer uniqueness rule did not require a
data backfill.

## Increment A application behavior

### HR preparation

- Recruitment includes Hired and Offered filters.
- A user with `deployment.manage` can open a hired applicant and prepare an
  offer. A declined offered applicant exposes the revised-offer action.
- The form shows the posting employment type and PHP currency as read-only.
- Salary grade and schedule options are filtered by posting employment type.
- Grade, in-range monthly salary, schedule, and a future start date are
  required. Benefits, additional compensation, and internal notes are optional.
- The service makes one `prepare_job_offer` RPC call; it does not perform direct
  offer, application, or history writes.

### Applicant response

- The public tracking page displays the latest offer terms.
- A pending offer can be accepted or declined. Decline requires one of the
  fixed reasons and permits optional notes.
- The response service normalizes the reference/email and calls only the
  existing five-argument `respond_to_job_offer` RPC.
- After a successful response the page refetches the tracked application and
  removes the response actions.

## Existing backend used by later increments

- `employment_contracts`: offer link, file path, status, start date, signed
  timestamp/signer, terms, and policies.
- Private `contracts` storage bucket: staff upload/read only; there is no client
  delete policy, so upload-success/database-failure recovery still needs an
  explicit design.
- `deployment_records`: application, date, branch, work location, schedule,
  manager snapshot, remarks, and actor.
- `employees.application_id`: intended recruitment link, but not yet unique.
- Existing application-history events include offer, contract, deployment, and
  close events.

## Remaining increments

### Increment B - Contract

- Begin only from the current accepted offer.
- Decide whether contracts are one-per-offer or revisioned; prevent duplicate
  current contracts either way.
- Enforce draft -> printed -> signed in the database.
- A signed contract must have a private storage path, signing timestamp, and
  signer. Start date comes from the accepted offer.
- Define idempotent upload retry/cleanup behavior before enabling the UI.
- Keep status, contract row, and history changes atomic where they share the
  database. Do not ignore history failures.

### Increment C - Deployment

- Do not wire the retained deployment scaffold into routing/navigation as-is.
- Require the current accepted offer and signed contract before both inserting
  a deployment record and moving `offered -> deployed`.
- Derive deployment date from the accepted offer start date; it is read-only.
- Require branch, a location belonging to that branch, and a compatible work
  schedule.
- Resolve the reporting-manager directory/ID model before building its picker.
- Perform record insertion, application transition, and history insertion in
  one permission-scoped transaction/RPC.

### Increment D - Employee record

- Pending employees are valid deployed applications without a linked employee.
- Add database-backed uniqueness for `employees.application_id` before enabling
  creation.
- Create or return the existing employee atomically and map only approved
  applicant, posting, accepted-offer, and deployment fields.
- Map offer type `regular -> full_time` and `part_time -> part_time`; the offer
  and employee enums are not the same.
- Surface pending records on the existing Employees page.
- Treat POS account/role/store membership as a separate decision unless the
  user explicitly expands the definition of POS handoff.

## Legacy and deferred decisions

- Four legacy deployed applications have deployment records but no accepted
  offer or signed contract. Leave them unchanged until the user chooses hide,
  display-as-legacy, or explicit backfill.
- Reporting manager is currently nullable text, while only one branch has a
  manager ID. A safe manager directory and storage model are still unresolved.
- Repeat applications reuse one applicant row, so later applicant contact and
  document changes can rewrite evidence shown for older applications. This is a
  separate data-model issue and has no safe frontend-only correction.

## Verification standard

1. Validate every migration in an explicit rollback transaction, then apply it
   once without resetting or reseeding the database.
2. Use service/unit tests for validation, authoritative RPC payloads, and error
   mapping; keep database contract tests read-only.
3. Use an explicit psql `BEGIN`/`ROLLBACK` fixture probe for atomic success and
   failure paths. Do not consume live hired applications.
4. Keep regular Playwright coverage deterministic and non-mutating by mocking
   offer lookup/response/preparation requests.
5. Finish each increment with typecheck, lint, full unit tests, database
   contracts, build, focused Playwright, smoke tests, and `git diff --check`.

## Constraints

No commit or push. No database reset/reseed. `integration/` is read-only. FMS
and unrelated POS/UI behavior stay untouched. Schema changes belong in forward
migrations under `db/migrations/`.
