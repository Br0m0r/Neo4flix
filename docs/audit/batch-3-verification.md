# Batch 3 Catalog Verification

## Current status

Batch 3 remains in progress. Code-level and live Compose infrastructure/catalog-read checks pass; authenticated ADMIN browser CRUD now passes, with the final clean-checkout/review gate pending.

## Verified

- Movie Service test suite: 4 tests, 0 failures.
- Testcontainers Neo4j startup checks pass during the Movie Service suite.
- Frontend build passes.
- Frontend tests: 58 tests, 0 failures.
- Current Playwright browser contracts: default suite 3/3 passed against the healthy Compose web stack (authentication, anonymous catalog browse, and USER mutation denial); credential-gated ADMIN CRUD contract passed 1/1 with a disposable local admin fixture.
- Frontend catalog browse/detail routes and typed API client are pushed to `main`.
- Angular catalog admin entry point is guarded at `/admin/catalog`; typed movie/genre mutation methods, accessible create forms, and movie/genre edit/delete controls are covered by route/client assertions plus 3 focused component tests.
- Fresh Compose smoke: migrator exited 0, 11 constraints, 3 ONLINE indexes, GDS `2026.07.0`, four services healthy, and web reachable.
- Live catalog probes: `GET /api/v1/movies` 200, `GET /api/v1/genres` 200, anonymous `POST /api/v1/movies` 401.
- Live non-empty catalog probes with disposable Neo4j fixtures: collection/detail/related reads returned 200; combined title, genre, year, sort, and direction filters returned the expected two rows; fixtures were removed after verification.
- Repository regression fixes verified by focused `MovieCatalogRepositoryTest`: 2 tests, 0 failures; search row mapping now uses typed Neo4j mapping and scalar bindings use value-then-parameter order.
- Unknown sort validation is now enforced: focused catalog query tests are 3/3 green and live `GET /api/v1/movies?sort=drop%20table` returns 400.
- Live authenticated mutation probes with disposable accounts: USER movie mutation returned 403; ADMIN movie create/update/delete returned 201/200/204; referenced genre deletion returned 409, then 204 after movie cleanup; deleted movie lookup returned 404. Disposable users and fixtures were removed afterward.

## Pending live gate

Run the final clean-checkout verification and review. Authentication, anonymous browse, USER denial, ADMIN CRUD, and focused admin component tests are green, but no Batch 3 completion claim is made until the final gate passes.

## Commits

- `ec15c47`, `49d4d27`, `a7737c3`, `03c5617`, `07694c1`, `97c2a7f`, `a2a59b2`, `3310206`, `5478226`, `194562c`, `9fcc551`, `ac17b83`, `d4ffb3a`, `414822c`, `92e0c80`
