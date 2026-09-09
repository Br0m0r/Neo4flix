# Neo4flix — Master Execution Plan

> **For agentic workers:** This is the only document that controls **implementation order and progress state**.
>
> Requirements live in the canonical specifications. Do not use this file as a substitute for product, graph/database, API, frontend, testing/security, recommendation/audit, or deployment details.
>
> Required Superpowers workflow: use `superpowers:writing-plans` before implementation; use `superpowers:using-git-worktrees` before plan execution; prefer `superpowers:subagent-driven-development`, otherwise `superpowers:executing-plans`; use `superpowers:test-driven-development`, `superpowers:systematic-debugging`, review/fix loops, and `superpowers:verification-before-completion`.
>
> Never merge or push to `main` without explicit user approval.

## 1. Goal

Build and prove the 01-edu Neo4flix MVP:

> A secure Angular/Spring Boot microservice movie application backed by Neo4j that supports movie CRUD/search, user/auth/2FA, ratings, watchlists, shareable recommendations, and a demonstrable graph-based hybrid recommendation engine.

The final project must be straightforward to audit: graph, Cypher/GDS logic, four services, security, usability, Docker, HTTPS, and stress evidence must all be demonstrable.

## 2. Canonical Document Map

| Document | Owns |
|---|---|
| `01_PRODUCT_SPEC.md` | MVP scope, roles, workflows, exclusions, business invariants |
| `02_TECHNICAL_ARCHITECTURE.md` | stack, services, repo/package/runtime shape, build/config tooling |
| `03_GRAPH_DATABASE_SPEC.md` | graph labels/relationships/properties, constraints, migrations, transactions, ownership |
| `04_API_SPEC.md` | HTTP contract, auth/status/pagination/endpoint semantics |
| `05_FRONTEND_SPEC.md` | Angular routes/pages/components/state/UX/accessibility |
| `06_TESTING_SECURITY.md` | tests, negative paths, auth/security, load/security gates |
| `07_RECOMMENDATION_AUDIT_VALIDATION.md` | recommendation algorithm, GDS/Cypher proof, audit/usability evidence |
| `08_DEPLOYMENT_OPERATIONS.md` | Compose, GDS, TLS, secrets, seed, backup/restore, operational smoke |
| `docs/superpowers/plans/*.md` | generated task plans for one implementation batch only |

## 3. Source-of-Truth Rules

When information overlaps:

1. current official 01-edu subject/audit is the external assignment requirement; if it changes, explicitly reconcile before implementation
2. `01_PRODUCT_SPEC.md` governs approved product/MVP semantics
3. domain-specific canonical spec governs its technical concern
4. `02_TECHNICAL_ARCHITECTURE.md` governs cross-cutting implementation shape
5. this master plan governs order/progress only
6. generated Superpowers plans execute approved requirements and may not silently override them
7. existing code is current-state evidence, not authority over explicit canonical requirements

If canonical documents materially conflict on API, graph model, security, service ownership, recommendation behavior, or product invariant: **stop and report the exact conflict**. Do not invent a third interpretation.

## 4. Status Legend

- `[ ]` not started/incomplete/unverified
- `[~]` implementation exists but the batch gate is not fully proven
- `[x]` fresh acceptance evidence + required review passed
- `[!]` blocked by unresolved conflict/failure/dependency

A status is an evidence claim.

## 5. Global Implementation Invariants

1. Preserve exactly four required business microservices.
2. All use one shared Neo4j graph; write ownership remains strict.
3. Rating Service is the only `RATED` writer.
4. User Service is the only User/auth/watchlist writer.
5. Movie Service is the only Movie/Genre writer.
6. Recommendation Service is the only RecommendationShare writer and recommendation algorithm owner.
7. Movie Service recommendation endpoint is a facade, not a duplicate engine.
8. User Service rating history is a read-only facade; no duplicate rating mutation logic.
9. `POST /ratings` creates; it must not silently update an existing relationship.
10. Relationship uniqueness must survive concurrent requests.
11. `releaseYear` required; `releaseDate` optional and never fabricated.
12. Recommendations exclude already-rated movies and reflect negative ratings correctly.
13. Raw passwords/tokens/TOTP secrets/private keys never persist/log in unsafe form.
14. Access JWT remains in browser memory; refresh token is HttpOnly/Secure cookie in deployed environments.
15. Backend authorization is authoritative.
16. All user values in Cypher are parameterized; sort/query identifiers are allowlisted.
17. One-shot migrator owns schema; services do not race migrations.
18. GDS must be actually used and verified.
19. No Kafka/RabbitMQ/Redis/GraphQL/Kubernetes/WebFlux/NgRx/additional business services unless canonical design is revised.
20. Tests using mocks cannot substitute for real Neo4j/browser/runtime proof where the behavior depends on them.

## 6. Per-Batch Superpowers Protocol

### A. Prepare

1. Read this batch's **Required reading** only.
2. Inspect current repository/code/test state relevant to the batch.
3. Invoke `superpowers:writing-plans`.
4. Save plan to:

```text
docs/superpowers/plans/YYYY-MM-DD-batch-N-<slug>.md
```

5. Plan must specify exact paths, interfaces, test-first steps, dependency order, verification commands, and canonical-spec references.
6. Review plan against canonical specs before execution.

### B. Isolate

Use `superpowers:using-git-worktrees` or prove current workspace is already a safe isolated feature worktree/branch.

Never begin implementation on main/master without explicit human consent.

### C. Execute

Prefer `superpowers:subagent-driven-development`.

Current SDD expectations:

- fresh implementer per task
- controller supplies exact task brief/context rather than making workers rediscover the full repo plan
- TDD for behavior-bearing work
- implementation self-check
- spec-compliance review then code-quality review
- fix/re-review loop
- broad final review for the batch plan
- plan-scoped `.superpowers/sdd/...` ledger/workspace when provided by the installed skill; use it to avoid redispatch after context compaction

Fallback: `superpowers:executing-plans` when subagents/SDD unavailable.

Use `superpowers:systematic-debugging` for unexplained failures.

Task commits are allowed inside the isolated branch/worktree because SDD review/provenance may use commit ranges. Do not merge/push main.

### D. Verify

Invoke `superpowers:verification-before-completion` and run fresh acceptance commands.

Batch report must include:

```text
Batch:
Status:
Plan file:
Base SHA:
Head SHA:
Changed files:
Focused tests:
Integration tests:
Frontend/build/lint:
Runtime checks:
Security checks (if applicable):
Review verdict:
Known caveats:
git status --short:
git log --oneline BASE..HEAD:
```

### E. Human Checkpoint

After gate passes:

1. mark only that batch `[x]`
2. summarize implementation/proof
3. state next batch + required reading
4. stop

No automatic continuation across batch boundaries.

# 7. Ordered Implementation Batches

## Batch 0 — Repository Bootstrap and Reproducible Baseline

**Status:** [x]

**Required reading:**

- `01_PRODUCT_SPEC.md`
- `02_TECHNICAL_ARCHITECTURE.md`
- `06_TESTING_SECURITY.md`
- `08_DEPLOYMENT_OPERATIONS.md` startup/config sections

**Deliverables:**

- canonical monorepo skeleton
- root Maven reactor + backend aggregator
- four Spring Boot 4.1.1 service skeletons
- `platform-common` minimal infrastructure module
- Angular 22.1.5 + Material bootstrap
- Docker Compose skeleton with Neo4j/GDS, migrator placeholder, four services, web
- `.env.example`, `.gitignore`, `.editorconfig`
- request-ID/logging/ProblemDetail baseline
- Actuator health baseline
- root Makefile/scripts including initial `make verify`
- dependency locks/pinned image tags
- CI wrapper path

**Gate:**

- clean checkout builds Java reactor
- Angular install/build/test baseline succeeds
- Compose config validates
- Neo4j+GDS can start and respond
- four services can start/health with baseline config
- no secrets committed

**Next:** Batch 1.

---

## Batch 1 — Graph Schema, Migrations, Seeds, and Neo4j Test Harness

**Status:** [ ]

**Required reading:**

- `02_TECHNICAL_ARCHITECTURE.md` migration/GDS sections
- `03_GRAPH_DATABASE_SPEC.md`
- `06_TESTING_SECURITY.md` Neo4j/concurrency sections
- `08_DEPLOYMENT_OPERATIONS.md` migrations/seeds

**Deliverables:**

- Neo4j-Migrations one-shot migrator
- node uniqueness constraints
- relationship-key uniqueness constraints
- search/index baseline
- canonical Spring Data Neo4j mappings/projections needed by first slices
- Testcontainers Neo4j integration harness with GDS where required
- demo/audit/load seed framework
- deterministic audit fixture loader
- empty DB migration verification

**Gate:**

- empty Neo4j migrates to latest
- rerun is safe/idempotent by migration tool semantics
- constraints/indexes verified
- relationship uniqueness test proves concurrent duplicate prevention strategy
- deterministic audit seed loads
- GDS version/function smoke succeeds

**Next:** Batch 2.

---

## Batch 2 — Authentication, Profile, Refresh Sessions, and TOTP 2FA Vertical Slice

**Status:** [ ]

**Required reading:**

- `01_PRODUCT_SPEC.md` auth/profile/2FA
- `02_TECHNICAL_ARCHITECTURE.md` auth
- `03_GRAPH_DATABASE_SPEC.md` User/AuthSession/AuthChallenge/TOTP
- `04_API_SPEC.md` auth/users
- `05_FRONTEND_SPEC.md` auth/profile
- `06_TESTING_SECURITY.md` authentication/security

**Deliverables:**

- registration
- BCrypt password storage/policy
- RS256 JWT issuance/public-key validation foundation
- rotating opaque refresh session cookie
- logout/revocation
- auth/me
- profile GET/PATCH
- password change
- pending TOTP setup/QR/confirm
- 2FA login challenge
- disable 2FA with reauth
- account deletion cleanup transaction
- Angular register/login/2FA/profile-security flows
- rate limiting for sensitive auth endpoints

**Gate:**

- auth negative paths pass
- refresh replay rejected
- 2FA cannot be bypassed/replayed
- raw secrets/tokens absent from graph/logs
- browser storage shows no access token persistence
- USER identity/role validates across protected services
- account deletion leaves no orphan user auth/share nodes

**Next:** Batch 3.

---

## Batch 3 — Movie/Genre Catalog, Search, Related Movies, and Admin Vertical Slice

**Status:** [ ]

**Required reading:**

- `01_PRODUCT_SPEC.md` browse/search/admin
- `03_GRAPH_DATABASE_SPEC.md` Movie/Genre/IN_GENRE/search/deletion
- `04_API_SPEC.md` movies/genres
- `05_FRONTEND_SPEC.md` movie/search/admin
- `06_TESTING_SECURITY.md` movie/search/security

**Deliverables:**

- Movie CRUD (ADMIN mutation)
- Genre CRUD with referenced-delete conflict
- year/date integrity
- movie list/detail
- title/genre/year/date/rating filters
- pagination/sort allowlist
- rating aggregate reads
- related-movie content query
- Angular home/browse/search/detail/admin movie+genre screens
- public anonymous browse/detail

**Gate:**

- ADMIN CRUD E2E/API
- USER mutation 403 backend-side
- combined filters against real Neo4j
- Cypher-looking search harmless
- unknown sort rejected
- releaseDate remains nullable/no fake dates
- Movie deletion cleanup tested

**Next:** Batch 4.

---

## Batch 4 — Rating Service CRUD and User Rating-History Facade

**Status:** [ ]

**Required reading:**

- `01_PRODUCT_SPEC.md` rating semantics
- `03_GRAPH_DATABASE_SPEC.md` RATED
- `04_API_SPEC.md` ratings + user facade
- `05_FRONTEND_SPEC.md` rating/profile
- `06_TESTING_SECURITY.md` rating/concurrency

**Deliverables:**

- POST/GET/PUT/DELETE rating
- duplicate POST conflict
- idempotent DELETE
- rating history
- movie aggregate
- User Service `/users/me/ratings` read facade
- dedicated rating page
- movie detail rating controls
- profile rating history
- concurrent create tests

**Gate:**

- exactly one RATED under concurrency
- POST not upsert
- PUT requires existing
- JWT ownership
- aggregates correct
- browser rating CRUD E2E

**Next:** Batch 5.

---

## Batch 5 — Watchlist Vertical Slice

**Status:** [ ]

**Required reading:**

- `01_PRODUCT_SPEC.md` watchlist
- `03_GRAPH_DATABASE_SPEC.md` WATCHLISTED
- `04_API_SPEC.md` watchlist
- `05_FRONTEND_SPEC.md` watchlist/movie cards
- `06_TESTING_SECURITY.md` watchlist/concurrency

**Deliverables:**

- add/list/remove
- idempotent behavior
- Angular watchlist page
- card/detail actions
- isolation/anonymous tests
- concurrency test

**Gate:**

- one WATCHLISTED under concurrency
- user isolation
- complete loading/empty/error UX
- no watchlist signal silently added to recommender

**Next:** Batch 6.

---

## Batch 6 — Recommendation Engine Core

**Status:** [ ]

**Required reading:**

- `01_PRODUCT_SPEC.md` recommendations
- `03_GRAPH_DATABASE_SPEC.md` recommendation reads
- `06_TESTING_SECURITY.md` golden fixture/performance
- `07_RECOMMENDATION_AUDIT_VALIDATION.md`

**Deliverables:**

- custom Cypher repository
- actual GDS similarity
- bounded peer/candidate generation
- content scoring with negative ratings
- popularity/confidence
- hybrid weights/config
- cold start
- already-rated exclusion
- deterministic reasons
- golden-fixture integration tests
- EXPLAIN/PROFILE notes

**Gate:**

- deterministic rankings real Neo4j+GDS
- GDS truly invoked
- negative ratings correct
- cold-start strategies pass
- exclusion pass
- score bounded
- inputs/limits safe

**Next:** Batch 7.

---

## Batch 7 — Recommendation API, Filters, UI, and Movie Facade

**Status:** [ ]

**Required reading:**

- `01_PRODUCT_SPEC.md` recommendation UX
- `04_API_SPEC.md` recommendation/facade
- `05_FRONTEND_SPEC.md` recommendations
- `06_TESTING_SECURITY.md` cross-service/failure
- `07_RECOMMENDATION_AUDIT_VALIDATION.md`

**Deliverables:**

- `/recommendations/me`
- filters/paging/sort
- strategy/signals/reason DTO
- Angular page/cards/filters
- Movie `/movies/recommended` RestClient facade
- bearer/request-ID propagation
- controlled 503
- equivalence tests

**Gate:**

- filters work API/UI
- explanations evidence-based
- peer identity absent
- facade equivalent
- movie browsing survives recommendation-service outage

**Milestone:** Core recommendation experience is demonstrable.

**Next:** Batch 8.

---

## Batch 8 — Recommendation Sharing and Recommendation-Service CRUD Completion

**Status:** [ ]

**Required reading:**

- `01_PRODUCT_SPEC.md` sharing
- `03_GRAPH_DATABASE_SPEC.md` RecommendationShare
- `04_API_SPEC.md` share CRUD
- `05_FRONTEND_SPEC.md` sharing
- `06_TESTING_SECURITY.md` share privacy

**Deliverables:**

- share create/list/read/update/delete
- cryptographic public token + hash-only persistence
- ownership
- expiry/revocation
- public lookup
- share/copy/public Angular page
- optional profile share management

**Gate:**

- Recommendation Service has real CRUD resource
- raw token not stored
- owner isolation
- expired/revoked/random unavailable
- public private-data leakage absent

**Next:** Batch 9.

---

## Batch 9 — Frontend Completion, Accessibility, Responsive, Contract Reconciliation

**Status:** [ ]

**Required reading:**

- `01_PRODUCT_SPEC.md`
- `04_API_SPEC.md`
- `05_FRONTEND_SPEC.md`
- `06_TESTING_SECURITY.md` frontend/accessibility

**Deliverables:**

- close route/page gaps
- consistent loading/empty/error
- responsive navigation/cards/forms/admin
- keyboard/labels/focus/rating accessibility
- refresh/error UX
- query-param filter state
- remove dead/duplicate paths
- DTO/OpenAPI/client reconciliation

**Gate:**

- all pages navigable
- mobile smoke
- critical keyboard flow
- no HttpClient/business-logic sprawl
- frontend matches API

**Next:** Batch 10.

---

## Batch 10 — Cross-Cutting Security Hardening and Observability

**Status:** [ ]

**Required reading:**

- `02_TECHNICAL_ARCHITECTURE.md` security/logging
- `04_API_SPEC.md` cross-cutting
- `06_TESTING_SECURITY.md`
- `08_DEPLOYMENT_OPERATIONS.md` secrets/headers

**Deliverables:**

- centralized Problem Details
- request-ID propagation
- structured logging
- CORS
- Origin/Referer cookie checks
- Nginx headers
- URL/body/query/page bounds
- recommendation limits
- rate limits
- sensitive-log review
- scan scripts

**Gate:**

- JWT/role/ownership matrix
- Cypher/sort/XSS tests
- cookie attrs
- CORS/CSRF checks
- 429
- scans reviewed/no unaddressed actionable release blocker

**Next:** Batch 11.

---

## Batch 11 — Full Browser E2E and Failure-Mode Verification

**Status:** [ ]

**Required reading:**

- `05_FRONTEND_SPEC.md`
- `06_TESTING_SECURITY.md` Playwright/failure
- `07_RECOMMENDATION_AUDIT_VALIDATION.md` runbook

**Deliverables:**

- core user E2E
- 2FA E2E
- recommendation-change E2E
- sharing E2E
- USER admin denial
- ADMIN CRUD
- XSS proof
- recommendation-service-down behavior
- Neo4j failure smoke where feasible

**Gate:**

- critical flows against real Docker services
- backend denial proven
- controlled failure UX

**Next:** Batch 12.

---

## Batch 12 — Audit Dataset, Cypher/GDS Evidence, Usability, Runbook

**Status:** [ ]

**Required reading:**

- `07_RECOMMENDATION_AUDIT_VALIDATION.md`
- `06_TESTING_SECURITY.md` usability/evidence
- `08_DEPLOYMENT_OPERATIONS.md` audit seed

**Deliverables:**

- final deterministic audit seed
- `docs/audit/AUDIT_RUNBOOK.md`
- `GRAPH_DEMO.md`
- `RECOMMENDATION_EXPLANATION.md`
- `SECURITY_CHECKLIST.md`
- `TEST_EVIDENCE.md`
- `USABILITY_TEST.md`
- Cypher docs matching code
- real human usability walkthrough

**Gate:**

- official subject/audit mapped to implementation proof
- graph demo works
- recommendation explainable from real code/query
- usability executed, not placeholder

**Next:** Batch 13.

---

## Batch 13 — Load/Stress and Performance Integrity

**Status:** [ ]

**Required reading:**

- `03_GRAPH_DATABASE_SPEC.md` load seed/invariants
- `06_TESTING_SECURITY.md` load/concurrency
- `07_RECOMMENDATION_AUDIT_VALIDATION.md` performance
- `08_DEPLOYMENT_OPERATIONS.md` seeds

**Deliverables:**

- deterministic load seed
- k6 smoke/audit profiles
- search/recommendation profiling
- post-stress relationship integrity checks
- `docs/audit/STRESS_TEST.md`

**Gate:**

- load completes without crash/corruption
- error rate target met or diagnosed/fixed
- relationship uniqueness intact
- app works afterward
- honest metrics recorded

**Next:** Batch 14.

---

## Batch 14 — Staging/Audit Deployment, HTTPS, Backup and Restore

**Status:** [ ]

**Required reading:**

- `06_TESTING_SECURITY.md` transport
- `08_DEPLOYMENT_OPERATIONS.md`
- `07_RECOMMENDATION_AUDIT_VALIDATION.md` startup

**Deliverables:**

- release images
- deterministic Neo4j+GDS packaging
- single-host Compose
- Nginx HTTPS/Let's Encrypt
- intended ports only
- secret mounting
- clean startup smoke
- Community-compatible offline dump backup
- restore
- tested restore cycle

**Gate:**

- valid HTTPS/redirect
- GDS/migrations/services healthy
- public exposure correct
- smoke pass
- backup and actual restore pass
- headers/cookies verified

**Next:** Batch 15.

---

## Batch 15 — Final Neo4flix Audit and Definition of Done

**Status:** [ ]

**Required reading:**

- all canonical specs for final reconciliation
- `docs/audit/*`

**Final proof:**

- clean isolated branch/worktree
- empty-volume migration/startup
- `make verify`
- `make verify-all`
- four-service Docker
- graph/GDS
- register/login/2FA
- movie/genre CRUD + role denial
- search/filter
- rating CRUD + graph relation
- watchlist
- recommendation/cold start/filter/explanation
- Movie facade
- User rating-history facade
- RecommendationShare CRUD/public share
- malicious/security matrix
- k6
- HTTPS
- backup/restore
- final docs/code reconciliation
- broad final review

**Gate:**

All canonical Definition-of-Done items pass with fresh evidence. No material requirement conflict remains. Repository status is understood and no secrets/generated junk are accidentally tracked.

Then use `superpowers:finishing-a-development-branch`. Do not merge/push main without explicit approval.

# 8. Global Definition of Done

Neo4flix is complete only when all 16 batches are `[x]` and:

- official subject/audit mapped to evidence
- four required services meaningful
- graph visible/explainable
- relationship uniqueness under concurrency
- recommendation engine uses Neo4j/GDS and reacts to ratings
- JWT/2FA/security/HTTPS pass
- usability evidence real
- stress evidence real
- backup/restore proven
- docs match implementation
- final review + fresh verification pass
