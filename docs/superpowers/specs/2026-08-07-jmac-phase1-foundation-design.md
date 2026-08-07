# JMAC Phase 1 — Enterprise Foundation

**Date:** 2026-08-07
**Status:** Approved
**Scope:** Design System · Shared Components · Layouts · Authentication · Landing Page

---

## 1. Context

JMAC is a new enterprise platform that absorbs two completed systems as business
modules. Those systems live in `integration/` as read-only references:

| | HRMS | POS | FMS |
|---|---|---|---|
| Path | `integration/HRMS/harmony-suite-phase2/harmony-suite` | `integration/POS` | `integration/FMS` |
| Framework | React 19, Vite 8, Tailwind v4 | React 18, Vite 5, Tailwind v3 | Next.js |
| Validation | Zod 4 | Zod 3 | — |
| Router | React Router 7 | React Router 6 | App Router |
| Supabase | local `harmony-suite`, port 55321 | local `sariswift-offline`, port 54321 | local, port 54321 |
| Identity | `profiles` + enum `admin \| hr_staff` | `store_memberships` + `stores`, roles `admin \| manager \| cashier` | — |

FMS is explicitly out of scope for this phase and is not referenced further.

### 1.1 Findings that shaped this design

Three facts, established by inspection, contradict assumptions in
`PROJECT_CONTEXT.md` and are resolved by decisions below.

**There is no single "current Supabase project."** HRMS and POS run on two
separate local Supabase stacks, on different ports, with two independent
`auth.users` tables and no shared schema. The instruction to "continue using the
current Supabase project" has no single referent. A shared database must be
established, not adopted.

**POS is multi-tenant; HRMS is single-org.** POS scopes every user to a store
through `store_memberships`, and its `AuthProvider` refuses sign-in without an
active membership. HRMS has no store concept — it organises people by
`departments` and `branches`. Reconciling `employees` with `store_memberships`
is required before the spec's "hired in HRMS → appears in POS" flow can work.
That reconciliation belongs to Phase 4, not Phase 1, but the Phase 1 identity
schema must not foreclose it.

**Role sets do not align.** Neither project has `pos_manager`. HRMS has `admin`
and `employee`, which `PROJECT_CONTEXT.md` omits. POS's `manager` is
store-scoped, not global.

### 1.2 Decisions taken

| Question | Decision |
|---|---|
| Auth backend | New unified JMAC Supabase project with a fresh schema |
| Role set | 6 roles: `admin`, `hr_manager`, `hr_staff`, `pos_manager`, `cashier`, `employee`. Applicants are a separate non-staff identity, defined in Phase 3 — they are not a `user_role` value and never appear in `profiles` |
| Permission enforcement (UI) | Static, typed role→capability map |
| Dark mode | Token-ready, light palette only shipped |
| Landing page careers | Full landing page with live `job_postings` data |

---

## 2. Architecture

### 2.1 Repository layout

The Vite application lives at the repository root. `integration/` remains a
sibling folder, excluded from TypeScript compilation and from Vite's file
watcher — without the exclusion the dev server crawls three separate
`node_modules` trees.

```
JMAC Enterprise/
├── src/
│   ├── app/              # App root, providers, error boundary
│   ├── components/       # Shared component library (§5)
│   ├── layouts/          # AppLayout, PublicLayout, AuthLayout (§6)
│   ├── modules/          # Feature modules — empty in Phase 1
│   ├── features/         # Landing page sections (§7)
│   ├── hooks/
│   ├── lib/              # supabase client, permissions, utils
│   ├── services/         # Data access, one file per domain
│   ├── contexts/         # AuthProvider, ThemeProvider
│   ├── router/
│   ├── types/
│   ├── utils/
│   ├── styles/           # tokens.css, index.css
│   └── assets/
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   └── seed.sql
├── docs/superpowers/specs/
└── integration/          # Reference only — never modified, git-ignored
```

`integration/` is git-ignored: it contains `node_modules`, `dist`, and a nested
`.git` (HRMS), none of which belong in this repository's history.

### 2.2 Stack

Versions match HRMS, which is already on every target the brief names. POS is
two major versions behind on React, Tailwind, Zod, and React Router; its logic
is **ported** in Phase 4, not copied.

- React 19.2, TypeScript 6, Vite 8
- Tailwind CSS v4 via `@tailwindcss/vite` (no `tailwind.config.ts`, no PostCSS)
- React Router 7, TanStack Query v5, TanStack Table v8
- React Hook Form 7 + Zod 4 via `@hookform/resolvers`
- Radix UI primitives, Framer Motion 12, lucide-react, sonner, Recharts
- `@fontsource/inter`, `@fontsource/ibm-plex-mono` (self-hosted)
- Vitest + Testing Library
- oxlint (matching HRMS)

---

## 3. Database

A new local Supabase project named `jmac` on **port 56321**. Ports 54321 and
55321 are occupied by POS and HRMS respectively; all auxiliary ports shift into
the 563xx band to match.

Phase 1 creates only what Phase 1 needs. `employees`, `attendance`, `leave`,
`payroll`, `products`, `inventory`, `sales`, and `orders` arrive in Phases 3
and 4.

### 3.1 `0001_identity.sql`

```sql
create type user_role as enum (
  'admin', 'hr_manager', 'hr_staff', 'pos_manager', 'cashier', 'employee'
);
create type account_status as enum ('active', 'inactive');

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  email         text not null unique,
  role          user_role not null default 'employee',
  status        account_status not null default 'inactive',
  avatar_url    text,
  last_login_at timestamptz,
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
```

Adapted from HRMS `20260713200311_initial_schema.sql:54`. Two deliberate
differences: the role enum is widened to six values, and `employee_id uuid` is
**omitted** rather than declared without a foreign key — the column is added in
Phase 3 alongside the `employees` table it points at, so the schema never
carries a dangling reference.

`status` defaults to `inactive`, following HRMS's
`20260715134502_default_new_profiles_to_inactive.sql`. A new signup cannot act
until an administrator activates it.

Also in this migration:

- `handle_new_user()` trigger on `auth.users` inserting the matching `profiles` row
- `is_admin()`, `has_role(user_role[])`, `is_active()` — `security definer`,
  `stable`, `set search_path = public`, following HRMS's hardening migrations
- A role-escalation guard: only `is_admin()` may change `profiles.role`
- RLS enabled on `profiles`; a user reads and updates their own row, admins read all

### 3.2 `0002_org.sql`

`departments`, `positions`, and `branches` — required as foreign keys by
`job_postings`, and shared by every later module. Shapes are taken from HRMS
`initial_schema.sql:121` and `:129`. `branches` is new: HRMS treats branches as
a lookup, and POS's `stores` will map onto it in Phase 4.

### 3.3 `0003_recruitment_public.sql`

```sql
create type employment_type      as enum ('full_time','part_time','contract','internship');
create type job_posting_status   as enum ('draft','open','closed');

create table job_postings (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  department_id   uuid not null references departments(id),
  position_id     uuid not null references positions(id),
  branch_id       uuid references branches(id),
  description     text not null,
  requirements    text,
  employment_type employment_type not null default 'full_time',
  vacancies       integer not null default 1 check (vacancies > 0),
  status          job_posting_status not null default 'draft',
  posted_by       uuid references profiles(id),
  date_posted     timestamptz,
  closing_date    date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
```

Adapted from `initial_schema.sql:153`, plus `branch_id` so a posting states
where the job is.

RLS grants `anon` and `authenticated` select **only** where `status = 'open'`,
following HRMS's `20260715030348_recruitment_public_access.sql`. The landing
page therefore never filters by status client-side — anything it can read is
already open. Writes are restricted to `hr_staff` and `admin`, matching
`canPostJobs()` in HRMS `roles.ts`.

`applicants`, `applications`, and the `submit_job_application` RPC are **not**
in Phase 1. The landing page lists positions and links to a "Careers" detail
view; the application form itself is Phase 3.

### 3.4 `seed.sql`

One admin account, three departments, four positions (HR Manager, HR Staff,
Store Manager, Cashier), one branch, and two `open` job postings — Cashier and
Manager, as the brief names. Seeded accounts for each of the six roles so the
permission matrix is manually verifiable.

---

## 4. Authentication

### 4.1 AuthProvider

Ports `integration/HRMS/.../src/contexts/AuthContext.tsx`, preserving three
behaviours that are earned rather than obvious:

1. **Deactivated accounts cannot sign in** even with valid credentials — the
   provider checks `profiles.status` after `signInWithPassword` and signs the
   session back out if it is not `active`.
2. **Unreachable backend is distinguished from bad credentials.** Reporting a
   dead Supabase URL as "wrong password" sends people hunting for a typo. The
   provider inspects the error status and says which failure occurred.
3. **`last_login_at` is written fire-and-forget**, so a failed audit write never
   blocks a valid login.

Added for JMAC: the provider exposes the derived `permissions` object (§4.2)
alongside `session` and `profile`, so consumers never re-derive it.

Supabase client follows HRMS `src/lib/supabase.ts` — a typed `createClient`
with `persistSession` and `autoRefreshToken`, throwing at module load if env
vars are missing.

### 4.2 Permissions

`src/lib/permissions.ts` exports a `Permissions` object derived from
`user_role`, merging two existing patterns: the predicate style of HRMS
`roles.ts` and the capability-object shape of POS `auth.tsx`.

```ts
export interface Permissions {
  // Module visibility — drives sidebar and route guards
  canAccessPeople: boolean
  canAccessSales: boolean
  canAccessReports: boolean
  canAccessAdministration: boolean
  canAccessSettings: boolean
  // Actions — HRMS separation of duties, preserved
  canApproveWork: boolean       // payroll release, leave decisions  → manager
  canPostJobs: boolean          // job board                          → hr_staff
  canPreparePayroll: boolean    // generate figures                   → hr_staff
  canScreenApplicants: boolean  // qualify/reject                     → hr_manager
  // POS actions
  canUsePOS: boolean
  canManageInventory: boolean
  canManageProducts: boolean
  canViewProfit: boolean
  // Cross-cutting
  canManageUsers: boolean
  canViewAuditLogs: boolean
}
```

The separation of duties HRMS encodes is preserved deliberately: an HR Manager
approves payroll and therefore must not generate it, and HR Staff runs the job
board while HR Manager screens applicants. These are not arbitrary — they keep
one person off both sides of a review.

| | admin | hr_manager | hr_staff | pos_manager | cashier | employee |
|---|---|---|---|---|---|---|
| People | ✓ | ✓ | ✓ | | | |
| Sales | ✓ | | | ✓ | ✓ | |
| Reports | ✓ | ✓ | | ✓ | | |
| Administration | ✓ | | | | | |
| Settings | ✓ | ✓ | | ✓ | | |
| Approve work | ✓ | ✓ | | | | |
| Post jobs | ✓ | | ✓ | | | |
| Prepare payroll | ✓ | | ✓ | | | |
| Screen applicants | ✓ | ✓ | | | | |
| Use POS | ✓ | | | ✓ | ✓ | |
| Manage inventory | ✓ | | | ✓ | | |
| View profit | ✓ | | | ✓ | | |
| Manage users | ✓ | | | | | |

This map is the single source of truth behind both the sidebar and the route
guards. It is **not** a security boundary — RLS is. Hiding a module is never
the only thing stopping someone.

### 4.3 Routes and guards

Exactly one page each, as the brief requires:

| Route | Layout | Access |
|---|---|---|
| `/` | Public | anyone |
| `/careers`, `/careers/:id` | Public | anyone |
| `/login` | Auth | anonymous only |
| `/forgot-password` | Auth | anonymous only |
| `/reset-password` | Auth | recovery token |
| `/dashboard` | App | authenticated + active |
| `/dashboard/*` | App | permission-gated |

- `<ProtectedRoute>` — redirects anonymous users to `/login`, preserving the
  attempted path for post-login return.
- `<RequirePermission permission="canAccessSales">` — renders a 403 state rather
  than redirecting, so a bookmarked URL explains itself.
- `<AnonymousOnly>` — sends signed-in users to `/dashboard`.

Route-level code splitting via `React.lazy` on every non-landing route.

`employee` signs in to `/dashboard` like everyone else — there is no second
portal application. In Phase 1 its permission set is empty of module access, so
it lands on a dashboard with no widgets. Self-service (own attendance, own
leave, own payslip) requires the `employees` table and arrives in Phase 3, at
which point `employee` gains self-scoped capabilities rather than a new route.

---

## 5. Design system

### 5.1 Token architecture

Two layers, following the pattern HRMS already uses in `src/index.css`: raw
brand values in `:root`, semantic aliases in `@theme inline`. Components
reference semantic names only.

```css
:root {
  /* Brand — from PROJECT_CONTEXT.md */
  --jmac-navy:    #0F172A;
  --jmac-blue:    #1D4ED8;
  --jmac-sky:     #38BDF8;
  --jmac-canvas:  #F8FAFC;
  --jmac-surface: #FFFFFF;
  --jmac-line:    #E2E8F0;
  --jmac-body:    #64748B;
  --jmac-success: #22C55E;
  --jmac-warning: #F59E0B;
  --jmac-error:   #EF4444;
}

@theme inline {
  --color-background:  var(--jmac-canvas);
  --color-surface:     var(--jmac-surface);
  --color-border:      var(--jmac-line);
  --color-primary:     var(--jmac-navy);
  --color-primary-hover: var(--jmac-blue);
  --color-accent:      var(--jmac-sky);
  --color-heading:     var(--jmac-navy);
  --color-body:        var(--jmac-body);
  /* … success / warning / error, foregrounds, ring */
}
```

No component uses a literal hex value. That constraint is what makes dark mode
a later stylesheet block rather than a sweep through every file. A
`ThemeProvider` and `@custom-variant dark` ship in Phase 1 holding the
contract; only the light palette is defined.

**Known issue, implemented as specified.** `PROJECT_CONTEXT.md` pairs primary
`#0F172A` (navy) with primary-hover `#1D4ED8` (blue). That is a hue change, not
a shade change — primary buttons visibly switch colour family on hover, which
is unusual for enterprise UI. It is implemented as written. Changing hover to a
navy tint would be a one-line token edit.

### 5.2 Scales

- **Radius** `--radius: 0.5rem`, with `sm`/`lg`/`xl` derived. Tighter than
  HRMS's 0.75rem: the brief names SAP Fiori and Microsoft 365, which are
  squarer than Harmony Suite.
- **Elevation** three levels only. `PROJECT_CONTEXT.md` explicitly rejects
  large shadows; borders carry most separation.
- **Spacing** Tailwind's default 4px scale, unmodified.
- **Type** Inter 400/500/600/700 for UI; IBM Plex Mono 500 for tabular figures
  — currency and counts must align in table columns.

### 5.3 Motion

Framer Motion, used sparingly. Page transitions ≤ 200ms, overlays 150ms,
`ease-out` on enter and `ease-in` on exit. All motion respects
`prefers-reduced-motion`. The brief says "avoid excessive animations"; the
default answer is no animation.

---

## 6. Shared components

28 components, hand-authored on Radix primitives following shadcn conventions.
Hand-authored rather than CLI-generated for two reasons: it matches HRMS, and
the brief requires avoiding shadcn's default appearance — customising generated
files drifts from the registry anyway.

| Group | Components |
|---|---|
| Primitives | Button, Input, Textarea, Select, Checkbox, Radio, Switch, Badge, Avatar, Label |
| Overlays | Dialog, Drawer, Dropdown, Popover, Tooltip, Toast |
| Data display | Card, StatCard, Table, DataTable, Pagination, Tabs, Breadcrumb, Charts |
| Feedback | Loader, Skeleton, EmptyState, ErrorState |
| Date | Calendar, DatePicker |

`DataTable` wraps TanStack Table with sorting, global search, column filtering,
pagination, and column-visibility toggles, taking a `ColumnDef[]` and data.
Every feature table in Phases 3–6 consumes it; no feature page rebuilds table
behaviour. `Charts` wraps Recharts with the JMAC palette pre-applied.

Every component is typed, forwards refs, spreads `...props` to its root, and
composes via `className` through `cn()`. No component reads global state.

---

## 7. Layouts and landing page

### 7.1 Layouts

- **AppLayout** — Sidebar + Header + Breadcrumb + content outlet. Desktop:
  sidebar expanded at 264px. Tablet: 64px icon rail. Mobile: drawer over a
  scrim. Header carries global search, the notification panel trigger, and the
  user menu.
- **PublicLayout** — landing and careers; marketing header, full-width footer.
- **AuthLayout** — centred card, JMAC mark, no navigation.

Sidebar navigation is generated from a single typed `NavItem[]` where each item
declares the permission key it requires, filtered through §4.2. A role that
cannot access Sales never renders a Sales entry.

### 7.2 Landing page

Sections in order: Hero · Features · Business Modules · Dashboard Preview ·
Careers with live Open Positions · Testimonials (placeholder) · FAQ · Contact ·
Footer. Buttons: Login, Explore Platform, Careers.

Open Positions queries `job_postings` through a TanStack Query hook whose shape
follows HRMS `usePublicCareers.ts` — same select with `departments(name)` and
`positions(title)` joined, same `date_posted` ordering, same 60s `staleTime`,
and the same `isPastClosingDate` / `isAcceptingApplications` helpers, which are
pure functions and port verbatim.

`validateResumeFile` and `useSubmitApplication` are **not** ported in Phase 1 —
they belong with the application form in Phase 3.

The Dashboard Preview section is a static, non-interactive rendering of real
JMAC components. It is presentation, not a live dashboard.

---

## 8. Testing and verification

Vitest + Testing Library. Phase 1 tests cover logic, not pixels:

- `permissions.ts` — the full role→capability matrix in §4.2, asserted exhaustively
- Route guards — anonymous redirect, insufficient-permission 403, active-status check
- `isPastClosingDate` / `isAcceptingApplications` — boundary dates
- `DataTable` — sorting, filtering, and pagination against a fixture

### 8.1 Success criteria

Phase 1 is done when all of the following hold:

1. `npx tsc -b` reports no errors
2. `npm run build` succeeds
3. `npm test` passes
4. `npx supabase db reset` applies all three migrations and the seed cleanly
5. Signing in as each of the six seeded roles shows exactly the navigation the
   §4.2 matrix predicts, and no more
6. A signed-out visitor loads `/` and sees the two seeded job postings rendered
   from the database
7. A deactivated account is refused at login with an explanatory message
8. The app renders correctly at 1440px, 768px, and 375px with no horizontal scroll
9. No file under `integration/` has been modified — verified by comparing a
   recursive file listing with modification timestamps taken before Track 1
   begins

---

## 9. Implementation tracks

One spec, four sequenced tracks with a checkpoint after each. Each track ends
in a working, verifiable state.

| Track | Contents | Verified by |
|---|---|---|
| 1. Foundation | Vite app, tooling, tokens, Supabase project, three migrations, seed | Criteria 1, 2, 4 |
| 2. Components | 28 shared components + tests | Criteria 1–3 |
| 3. Layouts & auth | Three layouts, sidebar, header, AuthProvider, permissions, guards, three auth pages | Criteria 5, 7, 8 |
| 4. Landing & careers | Nine landing sections, careers list and detail, live data | Criteria 6, 8 |

---

## 10. Explicitly out of scope

Named here so they are not silently assumed:

- Any modification to `integration/`
- FMS, in any form
- Module dashboards — there is one dashboard, permission-driven
- `employees`, `attendance`, `leave`, `payroll` schemas (Phase 3)
- `products`, `inventory`, `orders`, `sales` schemas (Phase 4)
- Applicant accounts, resume upload, application submission and tracking (Phase 3)
- Reconciling POS `store_memberships` with `employees` (Phase 4)
- Migrating existing HRMS or POS data into the JMAC database
- Dark palette values
- Deployment to Vercel
