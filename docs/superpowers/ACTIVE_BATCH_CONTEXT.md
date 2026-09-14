# Active Batch Context — Batch 3 Catalog

> **Status:** IN PROGRESS — backend catalog and live authenticated API gates pass; Angular admin/catalog browser gates remain.
>
> **Purpose:** Compact handoff for direct-main Batch 3 execution. This cache does not override canonical specifications, the approved Batch 3 plan, or the existing SDD ledger.

## Repository state

- Worktree: `C:\Users\User\Desktop\Neo4flix`
- Branch: `main` (direct-main execution; do not create new worktrees)
- Current head: `a0095e0` (`docs: record admin browser acceptance`)
- Batch 3 plan: `docs/superpowers/plans/2026-09-14-batch-3-catalog.md`
- Batch 3 audit: `docs/audit/batch-3-verification.md`
- Existing SDD ledger: `.superpowers/sdd/2026-09-13-batch-2-authentication/` (Batch 2 remains complete and preserved)
- Local `.env` is ignored and must never be committed or printed.

## Batch goal and binding contracts

Deliver the Movie Service catalog vertical slice: anonymous movie/genre reads, admin-only movie/genre CRUD, safe combined search, related movies, and matching Angular browse/search/detail/admin surfaces.

- Movie Service owns Movie and Genre graph mutations; Cypher input is parameterized.
- Public `GET /api/v1/movies`, `GET /api/v1/movies/{id}`, `GET /api/v1/movies/{id}/related`, and `GET /api/v1/genres` remain anonymous.
- All Movie/Genre mutations require `ROLE_ADMIN`; USER mutations must be rejected server-side.
- Sort fields are allowlisted; pagination is bounded and deterministic; `releaseDate` stays nullable.
- Movie deletion removes only its relationships; referenced Genre deletion returns conflict.

## Workstream dispatch

| State | Workstream | Evidence / handoff |
| --- | --- | --- |
| Complete for current scope | Tasks 1–3 persistence, REST, Neo4j wiring | `ec15c47..9a1b459`; focused Java tests, live non-empty reads, combined filters, related reads, and authenticated API CRUD recorded in `docs/audit/batch-3-verification.md` |
| Complete | Existing auth/browser baseline | Frontend 58 tests pass; existing Playwright auth contract 1/1 passes against Compose |
| Complete for current scope | Task 4 Angular catalog/admin browser surface | Public browse/detail, guarded admin CRUD controls, USER denial, and credential-gated ADMIN browser CRUD are verified |
| In progress | Task 5 checkpoint | Run clean-checkout verification, independent review, and update only Batch 3 status in `00_MASTER_EXECUTION_PLAN.md` |

## Verified commands and live evidence

- `scripts/smoke-compose.ps1 -EnvFile .env`: migrator exit 0; 11 constraints; 3 ONLINE indexes; GDS `2026.07.0`; four services healthy; web reachable.
- Movie Service focused tests: compile/package green; `MovieCatalogRepositoryTest` 3/3 green, including unknown-sort rejection.
- Frontend: `npm test` 14 files / 58 tests green with elevated workspace access.
- Browser: `npx playwright test` 3/3 passed by default (authentication, anonymous catalog browse, and USER mutation denial); credential-gated ADMIN CRUD contract passed 1/1 with a disposable local admin fixture.
- Angular Task 4 focused tests: route/client assertions plus 3 admin component tests passed; full frontend suite is 14 files / 58 tests green, lint and production build green.
- Live anonymous reads: movies 200, genres 200, anonymous movie POST 401; unknown sort returns 400.
- Live disposable catalog fixture: collection/detail/related 200; combined title/genre/year/sort/direction filter returned expected rows.
- Live disposable auth fixture: USER movie POST 403; ADMIN movie create/update/delete 201/200/204; referenced genre delete 409 then 204; deleted movie 404. Fixtures/accounts were removed.

## Current blocker / acceptance gap

Do not mark Batch 3 complete yet. ADMIN browser CRUD is now verified; the remaining gate is full clean-checkout verification and review before changing Batch 3 status.

## Dispatch policy

Dispatch only the first unfinished Batch 3 workstream. Preserve direct-main execution, current implementation, completed tasks, and the existing Batch 1/2 audit history. Use TDD for new behavior, run focused verification before broader checks, and record evidence without secrets. Do not redispatch completed backend or auth work.
