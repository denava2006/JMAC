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
