# Test Evidence Index

Date: 2026-09-15
Environment: Windows, Docker Desktop, Java 26 runtime with the project Maven
wrapper, Node/npm frontend toolchain

## Fresh regression evidence

| Slice | Command/evidence | Result |
| --- | --- | --- |
| Backend and migrator reactor | `.\mvnw.cmd test` | 131 tests, 0 failures, 0 errors, 0 skips; `BUILD SUCCESS` |
| Frontend unit suite | `npm.cmd --prefix frontend test` | 27 files, 105 tests passed |
| Audit fixture loader | `.\mvnw.cmd -pl database/migrator -am '-Dtest=AuditSeedLoaderIT' test` | 2/2 passed; idempotent fixture reload |
| Recommendation golden fixture | `.\mvnw.cmd -pl backend/recommendation-service -am '-Dtest=RecommendationGoldenFixtureIT' '-Dsurefire.failIfNoSpecifiedTests=false' test` | 2/2 passed; deterministic ranking and GDS cosine path |
| Browser contract | `npm.cmd --prefix frontend run e2e` against local Compose | 8 passed, 1 skipped for absent disposable ADMIN credentials |
| Standalone ADMIN browser contract | Disposable registration/promotion and cleanup | 1 passed; cleanup count 0 |
| Compose runtime | `docker compose ... ps` and `scripts/smoke-compose.ps1` | Six services healthy; web returned HTTP 200 with request ID |
| Recommendation/Neo4j outage handling | Batch 11 controlled outage record | Catalog remained available; recommendation outage returned a request-traceable error; stack restored |

## Explicit limitations

- The browser suite is automated evidence, not a substitute for the seven-step
  human usability session in `USABILITY_TEST.md`.
- `scripts/k6/smoke.js` is an anonymous catalog smoke profile. It does not prove
  authenticated recommendation/rating throughput or a release SLO.
- Local Compose is HTTP-only. HTTPS redirect/HSTS, certificate rotation, and
  production ingress evidence belong to the deployment batch.
- Optional OWASP Dependency-Check, Gitleaks, and Trivy binaries were not
  installed in the execution environment; their absence is recorded rather than
  treated as a passing scan.
