# SMIN — Shanvi Mine Intelligence

An offline-first mining project workspace for establishing spatial controls, importing drillhole collars, reviewing data quality, and tracking processing/audit state.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/smin/src/` — Phase 1 web workspace and local persistence.
- `samples/iron-ore-drillholes.csv` — demo collar data for the import workflow.
- `docs/phase-1.md` — Phase 1 working functions, pending scope, and developer notes.
- `.github/workflows/windows-build.yml` — Windows runner foundation for future Tauri packaging.

## Architecture decisions

- Phase 1 uses browser-local persistence so project setup and drillhole review work without network access.
- Scientific modules beyond intake and validation remain explicitly scoped for later phases; no placeholder calculations are represented as complete.
- The Windows workflow installs the native build prerequisites but intentionally stops before producing an installer until the Tauri shell and packaged engine are added.

## Product

Phase 1 supports project setup, CRS metadata, local project switching, CSV collar import, validation status, processing queue visibility, audit history, sample data, export, and dark/light themes. Geological modelling, resource estimation, mine planning, scheduling, economics, reporting, and AI assistance are pending.

## User preferences

- Keep implementation claims honest: unfinished mining workflows must be labeled pending rather than presented as functional.

## Gotchas

- Run the app through its managed workflow so `PORT` and `BASE_PATH` are present.
- Browser local storage is a Phase 1 stand-in for the planned SQLite/Tauri local project database.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
