# SMIN Phase 1 — Functional Desktop Foundation

This first delivery establishes the SMIN product foundation with a Tauri 2 desktop shell, Rust SQLite project database, deterministic spatial/interval validation, drillhole intake, processing status, audit history, and Windows NSIS packaging configuration. The web preview uses a local persistence adapter when run outside Tauri so the workflows remain demonstrable in a browser.

## Run for development

```bash
pnpm install
pnpm --filter @workspace/smin run dev
```

The managed preview supplies the required port and base path.

## Working functions

- Create and edit a project setup with required spatial controls.
- Load a sample iron-ore project.
- Persist project settings, imported rows, theme, and audit entries in browser storage.
- Paste/import CSV drillhole collar data with header validation and numeric checks.
- Run a deterministic Phase 1 validation pass for duplicate IDs, missing coordinates, invalid depths, and CRS readiness.
- Explore project objects and inspect their properties/status.
- Show processing jobs and audit history.
- Export the current drillhole table as CSV.
- Render the approved project boundary and drillhole traces, with selectable collar properties.
- Native Tauri commands create/open/save/close projects and initialize `project.smin`, `project.db`, and the required Phase 1 project folder structure.
- Native command responses are structured and cover project folders, database initialization, metadata, CSV recording, and audit events.
- The Windows bundle includes the fictional 15-hole `SMIN Iron Ore Demo` project and branded PNG/ICO application icons.
- Native Tauri configuration targets an NSIS installer.
- Switch between Simple and Professional modes and light/dark themes.

## Pending by design

Geological modelling, resource estimation, block modelling, mine design, optimization, scheduling, economics, reporting, and AI assistance are not claimed as complete in Phase 1. Windows compilation and the final `.exe` can only be executed on the configured Windows GitHub runner; the repository now produces `SMIN-Setup.exe` there via the NSIS bundle target.

## Sample data

`samples/smin-iron-ore-demo/` is a fictional, openly structured demo project with 15 collars, survey data, lithology, assays, density, boundary metadata, and validation results. `samples/iron-ore-drillholes.csv` remains available as a small import fixture.