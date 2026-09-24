# Neo4flix audit report

**Last reviewed:** 2026-09-24
**Scope:** repository source, documentation, automated checks, runtime
evidence, and the official 01-edu audit questions.
**Official question source:** [01-edu Neo4flix audit](https://github.com/01-edu/public/tree/master/subjects/java/projects/neo4flix/audit)

This is the working reconciliation checklist. It records what is verified,
what is only partially evidenced, and what still needs an environment or human
action. It does not replace the detailed batch documents or the runbook.

## Status legend

- `[x]` Verified by current evidence.
- `[~]` Implemented or partly evidenced, but the acceptance gate is incomplete.
- `[!]` Blocked by the current environment or a missing external prerequisite.
- `[ ]` Not yet done.

## Executive verdict

The repository contains a substantial, connected implementation: Angular
frontend, Spring Boot services, Neo4j migrations and graph queries, JWT/refresh
authentication, TOTP 2FA, ratings, watchlists, sharing, recommendations,
security controls, test fixtures, and operational scripts.

The project is **not yet audit/release complete**. The remaining work is mostly
evidence and deployment work rather than an unimplemented core feature:

1. Docker/Neo4j must be available again so integration, Compose, browser, and
   audit-fixture checks can run.
2. Batch 13 load/integrity/performance evidence is still incomplete.
3. Batch 14 production packaging and HTTPS/TLS/HSTS evidence is still open.
4. A real participant usability session and final Batch 15 reconciliation are
   still required.

Do not mark the project complete until the blocking checklist near the end of
this file is closed with dated evidence.

## Repository and execution snapshot

- [x] Current branch is `main`, tracking `github/main`.
- [x] Current repository head is `16d3a92` (`docs: organize canonical reference files`).
- [~] The worktree already contains uncommitted documentation/study-guide
  changes and a pre-existing `frontend/angular.json` change. Preserve them;
  this report does not reset or discard local work.
- [x] No obvious application-code `TODO`, `FIXME`, `TBD`, or unimplemented
  markers were found. Matches for `pending` in the code are legitimate state
  names; pending/open statements in audit docs are listed below as actual
  follow-up work.
- [~] The documented prerequisite is JDK 21. Current diagnostic runs used
  JDK 26 (`C:\Program Files\Java\jdk-26.0.1`), so those runs are useful
  evidence but are not an exact JDK-21 acceptance run.
- [!] Docker Desktop's Linux engine is unavailable in the current environment:
  `docker info` cannot connect to
  `//./pipe/dockerDesktopLinuxEngine`. Testcontainers and Compose-dependent
  checks therefore cannot be treated as current passes.

## Fresh verification evidence

### Green checks

- [x] Frontend Vitest suite: **27 files, 105 tests passed**.
- [x] Frontend production build completed successfully.
- [x] Frontend lint completed successfully.
- [x] Static contract scripts passed:
  `test-reactor-layout.ps1`, `test-migrations.ps1`,
  `test-compose-config.ps1`, and `test-security-headers.ps1`.
- [x] Security wrapper completed successfully. `npm audit` reported **0
  vulnerabilities**.
- [x] Pester wrapper suite: **6 passed, 0 failed** across
  `scripts/verify.Tests.ps1` and `scripts/security.Tests.ps1`.
- [x] Maven wrapper repository-path test passed when run with normal network
  access (`scripts/test-wrapper-repository-paths.ps1`).
- [x] Recommendation service test compilation passed for the full dependency
  reactor:
  `platform-common`, `database-migrator`, and `recommendation-service` all
  reached `BUILD SUCCESS` for `test-compile`.

### Checks that are blocked or incomplete

- [!] Full Maven `verify` stops when Testcontainers cannot find a Docker
  environment. This is an environment gate, not evidence of a Java compile
  failure.
- [!] Executable-service-jar verification stops at the same Docker discovery
  failure while running integration tests.
- [!] Compose startup, health checks, browser E2E, live API smoke, Neo4j audit
  seeding, and graph-demo queries could not be freshly verified while Docker is
  unavailable.
- [~] OWASP Dependency-Check, Gitleaks, and Trivy were not installed; the
  security wrapper records them as skipped. Install them before claiming those
  optional scanner gates.
- [~] Existing audit evidence contains bounded load observations, but not the
  full deterministic-seed, sustained-concurrency, profiling, SLO, and data
  integrity evidence required by Batch 13.

## Official audit-question matrix

The statuses below distinguish implementation evidence from final acceptance
evidence. A static code answer is not promoted to a live acceptance pass when
the required runtime or human evidence is missing.

### Functional application and navigation

- [x] Core routes and page structure exist for login, registration, 2FA,
  profile, home/search, movie details, ratings, watchlist, recommendations,
  sharing, and admin flows.
- [~] Search, details, release date, genre, rating, rating-page, watchlist,
  sharing, and recommendations are represented in code and tests.
- [!] Live browser acceptance of those flows is blocked until Compose is
  healthy and the audit fixture is seeded.
- [ ] A human usability participant must complete the scripted journey in
  `docs/audit/USABILITY_TEST.md` and record observations.

### Graph model and Neo4j behavior

- [x] Migrations, nodes, relationships, indexes/constraints, and graph query
  code are present; static migration/compose contracts pass.
- [~] Recommendation logic and GDS/Cypher integration are implemented and the
  recommendation test sources compile.
- [!] Live graph shape, GDS projection, query plans, and recommendation output
  still need a running Neo4j instance and seeded audit data.

### Services and API behavior

- [x] The service layout and shared platform module are present; the Maven
  reactor resolves the recommendation test-compile path.
- [~] User, movie, rating, recommendation, authentication, sharing, and
  watchlist behavior has static/unit evidence in the repository.
- [!] Full integration/API acceptance remains blocked by Docker/Testcontainers.

### Security and privacy

- [x] JWT/RS256, refresh-cookie handling, password policy, TOTP 2FA,
  request IDs, rate limiting, security headers, and sensitive-data controls
  are implemented and covered by static/security checks.
- [x] `npm audit` currently reports zero vulnerabilities.
- [~] Optional Dependency-Check/Gitleaks/Trivy evidence is absent because the
  tools are not installed.
- [ ] HTTPS certificates, HTTP-to-HTTPS redirect, secure-cookie behavior over
  HTTPS, HSTS, and public-ingress proof remain open under Batch 14.

### Reliability, stress, and release readiness

- [~] Existing bounded k6/load notes are useful evidence, but Batch 13 is not
  closed: deterministic load seed, sustained concurrency targets, profiling,
  SLO interpretation, and integrity analysis remain.
- [ ] Clean/empty-volume startup and migration proof must be captured.
- [ ] Production/release image path and deterministic GDS packaging must be
  demonstrated; local development's `NEO4J_PLUGINS` convenience is not release
  packaging evidence.
- [ ] Final cross-document reconciliation and definition-of-done review must
  update stale metadata in `docs/audit/FINAL_STATUS.md`.

## Remaining work checklist, in priority order

### P0 — restore a verifiable runtime

- [ ] Start Docker Desktop using the Linux engine.
- [ ] Confirm `docker info` succeeds and that Testcontainers can create a
  disposable Neo4j container.
- [ ] Check the current `.env` password against the persisted Neo4j volume.
  Do not reset or delete the volume implicitly. If the password is unknown,
  make an explicit backup/reset decision first.
- [ ] Validate Compose configuration, then start the stack and wait for all
  health checks:

  ```powershell
  docker compose --env-file .env -f infra/compose.yml -f infra/compose.dev.yml config -q
  docker compose --env-file .env -f infra/compose.yml -f infra/compose.dev.yml up --build -d --wait --wait-timeout 600
  docker compose --env-file .env -f infra/compose.yml -f infra/compose.dev.yml ps
  ```

- [ ] Seed the official audit fixture and run the smoke path:

  ```powershell
  $env:NEO4J_URI = 'neo4j://localhost:7687'
  $env:NEO4J_USERNAME = 'neo4j'
  $env:NEO4J_PASSWORD = ((Get-Content .env | Where-Object { $_ -match '^NEO4J_PASSWORD=' } | Select-Object -First 1) -replace '^NEO4J_PASSWORD=', '')
  & .\scripts\seed.ps1 audit
  pwsh -NoProfile -File scripts/smoke-compose.ps1 -EnvFile .env
  ```

- [ ] Run the browser journey and record the result:

  ```powershell
  npm.cmd --prefix frontend run e2e
  ```

- [ ] Re-run the full Maven/Testcontainers gate with the documented JDK 21:

  ```powershell
  $env:JAVA_HOME = 'C:\Path\To\jdk-21'
  .\mvnw.cmd verify
  ```

- [ ] Run the targeted recommendation golden-fixture and query-plan tests:

  ```powershell
  .\mvnw.cmd -pl backend\recommendation-service -am '-Dtest=RecommendationGoldenFixtureIT,RecommendationQueryPlanIT' '-Dsurefire.failIfNoSpecifiedTests=false' test
  ```

### P1 — close audit and release gates

- [ ] Complete one real participant usability session using
  `docs/audit/USABILITY_TEST.md`; record task success, friction, and findings.
- [ ] Make the load dataset deterministic and capture the seed/version used.
- [ ] Run sustained concurrency targets, then capture latency/error/resource
  results, profiling, SLO interpretation, and post-run graph/data integrity.
- [ ] Build and test the production/release images, including deterministic GDS
  packaging rather than only the local Compose plugin convenience.
- [ ] Deploy behind HTTPS and record certificate, redirect, secure-cookie,
  HSTS, and public-ingress evidence.
- [ ] Verify a clean/empty Neo4j volume performs migrations and reaches healthy
  service state.
- [ ] Install and run optional Dependency-Check, Gitleaks, and Trivy scans (or
  document an intentional, reviewed exception).
- [ ] Reconcile `docs/audit/FINAL_STATUS.md`: update date, commit hash,
  completed-batch count, open gates, and any stale “all services healthy” claim.
- [ ] Update the batch evidence documents with links to the new runtime logs,
  screenshots, and command output.

### P2 — documentation and showcase polish

- [x] Beginner study guide exists under `docs/learning/` and is linked from
  the documentation indexes.
- [x] Root and docs indexes describe the project and local quick start.
- [ ] After P0/P1 evidence is captured, link the dated evidence artifacts from
  this report and the final-status page.
- [ ] Keep generated reports, secrets, database volumes, and local `.env`
  values out of commits.

## Definition of done for the next audit pass

Do not close this report until all of the following are checked:

- [ ] Docker/Testcontainers integration suite passes on the documented JDK 21.
- [ ] Compose starts from the documented setup, all health checks pass, and
  the audit fixture is reproducible.
- [ ] Browser E2E and the official functional questions have dated evidence.
- [ ] Recommendation golden-fixture, query-plan, and integrity checks pass.
- [ ] Batch 13 load/performance evidence is complete and interpreted.
- [ ] Batch 14 HTTPS/TLS/HSTS and release-image evidence is complete.
- [ ] A human usability session is recorded.
- [ ] Empty-volume startup/migrations are verified.
- [ ] `FINAL_STATUS.md`, batch ledgers, README links, and this report agree on
  the same commit, date, and completion status.

## Useful canonical references

- [Audit runbook](AUDIT_RUNBOOK.md)
- [Official question checklist](01-EDU_AUDIT_QUESTION_CHECKLIST.md)
- [Final status snapshot](FINAL_STATUS.md)
- [Test evidence](TEST_EVIDENCE.md)
- [Security checklist](SECURITY_CHECKLIST.md)
- [Stress-test notes](STRESS_TEST.md)
- [Usability test](USABILITY_TEST.md)
- [Active Batch Context](../superpowers/ACTIVE_BATCH_CONTEXT.md)
