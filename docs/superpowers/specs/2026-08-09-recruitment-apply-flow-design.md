# Recruitment Pipeline — Slice 1: Public Apply Flow

Date: 2026-08-09
Status: Approved (design), implementation pending
Module: HRMS · Recruitment (People)

## Context

Job Posting (draft/publish/close) and the public Careers listing exist, but the
recruitment pipeline is half-open: a posted job has nowhere for a candidate to
apply. The `applicants`, `applications`, and `interviews` tables exist but are
empty. This slice builds the public application submission so applicants and
applications get created — the input every downstream recruitment screen needs.

Recruitment is decomposed into four slices, each its own design → build cycle:

1. **Public Apply flow** ← this spec
2. HR screening (Recruitment page: triage applications, move status, notes)
3. Interviews (schedule + rate initial/final, advance status)
4. Offer → Hire → Deploy (offers, contracts, create employee, assign position → POS)

## Goal

A public visitor viewing an open job at `/careers/:id` can apply: submit their
details + résumé and receive a reference code to track the application later
(tracking page itself deferred to a later slice).

## Backend (already exists — no changes)

- **RPC `submit_job_application(p_job_posting_id, p_first_name, p_last_name,
  p_email, p_phone, p_address, p_resume_path, p_cover_letter, p_middle_name,
  p_province, p_city, p_barangay)`** — atomic; inserts the applicant + the
  application, auto-generates `applications.reference_code` via
  `generate_application_reference()`. Returns the created row(s) incl.
  `reference_code`.
- **Storage bucket `resumes`** (private) with policy `anyone_can_upload_resume`
  (anon INSERT) and `staff_can_read_resume` (staff SELECT).
- **Table `ph_locations`** (43,747 rows: 84 provinces / 1,634 cities / 42,029
  barangays), columns `id, parent_id, level, name, code`; RLS
  `ph_locations_public_read (SELECT, public, USING true)` — anon-readable.
- RLS: `anon_submit_applicant`, `anon_submit_application` allow the anonymous
  insert path the RPC runs.

No migration, RLS, function, or trigger change is required.

## Frontend

### New files (JMAC design system)

- `src/hooks/useLocations.ts` — `useProvinces()`, `useCities(provinceId)`,
  `useBarangays(cityId)`, querying `ph_locations` by `level` + `parent_id`
  (ported from the HRMS reference; logic reuse). 1-hour `staleTime`.
- `src/components/AddressFields.tsx` — cascading Province → City/Municipality →
  Barangay `Select`s plus a free-text street `Input`. Stores **names** (not
  ids); ids are local cascade state. Restyled to JMAC tokens
  (`text-heading`/`text-body`/`text-muted-foreground`/`border-border`), JMAC
  `Select`/`Input`/`Label`.
- `src/services/applications.ts`:
  - `validateResumeFile(file): string | null` — PDF/DOC/DOCX, ≤ 5 MB.
  - `submitApplication(input): Promise<{ referenceCode: string }>` — upload the
    résumé to `resumes` at a collision-safe path, then call
    `submit_job_application`, returning the reference code.
- `src/features/careers/ApplyPage.tsx` — the form. React Hook Form + Zod:
  letters-only names (first/middle/last), email, PH mobile `^09\d{9}$`, address
  (via AddressFields), résumé (required, validated), optional cover letter
  (≤ 2000). Live input sanitizers for names and phone. Loading/submit-error
  states. On success, navigate to the success page with `referenceCode` +
  `email` + job title in router state. Guards: posting missing → not-found;
  posting not accepting → closed message.
- `src/features/careers/ApplicationSuccessPage.tsx` — confirmation: reference
  code (prominent, copyable) + the email used, and a note to save it for
  tracking. If reached without router state, redirect to `/careers`.
- `src/services/applications.test.ts` — unit tests for `validateResumeFile`
  (type/size) and `submitApplication` (mock `supabase.storage.from().upload`
  and `supabase.rpc`), following `careers.test.ts`.

### Modified files

- `src/router/routes.tsx` — add **public** routes (same public wrapper as
  `/careers`): `/careers/:id/apply` → `ApplyPage`, `/careers/application-success`
  → `ApplicationSuccessPage`. Lazy-loaded like the others.
- `src/features/careers/CareersPage.tsx` — on the detail view
  (`CareerDetailPage`), add an "Apply for this role" CTA linking to
  `/careers/:id/apply`, shown only while `isAcceptingApplications(posting)`.

### Reused unchanged

`submit_job_application` RPC, `resumes` bucket, `ph_locations`, `careers.ts`
(`fetchOpenPosition`, `isAcceptingApplications`, `EMPLOYMENT_TYPE_LABEL`), JMAC
UI components (`Select`, `Input`, `Label`, `Button`, `Textarea`, `Card`,
`Badge`, `Skeleton`, `EmptyState`).

### Explicitly untouched

`integration/`, database schema/RLS/functions/triggers, UI color tokens.

## Data flow

```
/careers/:id (CareerDetailPage)
  └─ "Apply for this role" → /careers/:id/apply (ApplyPage)
       fill form (name, email, phone, AddressFields, résumé, cover letter)
       submit:
         1. validateResumeFile(file)
         2. supabase.storage.from('resumes').upload(path, file)   [anon]
         3. supabase.rpc('submit_job_application', {...path, ...fields})  [anon]
            → applicant + application inserted, reference_code generated
       → /careers/application-success  (referenceCode, email, jobTitle)
```

## Error handling

- Résumé missing or wrong type/size → inline field error; no submit.
- Storage upload failure → submit error banner; nothing inserted (RPC not
  called).
- RPC error → submit error banner; the uploaded résumé path is orphaned in the
  bucket (acceptable for this slice; staff-only bucket, no data integrity
  impact). A cleanup pass can be a later concern.
- Success page without router state → redirect to `/careers`.

## Testing / verification

1. `npx tsc --noEmit` — clean.
2. `npx vitest run` — all pass incl. new `applications.test.ts`.
3. Live browser run: open an accepting posting → Apply → submit → success page
   shows a reference code. Confirms one real `applicants` + `applications` row
   and one `resumes` object are created (the feature working, additive — not a
   reseed). The created test row will be flagged for optional removal.

## Out of scope (later slices)

Track Application page, HR screening, interviews, offers, hiring, deployment,
résumé cleanup on failed submit, address as ids/foreign keys.

## Constraints honored

No commit/push. No DB reset/reseed/schema change. No `integration/` edits. No
UI color changes. FMS untouched.
