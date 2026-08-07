# JMAC Phase 1 · Track 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the JMAC application shell, design tokens, and a new unified Supabase database with identity, org, and public job-posting schema — the foundation every later track builds on.

**Architecture:** A Vite + React 19 app at the repository root with `integration/` excluded from compilation and file watching. Design tokens live in two CSS layers — raw brand values in `:root`, semantic aliases in Tailwind v4's `@theme inline` — so no component ever holds a hex literal. A new local Supabase stack on port 56321 carries three migrations plus a seed, with Row Level Security as the real access boundary.

**Tech Stack:** React 19.2 · TypeScript 6 · Vite 8 · Tailwind CSS v4 (`@tailwindcss/vite`) · Vitest 3 + Testing Library · Supabase CLI 2.109 · PostgreSQL 17 · oxlint

**Source spec:** [2026-08-07-jmac-phase1-foundation-design.md](../specs/2026-08-07-jmac-phase1-foundation-design.md)

## Global Constraints

- **Never modify anything under `integration/`.** It is reference-only. Read freely; write never.
- **No hex colour literals in components.** Every colour reads a semantic token defined in `src/styles/tokens.css`.
- Ports 54321 (POS) and 55321 (HRMS) are occupied. JMAC uses the **563xx** band exclusively.
- Palette values, copied verbatim from the spec: primary `#0F172A`, primary-hover `#1D4ED8`, accent `#38BDF8`, background `#F8FAFC`, surface `#FFFFFF`, border `#E2E8F0`, heading `#0F172A`, body `#64748B`, success `#22C55E`, warning `#F59E0B`, error `#EF4444`.
- `user_role` enum has exactly six values, in this order: `admin`, `hr_manager`, `hr_staff`, `pos_manager`, `cashier`, `employee`.
- `profiles.status` defaults to `inactive`. A new account cannot act until an administrator activates it.
- TypeScript runs with `"strict": true`. HRMS omits it; JMAC does not.
- Every RLS helper function is `security definer`, `stable`, and sets `search_path = public`.
- Commit after every task. Never use `--no-verify`.

---

## File Structure

| File | Responsibility |
|---|---|
| `package.json` | Dependencies and scripts |
| `vite.config.ts` | React + Tailwind plugins, `@` alias, `integration/` watch exclusion |
| `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` | Project references, strict compiler options, `integration/` exclusion |
| `vitest.config.ts` | jsdom environment, setup file, excludes DB integration tests |
| `index.html` | App entry document |
| `src/main.tsx` | React root |
| `src/app/App.tsx` | Application shell — placeholder in Track 1, replaced by the router in Track 3 |
| `src/styles/tokens.css` | Raw brand values (`:root`) + semantic aliases (`@theme inline`) |
| `src/styles/index.css` | Tailwind import, font imports, base layer |
| `src/lib/utils.ts` | `cn()` class merger |
| `src/lib/supabase.ts` | Typed Supabase client |
| `src/types/database.types.ts` | Generated from the live schema — never hand-edited |
| `supabase/config.toml` | Local stack on the 563xx port band |
| `supabase/migrations/0001_identity.sql` | Enums, `profiles`, signup trigger, RLS helpers, role-escalation guard |
| `supabase/migrations/0002_org.sql` | `departments`, `positions`, `branches` |
| `supabase/migrations/0003_recruitment_public.sql` | `job_postings` + anon-read policy scoped to open postings |
| `supabase/seed.sql` | Six role accounts, org rows, two open postings |
| `tests/setup.ts` | Testing Library matchers |
| `tests/db/rls.test.ts` | Integration tests asserting RLS behaviour against the running stack |

---

## Task 1: Scaffold the application

**Files:**
- Create: `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `.env.example`, `src/main.tsx`, `src/app/App.tsx`, `src/vite-env.d.ts`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: nothing
- Produces: a buildable app; `@/*` resolves to `src/*`; scripts `dev`, `build`, `lint`, `test`, `test:db`

- [ ] **Step 1: Write `package.json`**

Dependencies are held to what Track 1 needs. Radix primitives arrive in Track 2, router and query in Track 3 — installing them now would be speculative.

```json
{
  "name": "jmac",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "oxlint src",
    "typecheck": "tsc -b",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:db": "vitest run --config vitest.db.config.ts",
    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:reset": "supabase db reset",
    "db:types": "supabase gen types typescript --local > src/types/database.types.ts"
  },
  "dependencies": {
    "@fontsource/ibm-plex-mono": "^5.2.7",
    "@fontsource/inter": "^5.2.8",
    "@supabase/supabase-js": "^2.110.2",
    "@tailwindcss/vite": "^4.3.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "tailwind-merge": "^3.6.0",
    "tailwindcss": "^4.3.2"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/node": "^24.13.2",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.3",
    "jsdom": "^25.0.1",
    "oxlint": "^1.71.0",
    "supabase": "^2.109.1",
    "typescript": "~6.0.2",
    "vite": "^8.1.1",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: Write `vite.config.ts`**

The `server.watch.ignored` entry is load-bearing. Without it the dev server crawls three `node_modules` trees inside `integration/` and takes minutes to start.

```ts
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    watch: {
      ignored: ['**/integration/**'],
    },
  },
})
```

- [ ] **Step 3: Write the TypeScript configs**

`tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

`tsconfig.app.json` — note `"strict": true`, which HRMS omits:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "esnext",
    "types": ["vite/client"],
    "skipLibCheck": true,
    "paths": { "@/*": ["./src/*"] },
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src"],
  "exclude": ["integration"]
}
```

`tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023"],
    "module": "esnext",
    "types": ["node"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["vite.config.ts", "vitest.config.ts", "vitest.db.config.ts"]
}
```

- [ ] **Step 4: Write `index.html`, entry point, and app shell**

`index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>JMAC — Enterprise Business Platform</title>
    <meta name="description" content="JMAC unifies human resources and point of sale into one enterprise platform." />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

`src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/app/App'
import '@/styles/index.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root is missing from index.html')

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

`src/app/App.tsx` — a deliberate placeholder. Track 3 replaces it with the router.

```tsx
export default function App() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background">
      <h1 className="text-3xl font-semibold text-heading">JMAC</h1>
    </main>
  )
}
```

- [ ] **Step 5: Write `.env.example` and extend `.gitignore`**

`.env.example`:

```
# Populate from `npm run db:start` output, then copy this file to `.env`.
VITE_SUPABASE_URL=http://127.0.0.1:56321
VITE_SUPABASE_ANON_KEY=
```

Append to `.gitignore`:

```
.env
.vercel
coverage/
```

- [ ] **Step 6: Install and verify the build fails for the expected reason**

Run: `npm install && npm run build`
Expected: FAIL — `src/styles/index.css` does not exist yet. That file is Task 3's deliverable. Any other error means a config mistake; fix it before continuing.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig*.json .env.example .gitignore src/
git commit -m "chore: scaffold JMAC Vite + React 19 application"
```

---

## Task 2: Test harness and `cn()` utility

**Files:**
- Create: `vitest.config.ts`, `tests/setup.ts`, `src/lib/utils.ts`, `src/lib/utils.test.ts`

**Interfaces:**
- Consumes: Task 1's `@` alias
- Produces: `cn(...inputs: ClassValue[]): string` — every component in Track 2 uses it to merge caller `className` over its own defaults

- [ ] **Step 1: Write `vitest.config.ts` and `tests/setup.ts`**

`tests/db/**` is excluded here because those tests need a running database. They get their own config in Task 8.

```ts
import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    exclude: ['**/node_modules/**', '**/integration/**', 'tests/db/**'],
  },
})
```

`tests/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 2: Write the failing test**

`src/lib/utils.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('joins plain class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('drops falsy values', () => {
    expect(cn('px-2', false, undefined, null, 'py-1')).toBe('px-2 py-1')
  })

  it('lets a later Tailwind class win over an earlier conflicting one', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('lets a caller className override a component default', () => {
    expect(cn('bg-surface text-body', 'bg-primary')).toBe('text-body bg-primary')
  })

  it('resolves conditional object syntax', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active')
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- src/lib/utils.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/utils"`.

- [ ] **Step 4: Write `src/lib/utils.ts`**

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merges class names so a caller's `className` reliably overrides a
 * component's defaults, instead of both landing in the class list and
 * letting stylesheet order decide. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- src/lib/utils.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts tests/setup.ts src/lib/utils.ts src/lib/utils.test.ts
git commit -m "test: add Vitest harness and cn() class merger"
```

---

## Task 3: Design tokens

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/index.css`, `src/styles/tokens.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: Tailwind utilities `bg-background`, `bg-surface`, `border-border`, `bg-primary`, `hover:bg-primary-hover`, `text-heading`, `text-body`, `text-accent`, `bg-success`, `bg-warning`, `bg-error`, and their `text-`/`border-` variants. Radius `--radius: 0.5rem`. Fonts `font-sans` (Inter) and `font-mono` (IBM Plex Mono).

- [ ] **Step 1: Write the failing test**

CSS cannot be unit-tested meaningfully in jsdom, but the token *contract* can. This test reads the stylesheet and asserts every semantic token the later tracks depend on exists and resolves — cheap insurance against a rename silently breaking twenty components.

`src/styles/tokens.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const tokens = readFileSync(resolve(__dirname, 'tokens.css'), 'utf8')

const SEMANTIC_TOKENS = [
  '--color-background',
  '--color-surface',
  '--color-border',
  '--color-primary',
  '--color-primary-hover',
  '--color-primary-foreground',
  '--color-accent',
  '--color-heading',
  '--color-body',
  '--color-success',
  '--color-warning',
  '--color-error',
  '--color-ring',
]

const BRAND_VALUES: Record<string, string> = {
  '--jmac-navy': '#0F172A',
  '--jmac-blue': '#1D4ED8',
  '--jmac-sky': '#38BDF8',
  '--jmac-canvas': '#F8FAFC',
  '--jmac-surface': '#FFFFFF',
  '--jmac-line': '#E2E8F0',
  '--jmac-body': '#64748B',
  '--jmac-success': '#22C55E',
  '--jmac-warning': '#F59E0B',
  '--jmac-error': '#EF4444',
}

describe('design tokens', () => {
  it.each(SEMANTIC_TOKENS)('exposes %s in the @theme layer', (token) => {
    expect(tokens).toContain(`${token}:`)
  })

  it.each(Object.entries(BRAND_VALUES))('defines %s as %s', (name, value) => {
    expect(tokens).toMatch(new RegExp(`${name}:\\s*${value};`, 'i'))
  })

  it('routes every semantic colour through a brand variable, never a raw hex', () => {
    const themeBlock = tokens.slice(tokens.indexOf('@theme inline'))
    expect(themeBlock).not.toMatch(/#[0-9a-f]{3,8}/i)
  })

  it('declares the radius scale', () => {
    expect(tokens).toMatch(/--radius:\s*0\.5rem;/)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/styles/tokens.test.ts`
Expected: FAIL — `ENOENT: no such file or directory ... tokens.css`.

- [ ] **Step 3: Write `src/styles/tokens.css`**

Two layers. `:root` holds brand values; `@theme inline` gives them meaning. Components only ever reference the semantic layer, which is what makes a dark palette a later addition to this one file rather than a sweep through every component.

```css
:root {
  /* ---- JMAC brand palette (PROJECT_CONTEXT.md) ---- */
  --jmac-navy: #0F172A;
  --jmac-blue: #1D4ED8;
  --jmac-sky: #38BDF8;
  --jmac-canvas: #F8FAFC;
  --jmac-surface: #FFFFFF;
  --jmac-line: #E2E8F0;
  --jmac-body: #64748B;
  --jmac-success: #22C55E;
  --jmac-warning: #F59E0B;
  --jmac-error: #EF4444;

  /* Squarer than Harmony Suite's 0.75rem. The brief names SAP Fiori and
     Microsoft 365, which are less rounded. */
  --radius: 0.5rem;

  /* Three levels only -- PROJECT_CONTEXT.md rejects large shadows, so
     borders carry most of the separation. */
  --shadow-sm: 0 1px 2px 0 rgb(15 23 42 / 0.04);
  --shadow-md: 0 2px 8px -1px rgb(15 23 42 / 0.08);
  --shadow-lg: 0 8px 24px -4px rgb(15 23 42 / 0.10);
}

@theme inline {
  --color-background: var(--jmac-canvas);
  --color-surface: var(--jmac-surface);
  --color-surface-foreground: var(--jmac-navy);
  --color-border: var(--jmac-line);
  --color-input: var(--jmac-line);

  /* Primary hover moves navy -> blue, exactly as PROJECT_CONTEXT.md
     specifies. This is a hue change rather than a shade change, so primary
     buttons visibly switch colour family on hover. Kept as specified; change
     this one line to make hover a navy tint instead. */
  --color-primary: var(--jmac-navy);
  --color-primary-hover: var(--jmac-blue);
  --color-primary-foreground: var(--jmac-surface);

  --color-accent: var(--jmac-sky);
  --color-accent-foreground: var(--jmac-navy);

  --color-heading: var(--jmac-navy);
  --color-body: var(--jmac-body);
  --color-muted: var(--jmac-canvas);
  --color-muted-foreground: var(--jmac-body);

  --color-success: var(--jmac-success);
  --color-warning: var(--jmac-warning);
  --color-error: var(--jmac-error);
  --color-success-foreground: var(--jmac-surface);
  --color-warning-foreground: var(--jmac-navy);
  --color-error-foreground: var(--jmac-surface);

  --color-ring: var(--jmac-blue);

  --radius-sm: calc(var(--radius) - 2px);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 2px);
  --radius-xl: calc(var(--radius) + 6px);

  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
}
```

- [ ] **Step 4: Write `src/styles/index.css`**

Fonts are self-hosted through `@fontsource` rather than a CDN link, so the app has no external font dependency at runtime.

```css
@import 'tailwindcss';

@import '@fontsource/inter/400.css';
@import '@fontsource/inter/500.css';
@import '@fontsource/inter/600.css';
@import '@fontsource/inter/700.css';
@import '@fontsource/ibm-plex-mono/500.css';

@import './tokens.css';

@custom-variant dark (&:is(.dark *));

@layer base {
  * {
    border-color: var(--color-border);
  }

  body {
    background-color: var(--color-background);
    color: var(--color-body);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }

  h1, h2, h3, h4, h5, h6 {
    color: var(--color-heading);
    font-weight: 600;
    letter-spacing: -0.011em;
  }

  /* Figures must line up down a table column. */
  .tabular {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }

  :focus-visible {
    outline: 2px solid var(--color-ring);
    outline-offset: 2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 5: Run tests and the build to verify both pass**

Run: `npm test -- src/styles/tokens.test.ts && npm run build`
Expected: tokens tests PASS; `npm run build` now succeeds — Task 1 Step 6's failure is resolved because `src/styles/index.css` exists.

- [ ] **Step 6: Commit**

```bash
git add src/styles/
git commit -m "feat: add JMAC design tokens and base stylesheet"
```

---

## Task 4: Initialize the Supabase project

**Files:**
- Create: `supabase/config.toml`, `supabase/.gitignore`

**Interfaces:**
- Consumes: nothing
- Produces: a local stack — API `http://127.0.0.1:56321`, database port 56322, Studio 56323, Inbucket 56324

- [ ] **Step 1: Initialize**

Run: `npx supabase init --force`
This writes a default `supabase/config.toml` on the 54321 band, which the next step replaces.

- [ ] **Step 2: Set the project id and port band**

Edit `supabase/config.toml`. Change exactly these values, leaving every other line as generated:

| Key | Section | Value |
|---|---|---|
| `project_id` | top level | `"jmac"` |
| `port` | `[api]` | `56321` |
| `port` | `[db]` | `56322` |
| `shadow_port` | `[db]` | `56320` |
| `major_version` | `[db]` | `17` |
| `port` | `[db.pooler]` | `56329` |
| `port` | `[studio]` | `56323` |
| `port` | `[local_smtp]` | `56324` |
| `port` | `[analytics]` | `56327` |
| `site_url` | `[auth]` | `"http://localhost:5173"` |
| `additional_redirect_urls` | `[auth]` | `["http://localhost:5173"]` |

Add this comment above `[api].port` so the choice is not mistaken for arbitrary:

```toml
# Ports 54321 (POS / sariswift-offline) and 55321 (HRMS / harmony-suite) are
# already claimed on this host. JMAC takes the 563xx band so all three local
# stacks can run at once.
```

- [ ] **Step 3: Start the stack and verify the ports**

Run: `npx supabase start`
Expected: startup completes and prints `API URL: http://127.0.0.1:56321`, `DB URL: postgresql://postgres:postgres@127.0.0.1:56322/postgres`, `Studio URL: http://127.0.0.1:56323`.

If Docker reports a port conflict, another stack has claimed a 563xx port — resolve before continuing rather than shifting the band again.

- [ ] **Step 4: Record the anon key**

Run: `npx supabase status`
Copy the `anon key` value into a new `.env` file at the repository root:

```
VITE_SUPABASE_URL=http://127.0.0.1:56321
VITE_SUPABASE_ANON_KEY=<anon key from supabase status>
```

`.env` is git-ignored. `.env.example` from Task 1 stays committed as the template.

- [ ] **Step 5: Commit**

```bash
git add supabase/config.toml supabase/.gitignore
git commit -m "chore: initialize JMAC Supabase project on port 56321"
```

---

## Task 5: Identity migration

**Files:**
- Create: `supabase/migrations/0001_identity.sql`

**Interfaces:**
- Consumes: Task 4's stack
- Produces: types `user_role`, `account_status`; table `public.profiles`; functions `public.current_user_role()`, `public.is_admin()`, `public.is_active()`, `public.has_role(user_role[])`

- [ ] **Step 1: Write the migration**

```sql
-- JMAC identity: one auth.users, one profiles table, six roles.
-- Adapted from HRMS 20260713200311_initial_schema.sql:54, with the role enum
-- widened for POS roles and `employee_id` deliberately omitted -- that column
-- arrives in Phase 3 alongside the `employees` table it references, so the
-- schema never carries a foreign key to nothing.

create type user_role as enum (
  'admin', 'hr_manager', 'hr_staff', 'pos_manager', 'cashier', 'employee'
);
create type account_status as enum ('active', 'inactive');

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  email         text not null unique,
  role          user_role not null default 'employee',
  status        account_status not null default 'inactive',
  avatar_url    text,
  last_login_at timestamptz,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_profiles_role on public.profiles(role);
create index idx_profiles_status on public.profiles(status);

-- ---------------------------------------------------------------------------
-- RLS helpers. security definer so they can read profiles while the policies
-- that call them are still being evaluated; search_path pinned so a caller
-- cannot shadow `profiles` with their own table.
-- ---------------------------------------------------------------------------

-- Named current_user_role rather than current_role: `current_role` is a
-- reserved SQL keyword that PostgreSQL already answers with the session's
-- database role, so a function by that name is a collision waiting to happen.
create or replace function public.current_user_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and status = 'active';
$$;

create or replace function public.is_active()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.has_role(roles user_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'active' and role = any(roles)
  );
$$;

-- ---------------------------------------------------------------------------
-- Signup trigger. Every auth.users row gets a profiles row, defaulting to the
-- least privilege the system has: an inactive employee.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Privilege-escalation guard. Without this, a user with update rights on their
-- own row could simply set role = 'admin'.
-- ---------------------------------------------------------------------------

create or replace function public.protect_role_changes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role or new.status is distinct from old.status)
     and not public.is_admin() then
    raise exception 'Only an administrator may change a role or account status';
  end if;
  return new;
end;
$$;

create trigger trg_protect_role_changes
  before update on public.profiles
  for each row execute function public.protect_role_changes();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());

create policy profiles_select_all_admin on public.profiles
  for select to authenticated using (public.is_admin());

create policy profiles_select_staff on public.profiles
  for select to authenticated
  using (public.has_role(array['hr_manager', 'hr_staff']::user_role[]));

create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy profiles_update_admin on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.profiles from anon;
grant select, update on public.profiles to authenticated;
grant execute on function public.current_user_role(), public.is_active(),
  public.is_admin(), public.has_role(user_role[]) to authenticated;
```

- [ ] **Step 2: Apply and verify**

Run: `npx supabase db reset`
Expected: applies cleanly, no errors.

Then verify the trigger and the guard actually fire:

```bash
npx supabase db reset
psql "postgresql://postgres:postgres@127.0.0.1:56322/postgres" -c "
  select enumlabel from pg_enum
  join pg_type on pg_type.oid = pg_enum.enumtypid
  where typname = 'user_role' order by enumsortorder;"
```

Expected: exactly six rows, in the order `admin, hr_manager, hr_staff, pos_manager, cashier, employee`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0001_identity.sql
git commit -m "feat(db): add identity schema with six roles and RLS helpers"
```

---

## Task 6: Organisation migration

**Files:**
- Create: `supabase/migrations/0002_org.sql`

**Interfaces:**
- Consumes: Task 5's `is_admin()`, `has_role()`
- Produces: tables `public.departments`, `public.positions`, `public.branches`

- [ ] **Step 1: Write the migration**

```sql
-- Organisation reference data. Shapes follow HRMS initial_schema.sql:121 and
-- :129. `branches` is new to JMAC: HRMS treats a branch as a lookup value, and
-- POS's `stores` table maps onto it when the Sales module lands in Phase 4.

create table public.departments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.positions (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  department_id uuid not null references public.departments(id) on delete restrict,
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (title, department_id)
);

create index idx_positions_department on public.positions(department_id);

create table public.branches (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  code       text not null unique,
  address    text,
  city       text,
  province   text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.departments enable row level security;
alter table public.positions   enable row level security;
alter table public.branches    enable row level security;

-- Anonymous read is granted because job postings join these tables for their
-- department and position names on the public careers page.
create policy departments_select_public on public.departments
  for select to anon, authenticated using (true);
create policy positions_select_public on public.positions
  for select to anon, authenticated using (true);
create policy branches_select_public on public.branches
  for select to anon, authenticated using (is_active);

create policy departments_write_admin on public.departments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy positions_write_admin on public.positions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy branches_write_admin on public.branches
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.departments, public.positions, public.branches to anon, authenticated;
grant insert, update, delete on public.departments, public.positions, public.branches to authenticated;
```

- [ ] **Step 2: Apply and verify**

Run: `npx supabase db reset`
Expected: applies cleanly.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0002_org.sql
git commit -m "feat(db): add departments, positions, and branches"
```

---

## Task 7: Public recruitment migration

**Files:**
- Create: `supabase/migrations/0003_recruitment_public.sql`

**Interfaces:**
- Consumes: Tasks 5 and 6
- Produces: types `employment_type`, `job_posting_status`; table `public.job_postings`, readable by `anon` only where `status = 'open'`

- [ ] **Step 1: Write the migration**

```sql
-- Job postings, plus the anon-read policy that makes the public careers page
-- possible. Adapted from HRMS initial_schema.sql:153 and the public-access
-- policy in 20260715030348_recruitment_public_access.sql, with `branch_id`
-- added so a posting states where the job actually is.
--
-- `applicants`, `applications`, and submit_job_application() are Phase 3.
-- Phase 1 lists positions; it does not accept applications.

create type employment_type    as enum ('full_time', 'part_time', 'contract', 'internship');
create type job_posting_status as enum ('draft', 'open', 'closed');

create table public.job_postings (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  department_id   uuid not null references public.departments(id) on delete restrict,
  position_id     uuid not null references public.positions(id)   on delete restrict,
  branch_id       uuid references public.branches(id) on delete set null,
  description     text not null,
  requirements    text,
  employment_type employment_type not null default 'full_time',
  vacancies       integer not null default 1 check (vacancies > 0),
  status          job_posting_status not null default 'draft',
  posted_by       uuid references public.profiles(id) on delete set null,
  date_posted     timestamptz,
  closing_date    date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_job_postings_status     on public.job_postings(status);
create index idx_job_postings_department on public.job_postings(department_id);

alter table public.job_postings enable row level security;

-- Anonymous visitors see open postings and nothing else. The careers page
-- therefore never filters by status client-side -- anything it can read is
-- already open. A draft posting is invisible, not merely hidden.
create policy job_postings_select_public on public.job_postings
  for select to anon, authenticated using (status = 'open');

create policy job_postings_select_staff on public.job_postings
  for select to authenticated
  using (public.is_admin() or public.has_role(array['hr_staff', 'hr_manager']::user_role[]));

-- Running the job board is HR Staff's process, matching canPostJobs() in
-- HRMS roles.ts. HR Manager screens applicants instead.
create policy job_postings_write_staff on public.job_postings
  for all to authenticated
  using (public.is_admin() or public.has_role(array['hr_staff']::user_role[]))
  with check (public.is_admin() or public.has_role(array['hr_staff']::user_role[]));

grant select on public.job_postings to anon, authenticated;
grant insert, update, delete on public.job_postings to authenticated;
```

- [ ] **Step 2: Apply and verify**

Run: `npx supabase db reset`
Expected: applies cleanly. RLS behaviour is asserted by the integration tests in Task 8 — this step only confirms the schema builds.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0003_recruitment_public.sql
git commit -m "feat(db): add job_postings with public open-only read policy"
```

---

## Task 8: Seed data and RLS integration tests

**Files:**
- Create: `supabase/seed.sql`, `vitest.db.config.ts`, `tests/db/rls.test.ts`

**Interfaces:**
- Consumes: Tasks 5–7
- Produces: six seeded accounts (`admin@jmac.test`, `hrmanager@jmac.test`, `hrstaff@jmac.test`, `posmanager@jmac.test`, `cashier@jmac.test`, `employee@jmac.test`, all password `Jmac1234!`), two open job postings, one draft posting

- [ ] **Step 1: Write the failing test**

`vitest.db.config.ts`:

`loadEnv` is required here. A plain node-environment Vitest run does not read
`.env`, so without this the suite would fail on a missing anon key even when
`.env` is correctly populated.

```ts
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

const env = loadEnv('development', process.cwd(), 'VITE_')

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/db/**/*.test.ts'],
    testTimeout: 20_000,
    env,
  },
})
```

`tests/db/rls.test.ts`:

```ts
import { createClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'

const URL = process.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:56321'
const ANON = process.env.VITE_SUPABASE_ANON_KEY

beforeAll(() => {
  if (!ANON) {
    throw new Error(
      'VITE_SUPABASE_ANON_KEY is unset. Run `npx supabase status`, copy the anon key into .env, then re-run with `npm run test:db`.'
    )
  }
})

function anonClient() {
  return createClient(URL, ANON as string)
}

describe('job_postings RLS', () => {
  it('lets an anonymous visitor read open postings', async () => {
    const { data, error } = await anonClient().from('job_postings').select('id, title, status')
    expect(error).toBeNull()
    expect(data?.length).toBe(2)
  })

  it('never exposes a draft posting to an anonymous visitor', async () => {
    const { data } = await anonClient().from('job_postings').select('status')
    expect(data?.every((row) => row.status === 'open')).toBe(true)
  })

  it('joins department and position names for the careers page', async () => {
    const { data, error } = await anonClient()
      .from('job_postings')
      .select('title, departments(name), positions(title)')
      .order('date_posted', { ascending: false, nullsFirst: false })
    expect(error).toBeNull()
    expect(data?.[0]?.departments).not.toBeNull()
    expect(data?.[0]?.positions).not.toBeNull()
  })

  // Valid foreign keys on purpose. Passing nulls would trip the NOT NULL
  // constraint and the test would pass without RLS being involved at all.
  it('refuses an anonymous write', async () => {
    const { error } = await anonClient().from('job_postings').insert({
      title: 'Injected',
      description: 'Should never be written by an anonymous client.',
      department_id: 'd0000000-0000-0000-0000-000000000002',
      position_id: 'c0000000-0000-0000-0000-000000000004',
      status: 'open',
    } as never)
    expect(error).not.toBeNull()
    expect(error?.code).toBe('42501')
  })
})

describe('profiles RLS', () => {
  it('exposes nothing to an anonymous visitor', async () => {
    const { data, error } = await anonClient().from('profiles').select('id')
    expect(error !== null || data?.length === 0).toBe(true)
  })

  it('shows a signed-in cashier their own row and no one else’s', async () => {
    const client = anonClient()
    const { error: signInError } = await client.auth.signInWithPassword({
      email: 'cashier@jmac.test', password: 'Jmac1234!',
    })
    expect(signInError).toBeNull()

    const { data } = await client.from('profiles').select('email, role')
    expect(data).toHaveLength(1)
    expect(data?.[0]?.email).toBe('cashier@jmac.test')
    expect(data?.[0]?.role).toBe('cashier')
  })

  it('blocks a cashier from promoting themselves to admin', async () => {
    const client = anonClient()
    await client.auth.signInWithPassword({
      email: 'cashier@jmac.test', password: 'Jmac1234!',
    })
    const { data: user } = await client.auth.getUser()
    const { error } = await client
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.user?.id as string)
    expect(error).not.toBeNull()
  })

  it('lets an admin read every profile', async () => {
    const client = anonClient()
    await client.auth.signInWithPassword({
      email: 'admin@jmac.test', password: 'Jmac1234!',
    })
    const { data } = await client.from('profiles').select('id')
    expect(data?.length).toBe(6)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:db`
Expected: FAIL — no seeded rows exist, so the first test finds 0 postings rather than 2.

- [ ] **Step 3: Write `supabase/seed.sql`**

The `disable trigger` around the role assignments is deliberate and mirrors HRMS's `seed.sql:35`. `trg_protect_role_changes` blocks any role change not made by an admin — and at seed time no admin exists yet, so bootstrapping the first accounts means stepping around the guard on purpose, then restoring it.

```sql
-- Six accounts, one per role, all with password Jmac1234!
-- Local development only. The handle_new_user() trigger creates each profiles
-- row automatically; these updates then assign the real role and activate it.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'admin@jmac.test', crypt('Jmac1234!', gen_salt('bf')),
   now(), now(), '{"provider":"email","providers":["email"]}',
   '{"full_name":"JMAC Administrator"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'hrmanager@jmac.test', crypt('Jmac1234!', gen_salt('bf')),
   now(), now(), '{"provider":"email","providers":["email"]}',
   '{"full_name":"Maria Santos"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000003',
   'authenticated', 'authenticated', 'hrstaff@jmac.test', crypt('Jmac1234!', gen_salt('bf')),
   now(), now(), '{"provider":"email","providers":["email"]}',
   '{"full_name":"Jose Reyes"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000004',
   'authenticated', 'authenticated', 'posmanager@jmac.test', crypt('Jmac1234!', gen_salt('bf')),
   now(), now(), '{"provider":"email","providers":["email"]}',
   '{"full_name":"Ana Cruz"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000005',
   'authenticated', 'authenticated', 'cashier@jmac.test', crypt('Jmac1234!', gen_salt('bf')),
   now(), now(), '{"provider":"email","providers":["email"]}',
   '{"full_name":"Paolo Mendoza"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000006',
   'authenticated', 'authenticated', 'employee@jmac.test', crypt('Jmac1234!', gen_salt('bf')),
   now(), now(), '{"provider":"email","providers":["email"]}',
   '{"full_name":"Liza Bautista"}', now(), now(), '', '', '', '');

-- trg_protect_role_changes rejects any role or status change not made by an
-- admin. No admin exists yet, so the bootstrap steps around the guard on
-- purpose and restores it immediately after.
alter table public.profiles disable trigger trg_protect_role_changes;

update public.profiles set role = 'admin',       status = 'active' where email = 'admin@jmac.test';
update public.profiles set role = 'hr_manager',  status = 'active' where email = 'hrmanager@jmac.test';
update public.profiles set role = 'hr_staff',    status = 'active' where email = 'hrstaff@jmac.test';
update public.profiles set role = 'pos_manager', status = 'active' where email = 'posmanager@jmac.test';
update public.profiles set role = 'cashier',     status = 'active' where email = 'cashier@jmac.test';
update public.profiles set role = 'employee',    status = 'active' where email = 'employee@jmac.test';

alter table public.profiles enable trigger trg_protect_role_changes;

-- ---------------------------------------------------------------------------
-- Organisation
-- ---------------------------------------------------------------------------

insert into public.departments (id, name, description) values
  ('d0000000-0000-0000-0000-000000000001', 'Human Resources', 'People operations and recruitment'),
  ('d0000000-0000-0000-0000-000000000002', 'Retail Operations', 'Store and point-of-sale operations'),
  ('d0000000-0000-0000-0000-000000000003', 'Finance', 'Placeholder — Finance module is not implemented');

insert into public.positions (id, title, department_id, description) values
  ('c0000000-0000-0000-0000-000000000001', 'HR Manager',    'd0000000-0000-0000-0000-000000000001', 'Leads people operations'),
  ('c0000000-0000-0000-0000-000000000002', 'HR Staff',      'd0000000-0000-0000-0000-000000000001', 'Runs recruitment and payroll preparation'),
  ('c0000000-0000-0000-0000-000000000003', 'Store Manager', 'd0000000-0000-0000-0000-000000000002', 'Manages a branch and its staff'),
  ('c0000000-0000-0000-0000-000000000004', 'Cashier',       'd0000000-0000-0000-0000-000000000002', 'Handles point-of-sale transactions');

insert into public.branches (id, name, code, city, province) values
  ('b0000000-0000-0000-0000-000000000001', 'JMAC Main Branch', 'MAIN', 'Quezon City', 'Metro Manila');

-- ---------------------------------------------------------------------------
-- Job postings: two open (the positions the brief names) and one draft, which
-- exists so the RLS tests can prove drafts stay invisible.
-- ---------------------------------------------------------------------------

insert into public.job_postings (
  title, department_id, position_id, branch_id, description, requirements,
  employment_type, vacancies, status, posted_by, date_posted, closing_date
) values
  ('Cashier',
   'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004',
   'b0000000-0000-0000-0000-000000000001',
   'Process customer transactions accurately and provide courteous service at the point of sale.',
   'Senior high school graduate. Prior retail experience is an advantage. Comfortable handling cash and card payments.',
   'full_time', 3, 'open', 'a0000000-0000-0000-0000-000000000003', now() - interval '3 days', current_date + interval '30 days'),
  ('Manager',
   'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003',
   'b0000000-0000-0000-0000-000000000001',
   'Lead branch operations, supervise cashiers, and own daily sales and inventory performance.',
   'Bachelor''s degree. At least two years of retail supervisory experience.',
   'full_time', 1, 'open', 'a0000000-0000-0000-0000-000000000003', now() - interval '1 day', current_date + interval '45 days'),
  ('HR Staff',
   'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000001',
   'Draft posting — must never be visible to anonymous visitors.',
   'Not yet published.',
   'full_time', 1, 'draft', 'a0000000-0000-0000-0000-000000000003', null, null);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx supabase db reset && npm run test:db`
Expected: PASS, 9 tests. If `VITE_SUPABASE_ANON_KEY` is unset the suite fails with the explanatory message from `beforeAll` — populate `.env` as Task 4 Step 4 describes.

- [ ] **Step 5: Commit**

```bash
git add supabase/seed.sql vitest.db.config.ts tests/db/rls.test.ts
git commit -m "test(db): seed six role accounts and assert RLS boundaries"
```

---

## Task 9: Typed Supabase client

**Files:**
- Create: `src/lib/supabase.ts`, `src/types/database.types.ts` (generated), `src/lib/supabase.test.ts`

**Interfaces:**
- Consumes: Tasks 5–8
- Produces: `supabase` — a `SupabaseClient<Database>` used by every service and hook in Tracks 3 and 4. Exports type `Database` and helper `Tables<'job_postings'>`.

- [ ] **Step 1: Generate the database types**

Run: `npm run db:types`
Expected: writes `src/types/database.types.ts` containing `profiles`, `departments`, `positions`, `branches`, and `job_postings`. This file is generated — never hand-edit it. Re-run after every migration.

- [ ] **Step 2: Write the failing test**

`src/lib/supabase.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('supabase client', () => {
  it('throws a directive error when the URL is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key')
    await expect(import('@/lib/supabase')).rejects.toThrow(/VITE_SUPABASE_URL/)
  })

  it('throws a directive error when the anon key is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'http://127.0.0.1:56321')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    await expect(import('@/lib/supabase')).rejects.toThrow(/VITE_SUPABASE_ANON_KEY/)
  })

  it('exposes a client with auth when both variables are present', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'http://127.0.0.1:56321')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key')
    const { supabase } = await import('@/lib/supabase')
    expect(supabase.auth).toBeDefined()
    expect(typeof supabase.from).toBe('function')
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- src/lib/supabase.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/supabase"`.

- [ ] **Step 4: Write `src/lib/supabase.ts`**

Follows HRMS `src/lib/supabase.ts`, with the error message naming both variables so a misconfigured environment says which one is wrong.

```ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url) {
  throw new Error(
    'VITE_SUPABASE_URL is not set. Copy .env.example to .env and fill it from `npx supabase status`.'
  )
}

if (!anonKey) {
  throw new Error(
    'VITE_SUPABASE_ANON_KEY is not set. Copy .env.example to .env and fill it from `npx supabase status`.'
  )
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export type { Database }
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
```

- [ ] **Step 5: Run the full verification suite**

Run: `npm test && npm run typecheck && npm run build && npm run lint`
Expected: all four succeed. This is the Track 1 gate.

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase.ts src/lib/supabase.test.ts src/types/database.types.ts
git commit -m "feat: add typed Supabase client and generated database types"
```

---

## Track 1 Definition of Done

All of the following must hold before Track 2 begins:

1. `npm run typecheck` — no errors
2. `npm run build` — succeeds
3. `npm test` — passes (`cn`, tokens, supabase client)
4. `npx supabase db reset` — three migrations plus seed apply cleanly
5. `npm run test:db` — 9 RLS tests pass
6. `npm run lint` — no errors
7. `npm run dev` starts in under 5 seconds, confirming `integration/` is excluded from the watcher
8. `git status` is clean, and no file under `integration/` has a modification timestamp later than the start of this track

---

## Tracks 2–4

Tracks 2 (28 shared components), 3 (layouts and authentication), and 4 (landing page and careers) are specified in §5–§7 of the design document. Their plans are written immediately before each track executes, not now.

This is deliberate. A plan must contain real import paths, real prop names, and real test code — no placeholders. Writing Track 3's route-guard tests today would mean inventing the exact signature of a `Button` that Track 2 has not built yet, and any drift between the guess and the reality becomes a plan that lies. Each track's plan is written against the code that actually exists when it starts.
