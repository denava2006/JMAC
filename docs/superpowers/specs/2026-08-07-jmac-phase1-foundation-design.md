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

Facts established by inspection that contradict assumptions in
`PROJECT_CONTEXT.md`, and are resolved by decisions below.

**The unified database already exists.** *(Corrected 2026-08-07, during Track 1
execution. The original finding — that HRMS and POS run on two separate stacks
with no shared schema — is true of the two apps in `integration/`, whose env
files were the evidence. It was not the whole picture.)*

A third Supabase stack, `jmac-suite`, has been running on this host since
2026-08-02 and holds a **70-table unified schema**: HRMS, POS, Finance, and a
complete role/permission layer. It occupies ports 56321–56327. This is
substantially the shared database `PROJECT_CONTEXT.md` describes, already built.
JMAC adopts it. No new schema is authored in Phase 1.

Its architecture, established by inspection:

| Object | Role |
|---|---|
| `users` | The real identity table. RLS enabled, 6 policies. |
| `profiles` | A **view** over `users`, not a table. Maps the new RBAC back to HRMS's legacy `user_role` enum via `hr_role_for(id)` and collapses 4-state `account_status` to `active`/`inactive`. A deliberate compatibility shim so HRMS's existing queries keep working. |
| `roles` | 11 ranked roles: `system_administrator`, `owner`, `general_manager`, `hr_manager`, `finance_manager`, `pos_manager`, `accountant`, `hr_staff`, `finance_staff`, `cashier`, `employee`. |
| `permissions` | 79 keyed permissions (`applicant.screen`, `attendance.approve`, …), each bound to a module. |
| `user_roles` | Many-to-many. One user holds several roles — the seeded `manager@jmac.com` is `hr_manager` + `pos_manager` + `finance_manager`. |
| `modules` | 4: `core`, `hrms`, `pos`, `finance`, each with path, icon, and sort order. |
| Helpers | `has_permission()`, `has_module_access()`, `my_permissions()`, `my_roles()`, `is_admin()`, `is_active_staff()`, `is_hr_staff_or_admin()`, `is_hr_manager_or_admin()`, `current_role_rank()`, `prevent_self_role_escalation()` |

The owning project directory could not be located anywhere on this host — no
`config.toml` names `jmac-suite`. The stack is orphaned from its source, so this
repository must treat it as **infrastructure it connects to, never infrastructure
it manages**. See §3.

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
| Auth backend | ~~New unified JMAC Supabase project with a fresh schema~~ → **Adopt the existing `jmac-suite` database** (revised 2026-08-07, §1.1) |
| Role set | ~~6 roles~~ → **the 11 roles already in `public.roles`**, assigned many-to-many through `user_roles`. The originally chosen six are all present; the schema adds `owner`, `general_manager`, `finance_manager`, `accountant`, `finance_staff`, and renames `admin` to `system_administrator`. |
| Permission enforcement (UI) | ~~Static, typed role→capability map~~ → **the database's 79-permission model**, read once at login via `my_permissions()`. See §4.2. |
| Dark mode | Token-ready, light palette only shipped |
| Landing page careers | Full landing page with live `job_postings` data |

Two decisions were revised because their premise changed, not because the
reasoning was wrong. A static permission map is the better choice when you own
the schema; it is the wrong choice against a database that already ships 79
permissions, a `role_permissions` join, and per-user overrides — a hand-written
map would be a second source of truth guaranteed to drift from the first.

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
├── tests/
│   ├── setup.ts
│   └── db/               # Integration tests against the live jmac-suite stack
├── docs/superpowers/specs/
└── integration/          # Reference only — never modified, git-ignored
```

There is deliberately **no `supabase/` directory**. See §3.1.

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

JMAC connects to the existing `jmac-suite` stack. **Phase 1 authors no schema
and runs no migrations.** The tables this phase needs — `users`, `roles`,
`permissions`, `user_roles`, `modules`, `departments`, `positions`, `branches`,
`job_postings` — all exist, with RLS policies already in place.

| Endpoint | Value |
|---|---|
| API | `http://127.0.0.1:56321` |
| Database | `postgresql://postgres:postgres@127.0.0.1:56322/postgres` |
| Studio | `http://127.0.0.1:56323` |
| Anon key | The standard Supabase local development key |

### 3.1 This repository does not manage the stack

`jmac-suite` predates this repository and no project directory on this host
owns it. Its schema exists only in the running Postgres volume — there are no
migrations to replay it from.

Therefore this repository deliberately contains **no `supabase/` directory**.
A `supabase/config.toml` here would make `supabase db reset` a single command
away from dropping 70 tables of live data with no migration set to rebuild
them. The risk is not hypothetical: `db reset` is the normal way to apply a
migration, and it is destructive by design.

Consequences, all intentional:

- No `db:reset`, `db:start`, or `db:stop` scripts in `package.json`.
- Type generation runs against the database URL directly, not `--local`.
- Schema changes in later phases require a decision about migration ownership
  that Phase 1 does not make.

### 3.2 What Phase 1 reads

**Identity.** `public.users` is the identity table. `public.profiles` is a view
over it, shaped for HRMS compatibility. The application reads `users` for its
own queries and treats `profiles` as legacy surface.

**Authorization.** A signed-in user's roles come from `user_roles` joined to
`roles`; their effective permissions come from the `my_permissions()` helper,
which resolves `role_permissions` plus any per-user overrides in
`user_permissions`.

**Public careers.** `job_postings` already carries the exact policy the landing
page needs:

```sql
anon_view_open_postings | SELECT | anon | using (status = 'open')
```

`departments` and `positions` carry matching anon-read policies
(`departments_read_anon`, `anon_view_positions`), so the careers page can join
for names. Anything the page can read is already open — it never filters by
status client-side.

One schema difference from HRMS worth noting: `job_postings` has **no `title`
column**. The title comes from `positions.title` through the join. HRMS dropped
that column in `20260715193600_drop_job_postings_title.sql` and `jmac-suite`
inherited the corrected shape.

### 3.3 Seeded accounts

Six accounts exist, with roles assigned through `user_roles`:

| Email | Roles |
|---|---|
| `admin@jmac.com` | `system_administrator` |
| `owner@jmac.com` | `owner` |
| `manager@jmac.com` | `hr_manager`, `pos_manager`, `finance_manager` |
| `staff@jmac.com` | `hr_staff`, `finance_staff` |
| `cashier@jmac.com` | `cashier` |
| `accountant@jmac.com` | `accountant` |

Passwords are not recorded in this spec. Track 3 needs working credentials to
verify the permission matrix; obtaining or resetting them is a Track 3 step.

### 3.4 Open item: `job_postings` is empty

The table has zero rows, so the landing page's Open Positions section will
render its empty state rather than the Cashier and Manager listings the brief
names.

Seeding two postings means **writing to a live database this project does not
own**. Phase 1 does not do it. The decision — seed it, or ship the empty state
until Recruitment lands in Phase 3 — belongs to Track 4, where the careers
section is actually built.
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

*(Revised 2026-08-07 — see §1.2. The original design specified a hand-written
static map. The adopted database already ships 79 permissions, a
`role_permissions` join, and per-user overrides; a second hand-written source of
truth would drift from the first on its first schema change.)*

Authorization is read from the database, not declared in TypeScript.

`src/services/authorization.ts` exposes one query, run once at sign-in and
cached by TanStack Query for the session:

```ts
/** Effective permission keys for the signed-in user: their roles' permissions
 *  from role_permissions, plus any per-user grants in user_permissions. */
export async function fetchMyPermissions(): Promise<PermissionKey[]>

/** Role keys held by the signed-in user. A user may hold several — the seeded
 *  manager holds hr_manager, pos_manager, and finance_manager. */
export async function fetchMyRoles(): Promise<RoleKey[]>
```

Both wrap the database's own `my_permissions()` and `my_roles()` helpers, so the
answer comes from the same place RLS gets it.

`src/lib/permissions.ts` holds only the derivation on top of that data — no
role→capability table:

```ts
export type PermissionKey = string  // narrowed by codegen, §4.2.1

export function can(perms: Set<PermissionKey>, key: PermissionKey): boolean
export function canAny(perms: Set<PermissionKey>, keys: PermissionKey[]): boolean
```

Sidebar entries and route guards each declare the permission key they require,
and are filtered through `can()`. A role that lacks `sale.create` never renders
a Sales entry.

#### 4.2.1 Typing the permission keys

`PermissionKey` is generated from `select key from public.permissions` into a
string-literal union, alongside `database.types.ts`. A typo in a permission key
then fails compilation rather than silently denying access at runtime. The
generator re-runs whenever the schema does.

#### 4.2.2 What this is not

Permission checks in the client are **presentation**, not security. RLS and the
database's `has_permission()` are the real boundary. Hiding a module is never
the only thing stopping someone — every policy in `jmac-suite` enforces the same
split independently.

The separation of duties HRMS encodes survives this change intact, because it
lives in the database: `applicant.screen` belongs to `hr_manager` while the job
board belongs to `hr_staff`, and `is_hr_manager_or_admin()` gates payroll
release. An HR Manager approves payroll and therefore must not generate it —
that rule is enforced by policy, not by the UI's opinion of it.

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

30 components, hand-authored on Radix primitives following shadcn conventions.
(The brief lists 28; it counts Modal and Dialog separately — they are one
component — and this design adds Popover and DataTable, which the brief's
Dropdown and Table imply but do not name.)
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

Every component is typed, accepts `ref` as a normal prop (React 19 — no
`forwardRef`), spreads `...props` to its root, exports a props type named after
it, and composes via `className` through `cn()` last. No component reads global
state.

### 6.1 Two variant vocabularies, and which to use

`Button.destructive` and `Badge.error` both resolve to `bg-error`, under
different names. That is deliberate, not drift:

- Components that **perform** an action take action names: `primary`,
  `secondary`, `ghost`, `destructive`, `link`. A button is named for what
  pressing it does.
- Components that **report** a state take status names: `neutral`, `success`,
  `warning`, `error`, `info`, `outline`. A badge is named for what it is
  telling you.

So Track 2B's Toast reports and takes status names; its Card and StatCard are
containers and take neither. A component that both reports and acts — a toast
with an undo button — composes the two rather than inventing a third set.

### 6.2 Enforced, not just written down

Two rules in this section are guarded by tests that fail the build, because
Track 1 established that a rule stated only in prose is a rule nothing
enforces:

- `src/components/ui/token-discipline.test.ts` sweeps every `.ts`, `.tsx`, and
  `.css` file under `src/` (except `tokens.css`, which defines the palette) for
  hex literals, raw Tailwind palette utilities including `bg-white` and
  `bg-black/50`, inline style colours, `rgb()`/`hsl()`/`oklch()`, and direct
  `--jmac-*` references that skip the semantic layer.
- `src/components/ui/focus-ring.test.tsx` asserts every interactive component
  carries all four `focus-visible:` ring classes.

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

- `permissions.ts` — `can()` / `canAny()` against fixture permission sets
- Authorization services — `fetchMyPermissions` and `fetchMyRoles` shape and caching
- Route guards — anonymous redirect, insufficient-permission 403, inactive-status check
- `isPastClosingDate` / `isAcceptingApplications` — boundary dates
- `DataTable` — sorting, filtering, and pagination against a fixture

Integration tests in `tests/db/` run against the live `jmac-suite` stack and are
**read-only**. They assert the contracts the application depends on rather than
setting up their own state: that anon reads open postings and nothing else, that
anon cannot read `users`, that `departments` and `positions` are joinable
anonymously, and that a signed-in user's `my_permissions()` resolves. They never
insert, update, or delete.

### 8.1 Success criteria

Phase 1 is done when all of the following hold:

1. `npx tsc -b` reports no errors
2. `npm run build` succeeds
3. `npm test` passes
4. `npm run test:db` passes against the running `jmac-suite` stack
5. `src/types/database.types.ts` is generated from the live schema and compiles
6. Signing in as each seeded account shows exactly the navigation its
   `my_permissions()` result predicts, and no more
7. A signed-out visitor loads `/` and the Open Positions section renders the
   live `job_postings` result — listings if seeded, the empty state if not (§3.4)
8. An inactive account is refused at login with an explanatory message
9. The app renders correctly at 1440px, 768px, and 375px with no horizontal scroll
10. No file under `integration/` has been modified — verified by comparing a
    recursive file listing with modification timestamps taken before Track 1
    begins
11. **No row in `jmac-suite` was created, altered, or deleted by Phase 1** —
    verified by row counts taken before Track 1 and again at the end

---

## 9. Implementation tracks

One spec, four sequenced tracks with a checkpoint after each. Each track ends
in a working, verifiable state.

| Track | Contents | Verified by |
|---|---|---|
| 1. Foundation | Vite app, tooling, design tokens, connection to `jmac-suite`, generated types, typed client, read-only DB contract tests | Criteria 1–5, 11 |
| 2. Components | 30 shared components + tests, split into plans 2A (primitives, feedback) and 2B (overlays, data, date) | Criteria 1–3 |
| 3. Layouts & auth | Three layouts, sidebar, header, AuthProvider, authorization services, guards, three auth pages | Criteria 6, 8, 9 |
| 4. Landing & careers | Nine landing sections, careers list and detail, live data; decide §3.4 | Criteria 7, 9 |

---

## 10. Explicitly out of scope

Named here so they are not silently assumed:

- Any modification to `integration/`
- **Any schema change to `jmac-suite`** — no migrations, no `db reset`, no DDL
- **Any write to `jmac-suite` data**, including seeding `job_postings` (§3.4)
- FMS and the `finance_*` tables, in any form
- Module dashboards — there is one dashboard, permission-driven
- Building UI over `employees`, `attendance`, `leave`, `payroll` (Phase 3)
- Building UI over `products`, `inventory`, `orders`, `sales` (Phase 4)
- Applicant accounts, resume upload, application submission and tracking (Phase 3)
- Reconciling POS `store_memberships` with `employees` (Phase 4)
- Deciding who owns migrations for `jmac-suite` going forward (§3.1)
- Dark palette values
- Deployment to Vercel
