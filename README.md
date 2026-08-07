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
tests under `tests/db/` are read-only by design, and
`src/lib/no-managed-stack.test.ts` fails `npm test` if either that directory or
a stack-mutating script appears.

### Starting the stack

If the stack is down, start the containers directly. **Do not run
`npx supabase start`** — without a `supabase/config.toml` it will offer to
create one, which is the first step toward `db reset`.

```bash
docker start supabase_db_jmac-suite supabase_kong_jmac-suite \
  supabase_rest_jmac-suite supabase_auth_jmac-suite
```

`docker ps -a --filter name=jmac-suite` lists the rest (studio, storage,
realtime, inbucket, analytics); start them too if you need Studio on 56323.
Check it is up with:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:56321/rest/v1/
```

Regenerate types after a schema change made elsewhere:

```bash
npm run db:types
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check and build |
| `npm run preview` | Serve the production build locally |
| `npm test` | Unit tests |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:db` | Read-only integration tests against `jmac-suite` |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | oxlint over `src`, `tests`, and the root configs |
| `npm run db:types` | Regenerate `src/types/database.types.ts` |

The unit suite carries committed fallbacks for `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY`, so `npm test` runs on a fresh clone with no `.env`.
`npm run test:db` genuinely needs one — copy `.env.example`.
