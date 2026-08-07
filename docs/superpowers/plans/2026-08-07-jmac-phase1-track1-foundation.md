# JMAC Phase 1 · Track 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the JMAC application shell and design tokens, and connect them to the existing `jmac-suite` database — the foundation every later track builds on.

**Architecture:** A Vite + React 19 app at the repository root with `integration/` excluded from compilation and file watching. Design tokens live in three CSS layers — raw brand values in `:root`, the elevation scale in a plain `@theme` block, and semantic aliases in Tailwind v4's `@theme inline` — so no component ever holds a hex literal. The database is the already-running `jmac-suite` stack on port 56321: this repository connects to it, generates types from it, and asserts its contracts, but never manages or writes to it.

> **Revised mid-execution, 2026-08-07.** Tasks 1–3 shipped as written. Tasks 4–9 originally created a new Supabase project with three migrations and a seed; that work was voided when execution found `jmac-suite` already running with the unified 70-table schema. See "Tasks 4–9 superseded" below and spec §1.1.

**Tech Stack:** React 19.2 · TypeScript 6 · Vite 8 · Tailwind CSS v4 (`@tailwindcss/vite`) · Vitest 4 + Testing Library · Supabase CLI 2.109 · PostgreSQL 17 · oxlint

**Source spec:** [2026-08-07-jmac-phase1-foundation-design.md](../specs/2026-08-07-jmac-phase1-foundation-design.md)

## Global Constraints

- **Never modify anything under `integration/`.** It is reference-only. Read freely; write never.
- **No hex colour literals in components.** Every colour reads a semantic token defined in `src/styles/tokens.css`.
- Palette values, copied verbatim from the spec: primary `#0F172A`, primary-hover `#1D4ED8`, accent `#38BDF8`, background `#F8FAFC`, surface `#FFFFFF`, border `#E2E8F0`, heading `#0F172A`, body `#64748B`, success `#22C55E`, warning `#F59E0B`, error `#EF4444`.
- TypeScript runs with `"strict": true`. HRMS omits it; JMAC does not.
- **The `jmac-suite` database is read-only to this repository.** No DDL, no DML, no `supabase/` directory, no `db reset`. It holds live data and no migration set on this host can rebuild it. See "Constraint that governs all remaining tasks".
- The JMAC stack answers on `http://127.0.0.1:56321` (API) and `127.0.0.1:56322` (Postgres). Ports 54321 (POS) and 55321 (HRMS) belong to other stacks; leave them alone.
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
| `src/styles/tokens.css` | Raw brand values (`:root`) + elevation scale (`@theme`) + semantic aliases (`@theme inline`) |
| `src/styles/index.css` | Tailwind import, font imports, base layer |
| `src/lib/utils.ts` | `cn()` class merger |
| `src/lib/supabase.ts` | Typed Supabase client |
| `src/types/database.types.ts` | Generated from the live `jmac-suite` schema — never hand-edited |
| `.env.example` | Connection template for the `jmac-suite` stack |
| `README.md` | Getting started, and why this repo must not manage the database |
| `vitest.db.config.ts` | Node environment for the DB suite, with `.env` loaded via `loadEnv` |
| `tests/setup.ts` | Testing Library matchers |
| `tests/db/contracts.test.ts` | Read-only assertions of the database contracts Tracks 3 and 4 depend on |

There is deliberately **no `supabase/` directory**. See "Constraint that governs all remaining tasks".

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

> **This block is the final shipped set, not the set Task 1 originally wrote.** The original had `db:start`, `db:stop` and `db:reset` alongside a `--local` `db:types`. Task 4 deleted them once execution found `jmac-suite` already running: `supabase db reset` would drop 70 tables of live data that no migration set on this host can rebuild. They are removed here rather than left for Task 4 to undo, so that an agent working top-to-bottom never writes them to disk at all. See Task 4 Step 1.

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
    "lint": "oxlint src tests vite.config.ts vitest.config.ts vitest.db.config.ts",
    "typecheck": "tsc -b",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:db": "vitest run --config vitest.db.config.ts",
    "db:types": "supabase gen types typescript --db-url postgresql://postgres:postgres@127.0.0.1:56322/postgres > src/types/database.types.ts"
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
    "vitest": "^4.1.10"
  }
}
```

> No `overrides` block. An earlier revision pinned `vite` there to reconcile `@vitejs/plugin-react@6` (needs vite `^8`) with `vitest@3` (supports `^5 || ^6 || ^7`), which handed Vitest an unsupported major and caused it to silently discard its own transform options. `vitest@4` declares `vite: ^6 || ^7 || ^8`, so the conflict is gone at the root.

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
    "types": ["vite/client", "node"],
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
  "include": ["src", "tests"],
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
# The `jmac-suite` stack is managed outside this repository. If it is not
# running, start its containers with `docker start supabase_db_jmac-suite`
# (and siblings) -- never `supabase start`. Copy this file to `.env`.
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
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const env = loadEnv('test', process.cwd(), 'VITE_')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    exclude: ['**/node_modules/**', '**/integration/**', 'tests/db/**'],
    env: {
      // Fallbacks so the unit suite runs on a fresh clone or in CI, where the
      // git-ignored .env does not exist. src/lib/supabase.ts throws at import
      // time when either variable is missing, so without these the first test
      // that transitively imports it fails during collection rather than for
      // any reason to do with the test. A real .env still takes precedence.
      VITE_SUPABASE_URL: env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:56321',
      VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY ?? 'test-anon-key',
    },
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
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { compile } from 'tailwindcss'
import { beforeAll, describe, expect, it } from 'vitest'

const tokensPath = resolve(__dirname, 'tokens.css')
const tokens = readFileSync(tokensPath, 'utf8')

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
  '--color-muted',
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
  '--jmac-mist': '#F1F5F9',
  '--jmac-line': '#E2E8F0',
  '--jmac-body': '#64748B',
  '--jmac-success': '#22C55E',
  '--jmac-warning': '#F59E0B',
  '--jmac-error': '#EF4444',
  '--jmac-on-dark': '#FFFFFF',
  '--jmac-on-light': '#0F172A',
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

// Everything above matches strings in tokens.css. That is not enough on its
// own: the --shadow-* trio was declared in :root rather than in an @theme
// block for the whole of Track 1, so Tailwind never saw it and .shadow-sm
// shipped Tailwind's stock (much heavier) default -- while every assertion
// above passed. These tests compile the real stylesheet with Tailwind and
// assert the utilities components will actually receive.
const require = createRequire(import.meta.url)
const tailwindEntry = resolve(
  dirname(require.resolve('tailwindcss/package.json')),
  'index.css'
)

async function loadStylesheet(id: string, base: string) {
  const path = id === 'tailwindcss' ? tailwindEntry : resolve(base, id)
  return { path, base: dirname(path), content: readFileSync(path, 'utf8') }
}

const UTILITIES = [
  'bg-background',
  'bg-surface',
  'bg-muted',
  'bg-primary',
  'bg-accent',
  'text-primary-foreground',
  'text-accent-foreground',
  'text-warning-foreground',
  'shadow-sm',
  'shadow-md',
  'shadow-lg',
]

describe('compiled Tailwind utilities', () => {
  let css = ''

  beforeAll(async () => {
    const compiler = await compile(`@import 'tailwindcss';\n${tokens}`, {
      base: dirname(tokensPath),
      loadStylesheet,
    })
    css = compiler.build(UTILITIES)
  })

  const rule = (selector: string) => {
    const start = css.indexOf(`${selector} {`)
    expect(start, `${selector} was not emitted by Tailwind`).toBeGreaterThan(-1)
    return css.slice(start, css.indexOf('}', start) + 1)
  }

  it('resolves .bg-primary to the navy brand variable', () => {
    expect(rule('.bg-primary')).toContain('var(--jmac-navy)')
  })

  it('resolves .bg-accent to the sky brand variable', () => {
    expect(rule('.bg-accent')).toContain('var(--jmac-sky)')
  })

  // Finding 7: --color-muted used to alias --jmac-canvas, making bg-muted
  // invisible against the page. Skeleton, EmptyState, inactive Tabs and table
  // zebra striping all depend on these two resolving differently.
  it('gives .bg-muted a surface distinguishable from .bg-background', () => {
    const muted = rule('.bg-muted')
    const background = rule('.bg-background')
    expect(muted).toContain('var(--jmac-mist)')
    expect(background).toContain('var(--jmac-canvas)')
    expect(muted.replace('.bg-muted', '')).not.toBe(
      background.replace('.bg-background', '')
    )
  })

  // Finding 8: foreground tokens must not alias surface brand variables, or a
  // future dark palette flips button text along with the card colour.
  it('routes foreground utilities through the on-dark/on-light variables', () => {
    expect(rule('.text-primary-foreground')).toContain('var(--jmac-on-dark)')
    expect(rule('.text-accent-foreground')).toContain('var(--jmac-on-light)')
    expect(rule('.text-warning-foreground')).toContain('var(--jmac-on-light)')
  })

  // Finding 1: this is the assertion whose absence let the dead shadow scale
  // ship. Tailwind resolves shadow values at build time, so the only proof is
  // the compiled declaration.
  it.each([
    ['.shadow-sm', '0 1px 2px 0', 'rgb(15 23 42 / 0.04)'],
    ['.shadow-md', '0 2px 8px -1px', 'rgb(15 23 42 / 0.08)'],
    ['.shadow-lg', '0 8px 24px -4px', 'rgb(15 23 42 / 0.10)'],
  ])('compiles %s to the JMAC elevation value', (selector, geometry, colour) => {
    const declaration = rule(selector)
    expect(declaration).toContain(geometry)
    expect(declaration).toContain(colour)
  })

  it('does not fall back to any of Tailwind stock shadow scale', () => {
    // Tailwind's defaults are all rgb(0 0 0 / ...). JMAC's are all slate-900.
    for (const selector of ['.shadow-sm', '.shadow-md', '.shadow-lg']) {
      expect(rule(selector)).not.toContain('rgb(0 0 0')
    }
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/styles/tokens.test.ts`
Expected: FAIL — `ENOENT: no such file or directory ... tokens.css`.

- [ ] **Step 3: Write `src/styles/tokens.css`**

Three blocks. `:root` holds brand values; a plain `@theme` holds the elevation scale; `@theme inline` gives the colours meaning. Components only ever reference the semantic layer, which is what makes a dark palette a later addition to this one file rather than a sweep through every component.

> The shadows must sit in a `@theme` block, not in `:root`. Tailwind builds utilities only from `@theme`, so `--shadow-*` declared in `:root` is dead CSS and `.shadow-sm` silently emits Tailwind's much heavier stock value. Likewise `--jmac-on-dark` / `--jmac-on-light` exist so that `*-foreground` tokens do not alias surface colours, which a dark palette would flip.

```css
:root {
  /* ---- JMAC brand palette (PROJECT_CONTEXT.md) ---- */
  --jmac-navy: #0F172A;
  --jmac-blue: #1D4ED8;
  --jmac-sky: #38BDF8;
  --jmac-canvas: #F8FAFC;
  --jmac-surface: #FFFFFF;
  --jmac-mist: #F1F5F9;
  --jmac-line: #E2E8F0;
  --jmac-body: #64748B;
  --jmac-success: #22C55E;
  --jmac-warning: #F59E0B;
  --jmac-error: #EF4444;

  /* Text that rides on a dark fill (navy button, error toast) and text that
     rides on a light fill (sky accent, amber badge). These are deliberately
     NOT --jmac-surface / --jmac-navy: those two name surface colours, which a
     dark palette flips. Foreground text must not flip with them, or a primary
     button turns dark-on-navy. Keeping them separate makes a future dark
     block a one-file addition. */
  --jmac-on-dark: #FFFFFF;
  --jmac-on-light: #0F172A;

  /* Squarer than Harmony Suite's 0.75rem. The brief names SAP Fiori and
     Microsoft 365, which are less rounded. */
  --radius: 0.5rem;
}

/* Shadows live in a real @theme block, not in :root. Tailwind only builds
   utilities from @theme, so declaring --shadow-* in :root leaves .shadow-sm
   emitting Tailwind's stock (and much heavier) default while the JMAC values
   sit unused. Three levels only -- PROJECT_CONTEXT.md rejects large shadows,
   so borders carry most of the separation. Non-inline so Tailwind owns the
   values; tokens.test.ts asserts the compiled output, not this text. */
@theme {
  --shadow-sm: 0 1px 2px 0 rgb(15 23 42 / 0.04);
  --shadow-md: 0 2px 8px -1px rgb(15 23 42 / 0.08);
  --shadow-lg: 0 8px 24px -4px rgb(15 23 42 / 0.10);
}

@theme inline {
  --color-background: var(--jmac-canvas);
  --color-surface: var(--jmac-surface);
  --color-surface-foreground: var(--jmac-on-light);
  --color-border: var(--jmac-line);
  --color-input: var(--jmac-line);

  /* Primary hover moves navy -> blue, exactly as PROJECT_CONTEXT.md
     specifies. This is a hue change rather than a shade change, so primary
     buttons visibly switch colour family on hover. Kept as specified; change
     this one line to make hover a navy tint instead. */
  --color-primary: var(--jmac-navy);
  --color-primary-hover: var(--jmac-blue);
  --color-primary-foreground: var(--jmac-on-dark);

  --color-accent: var(--jmac-sky);
  --color-accent-foreground: var(--jmac-on-light);

  --color-heading: var(--jmac-navy);
  --color-body: var(--jmac-body);
  /* Deliberately NOT --jmac-canvas: muted surfaces (Skeleton, EmptyState,
     inactive Tabs, table zebra striping) must read as distinct from the page
     behind them, and spec 5.1 forbids components reaching for a hex literal. */
  --color-muted: var(--jmac-mist);
  --color-muted-foreground: var(--jmac-body);

  --color-success: var(--jmac-success);
  --color-warning: var(--jmac-warning);
  --color-error: var(--jmac-error);
  --color-success-foreground: var(--jmac-on-dark);
  --color-warning-foreground: var(--jmac-on-light);
  --color-error-foreground: var(--jmac-on-dark);

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

## Tasks 4–9 superseded

**Revised 2026-08-07 during execution.** Tasks 4–9 as originally written created a new Supabase project and authored three migrations plus a seed. That work is void: the unified database already exists as the running `jmac-suite` stack (spec §1.1). Phase 1 now connects to it and authors no schema.

The replacements are Tasks 4, 5, and 6 below. Tasks 7, 8, and 9 are withdrawn.

### Constraint that governs all remaining tasks

`jmac-suite` holds live data and **no repository on this host owns its migrations** — its schema exists only in the Postgres volume. It cannot be rebuilt if dropped.

Therefore, for every remaining task:

- **No DDL.** No `create`, `alter`, or `drop` against `jmac-suite`.
- **No DML.** No `insert`, `update`, `delete`, or `truncate`. Tests are read-only.
- **No `supabase/` directory in this repository**, and no `supabase db reset`, `db push`, or `db start` targeting this stack.
- A row-count baseline for all 62 base tables is recorded at `docs/db-baseline.txt`. Track 1 ends by re-taking it and diffing; any change is a failure.

---

## Task 4: Connect to the jmac-suite database

**Files:**
- Create: `.env` (git-ignored, not committed), `README.md`
- Modify: `.env.example`, `package.json` (scripts only)

**Interfaces:**
- Consumes: Task 1's `src/vite-env.d.ts`, which already declares `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Produces: a populated `.env` that Tasks 5 and 6 read; an `npm run db:types` script that generates types from the live schema

- [ ] **Step 1: Confirm the database scripts in `package.json`**

This step originally deleted `db:start`, `db:stop` and `db:reset`, which the first revision of Task 1 wrote. Task 1 no longer writes them — leaving them on disk for three tasks was the exact transient window this design exists to eliminate, since `supabase db reset` would drop 70 tables of live data that no migration set on this host can rebuild.

So this step is now a check rather than an edit. Confirm `package.json` carries exactly one `db:*` entry, pointed at the database URL rather than `--local` (which would require a `supabase/config.toml` that must not exist here):

```json
"db:types": "supabase gen types typescript --db-url postgresql://postgres:postgres@127.0.0.1:56322/postgres > src/types/database.types.ts"
```

If any stack-mutating script is present, delete it. `src/lib/no-managed-stack.test.ts` asserts this in `npm test`, so a regression fails the suite rather than waiting for review. Leave every other script unchanged.

- [ ] **Step 2: Write `.env.example`**

Overwrite the file created in Task 1. The anon key is the standard Supabase local development key and is not a secret — committing it in the example is correct and saves the next developer a lookup.

The "start it from its own project directory" advice an earlier draft carried was wrong: spec §1.1 records that no such directory exists on this host. A developer with a stopped stack needs the docker command, or their next guess is `npx supabase start` — which leads straight toward `supabase init` and the hazard this design exists to prevent.

```
# JMAC connects to the local `jmac-suite` Supabase stack, which is managed
# outside this repository. No project directory owning it could be located on
# this host (see spec 1.1), so if the stack is down, start its containers
# directly: `docker start supabase_db_jmac-suite` and its siblings (see
# `docker ps -a --filter name=jmac-suite`). This repo never runs
# `supabase start` or `supabase db reset` against it.
VITE_SUPABASE_URL=http://127.0.0.1:56321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

- [ ] **Step 3: Create `.env`**

Copy `.env.example` to `.env`. Confirm `.env` is git-ignored and does **not** appear in `git status`.

- [ ] **Step 4: Verify the connection**

Run each of these and record the actual output. `$KEY` is the anon key from Step 2.

```bash
KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
curl -s -o /dev/null -w "job_postings %{http_code}\n" "http://127.0.0.1:56321/rest/v1/job_postings?select=id&limit=1" -H "apikey: $KEY"
curl -s -o /dev/null -w "departments %{http_code}\n" "http://127.0.0.1:56321/rest/v1/departments?select=id&limit=1" -H "apikey: $KEY"
```

Expected: `job_postings 200` and `departments 200`.

- [ ] **Step 5: Write `README.md`**

The connection story is non-obvious and dangerous to get wrong, so it is documented rather than left to tribal knowledge. Write this content (the outer fence below is not part of the file):

~~~
# JMAC Enterprise

Enterprise business platform by JMAC Digital Enterprise.
React 19 · TypeScript · Vite · Tailwind CSS v4 · Supabase.

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

## Database

JMAC connects to a local Supabase stack named **`jmac-suite`** on port 56321.

**This repository does not manage that stack.** It holds a 70-table unified
schema — HRMS, POS, Finance, and the role/permission layer — and no migration
set on this host can rebuild it. Treat it as infrastructure you connect to.

Never run against it:

- `supabase db reset` — drops every table, with nothing to replay
- `supabase db push` or any migration command
- Any `insert`, `update`, or `delete` from a test

There is deliberately no `supabase/` directory in this repository. Integration
tests under `tests/db/` are read-only by design.

Regenerate types after a schema change made elsewhere:

```bash
npm run db:types
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check and build |
| `npm test` | Unit tests |
| `npm run test:db` | Read-only integration tests against `jmac-suite` |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | oxlint |
| `npm run db:types` | Regenerate `src/types/database.types.ts` |
~~~

- [ ] **Step 6: Commit**

`.env` must NOT be staged.

```bash
git add package.json .env.example README.md
git commit -m "chore: connect to the jmac-suite Supabase stack"
```

---

## Task 5: Generated types and the typed Supabase client

**Files:**
- Create: `src/types/database.types.ts` (generated — never hand-edited), `src/lib/supabase.ts`, `src/lib/supabase.test.ts`

**Interfaces:**
- Consumes: Task 4's `.env` and `db:types` script
- Produces: `supabase` — a `SupabaseClient<Database>` used by every service and hook in Tracks 3 and 4. Exports type `Database` and helper `Tables<'job_postings'>`.

- [ ] **Step 1: Generate the database types**

Run: `npm run db:types`

Expected: `src/types/database.types.ts` is written and contains `users`, `profiles`, `roles`, `permissions`, `user_roles`, `modules`, `departments`, `positions`, `branches`, and `job_postings` among many others. The file is large — the schema has 70 tables. Do not hand-edit it, and do not trim it.

Confirm it compiles: `npx tsc -b`.

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

Follows HRMS `src/lib/supabase.ts`, with the error message naming each variable individually so a misconfigured environment says which one is wrong.

`Views<T>` is a separate helper from `Tables<T>` because `profiles` is a view, not a table: it is absent from `Database['public']['Tables']` and therefore unreachable through `Tables<T>`. Track 3's AuthProvider reads `profiles.status`, so the helper has a caller waiting.

```ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url) {
  throw new Error(
    'VITE_SUPABASE_URL is not set. Copy .env.example to .env — see README.md.'
  )
}

if (!anonKey) {
  throw new Error(
    'VITE_SUPABASE_ANON_KEY is not set. Copy .env.example to .env — see README.md.'
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

// Views need their own helper: `profiles` is a view, not a table, so it is
// absent from Database['public']['Tables'] and unreachable via Tables<T>.
// Track 3's AuthProvider reads profiles.status.
export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row']
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- src/lib/supabase.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase.ts src/lib/supabase.test.ts src/types/database.types.ts
git commit -m "feat: add typed Supabase client and generated database types"
```

---

## Task 6: Read-only database contract tests

**Files:**
- Create: `vitest.db.config.ts`, `tests/db/contracts.test.ts`
- Modify: `package.json` (add `test:db` script if absent)

**Interfaces:**
- Consumes: Tasks 4 and 5
- Produces: `npm run test:db` — the gate proving the database contracts Tracks 3 and 4 depend on actually hold

These tests assert what the application relies on. They **never write**. There is no seeding, no fixture setup, and no teardown — the database's existing state is the fixture.

- [ ] **Step 1: Write `vitest.db.config.ts`**

`loadEnv` is required: a node-environment Vitest run does not read `.env`, so without it the suite fails on a missing anon key even when `.env` is correct.

```ts
import path from 'node:path'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

const env = loadEnv('development', process.cwd(), 'VITE_')

export default defineConfig({
  // Same '@' alias as vitest.config.ts. Without it, a contract test importing
  // anything under src/ resolves differently here than in the unit suite.
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  test: {
    environment: 'node',
    include: ['tests/db/**/*.test.ts'],
    testTimeout: 20_000,
    // Deliberately no fallback key here, unlike vitest.config.ts: these tests
    // talk to the real jmac-suite stack, and a placeholder would turn a
    // missing .env into confusing connection failures instead of the explicit
    // error tests/db/contracts.test.ts raises in beforeAll.
    env,
  },
})
```

Confirm `package.json` carries this script; add it if missing:

```json
"test:db": "vitest run --config vitest.db.config.ts"
```

- [ ] **Step 2: Write the test**

Each assertion below was verified true against the live stack before this plan was written, so a failure means the database changed — which is exactly what the suite is for.

The client is typed (`createClient<Database>`), so table, column, and RPC names are checked at compile time. That is what makes this suite a schema-drift detector rather than a runtime smoke test: rename `positions.title` and `npm run typecheck` fails here, not just in the app.

The identity assertions carry a **control read** on the same client before checking that `users` and `profiles` come back empty. Without it the test cannot distinguish enforced RLS from a broken connection — an anonymous read of `users` returns `[]` with a valid key, a garbage key, or no key at all, so "empty" alone proves nothing.

`tests/db/contracts.test.ts`:

```ts
import { createClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'
import type { Database } from '@/types/database.types'

const URL = process.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:56321'
const ANON = process.env.VITE_SUPABASE_ANON_KEY

beforeAll(() => {
  if (!ANON) {
    throw new Error(
      'VITE_SUPABASE_ANON_KEY is unset. Copy .env.example to .env, then re-run `npm run test:db`.'
    )
  }
})

// Typed with <Database> so table names, column names, embedded relations and
// RPC names below are checked by `tsc -b` rather than being opaque strings.
// Untyped, a renamed column would break the app's client at compile time while
// this suite -- the thing meant to warn first -- kept passing.
const anon = () => createClient<Database>(URL, ANON as string)

describe('public careers contract', () => {
  // job_postings is empty in this environment (db-baseline.txt records
  // job_postings=0), and Postgres RLS denies silently: a missing or
  // misconfigured policy still returns `{ data: [], error: null }` rather
  // than an error. With no rows reaching a row-level check, this block can
  // only prove that anon holds the base SELECT grant, that the queried
  // schema (columns, embedded relations) is exposed as expected, and that
  // the departments/positions foreign keys resolve. It does NOT prove the
  // anon_view_open_postings policy itself is doing anything — that needs
  // real open and non-open rows to tell a leak from a lockdown.
  it('lets an anonymous visitor query job_postings', async () => {
    const { error } = await anon().from('job_postings').select('id, status')
    expect(error).toBeNull()
  })

  it('exposes only open postings to an anonymous visitor', async () => {
    const { data, error } = await anon().from('job_postings').select('status')
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
    // job_postings has 0 rows today, so .every() over an empty array is
    // vacuously true — this cannot yet catch an RLS regression (e.g.
    // anon_view_open_postings dropped, or replaced with `using (true)`,
    // exposing draft/closed postings publicly). The error/Array.isArray
    // checks above are what this test can actually fail on right now; the
    // .every() below only gains real power once open listings exist.
    expect((data ?? []).every((row) => row.status === 'open')).toBe(true)
  })

  it('joins department and position names anonymously', async () => {
    const { error } = await anon()
      .from('job_postings')
      .select('id, departments(name), positions(title)')
      .order('date_posted', { ascending: false, nullsFirst: false })
    expect(error).toBeNull()
  })

  it('reads departments and positions anonymously', async () => {
    const [departments, positions] = await Promise.all([
      anon().from('departments').select('id, name').limit(1),
      anon().from('positions').select('id, title').limit(1),
    ])
    expect(departments.error).toBeNull()
    expect(positions.error).toBeNull()
    expect(departments.data?.length).toBeGreaterThan(0)
    expect(positions.data?.length).toBeGreaterThan(0)
  })
})

describe('identity contract', () => {
  // These two are the most security-relevant assertions in the suite, so they
  // must be able to fail for the right reason. They previously read
  // `error !== null || rows.length === 0`, which cannot: this stack answers
  // GET /rest/v1/users with `[]` and HTTP 200 whether the anon key is correct,
  // garbage, or absent entirely, so a completely misconfigured client was
  // observationally identical to correctly-enforced RLS -- and the `||` meant
  // any failure at all, including a dead network, satisfied the expectation.
  //
  // The control read below is the fix. It runs on the SAME client and hits
  // departments, which is world-readable and non-empty, so the client must
  // demonstrably work before the empty result from users is allowed to count
  // as evidence of anything.

  it('exposes no user rows to an anonymous visitor', async () => {
    const client = anon()

    const control = await client.from('departments').select('id').limit(1)
    expect(control.error).toBeNull()
    expect(control.data?.length).toBeGreaterThan(0)

    const { data, error } = await client.from('users').select('id, email')
    expect(error).toBeNull()
    expect(data).not.toBeNull()
    // Reading a selected column keeps the select string type-checked:
    // supabase-js resolves an unknown column to a SelectQueryError row type,
    // which only fails compilation at a use site like this one.
    expect((data ?? []).map((row) => row.email)).toEqual([])
  })

  it('exposes no profile rows to an anonymous visitor', async () => {
    const client = anon()

    const control = await client.from('departments').select('id').limit(1)
    expect(control.error).toBeNull()
    expect(control.data?.length).toBeGreaterThan(0)

    const { data, error } = await client.from('profiles').select('id, email')
    expect(error).toBeNull()
    expect(data).not.toBeNull()
    expect((data ?? []).map((row) => row.email)).toEqual([])
  })
})

describe('authorization contract', () => {
  // Anonymous callers legitimately resolve to no roles and no permissions.
  // The contract under test is that the helpers exist and are callable —
  // Track 3's AuthProvider calls them on every sign-in. 42883 is
  // undefined_function: that would mean the helper is gone.
  it('exposes my_roles as a callable RPC', async () => {
    const { error } = await anon().rpc('my_roles')
    expect(error?.code).not.toBe('42883')
  })

  it('exposes my_permissions as a callable RPC', async () => {
    const { error } = await anon().rpc('my_permissions')
    expect(error?.code).not.toBe('42883')
  })
})
```

- [ ] **Step 3: Run the suite**

Run: `npm run test:db`
Expected: PASS, 8 tests.

If a test fails, **do not change the database to make it pass.** Report the failure — it means the schema differs from what the plan recorded, and that is information the controller needs.

- [ ] **Step 4: Run the full verification suite**

Run: `npm test && npm run typecheck && npm run build && npm run lint`
Expected: all four succeed.

- [ ] **Step 5: Verify no database rows changed**

```bash
docker exec supabase_db_jmac-suite psql -U postgres -d postgres -tAc "select table_name||'='||(xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I', table_name), false, true, '')))[1]::text::int from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by table_name;" > /tmp/db-after.txt
diff docs/db-baseline.txt /tmp/db-after.txt && echo UNCHANGED
```

Expected: `UNCHANGED`. Any diff is a task failure — report it rather than explaining it away.

- [ ] **Step 6: Commit**

```bash
git add vitest.db.config.ts tests/db/contracts.test.ts package.json
git commit -m "test: add read-only contract tests against jmac-suite"
```

---

## Tasks 7, 8, 9 — withdrawn

Superseded by the adoption decision. Their content authored schema that already exists:

- **Task 7** (`0003_recruitment_public.sql`) — `job_postings` exists, with the `anon_view_open_postings` policy already in place.
- **Task 8** (seed + RLS tests) — seeding writes to a live database Phase 1 does not own (spec §3.4); the RLS assertions moved into Task 6 as read-only contracts.
- **Task 9** (typed client) — became Task 5.

---

## Track 1 Definition of Done

All of the following must hold before Track 2 begins:

1. `npm run typecheck` — no errors
2. `npm run build` — succeeds
3. `npm test` — passes (`cn`, tokens, supabase client)
4. `npm run test:db` — 8 contract tests pass against `jmac-suite`
5. `npm run lint` — no errors
6. `npm run dev` starts in under 5 seconds, confirming `integration/` is excluded from the watcher
7. `git status` is clean, and `.env` is untracked
8. No file under `integration/` has a modification timestamp later than the start of this track
9. The `db-baseline.txt` diff is empty — Phase 1 wrote nothing to `jmac-suite`

---

## Tracks 2–4

Tracks 2 (30 shared components), 3 (layouts and authentication), and 4 (landing page and careers) are specified in §5–§7 of the design document. Their plans are written immediately before each track executes, not now.

This is deliberate. A plan must contain real import paths, real prop names, and real test code — no placeholders. Writing Track 3's route-guard tests today would mean inventing the exact signature of a `Button` that Track 2 has not built yet, and any drift between the guess and the reality becomes a plan that lies. Each track's plan is written against the code that actually exists when it starts.

Track 3 carries one open question from the revision: the authorization services in spec §4.2 read `my_permissions()` and `my_roles()`, and the passwords for the six seeded accounts are recorded nowhere on this host. Obtaining or resetting them is a Track 3 step — and resetting a password is a write, so it needs the same authorization as any other change to `jmac-suite`.
