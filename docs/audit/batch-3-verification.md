# Batch 3 Catalog Verification

## Current status

Batch 3 remains in progress. Code-level and live Compose infrastructure/catalog-read checks pass; full admin CRUD and browser acceptance are still pending.

## Verified

- Movie Service test suite: 4 tests, 0 failures.
- Testcontainers Neo4j startup checks pass during the Movie Service suite.
- Frontend build passes.
- Frontend tests: 52 tests, 0 failures.
- Existing Playwright authentication browser contract: 1 test passed against the healthy Compose web stack.
- Frontend catalog browse/detail routes and typed API client are pushed to `main`.
- Angular catalog admin entry point is now guarded at `/admin/catalog`; typed movie/genre mutation methods and accessible create forms are covered by 6 focused route/client tests.
- Fresh Compose smoke: migrator exited 0, 11 constraints, 3 ONLINE indexes, GDS `2026.07.0`, four services healthy, and web reachable.
- Live catalog probes: `GET /api/v1/movies` 200, `GET /api/v1/genres` 200, anonymous `POST /api/v1/movies` 401.
- Live non-empty catalog probes with disposable Neo4j fixtures: collection/detail/related reads returned 200; combined title, genre, year, sort, and direction filters returned the expected two rows; fixtures were removed after verification.
- Repository regression fixes verified by focused `MovieCatalogRepositoryTest`: 2 tests, 0 failures; search row mapping now uses typed Neo4j mapping and scalar bindings use value-then-parameter order.
- Live authenticated mutation probes with disposable accounts: USER movie mutation returned 403; ADMIN movie create/update/delete returned 201/200/204; referenced genre deletion returned 409, then 204 after movie cleanup; deleted movie lookup returned 404. Disposable users and fixtures were removed afterward.

## Pending live gate

Run the remaining frontend catalog e2e and browser-level admin acceptance. The existing authentication browser contract and focused admin entry-point tests are green, but no Batch 3 completion claim is made until catalog/admin browser gates pass.

## Commits

- `ec15c47`, `49d4d27`, `a7737c3`, `03c5617`, `07694c1`, `97c2a7f`, `a2a59b2`, `3310206`, `5478226`, `194562c`, `9fcc551`, `ac17b83`, `d4ffb3a`
