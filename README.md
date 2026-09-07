# Neo4flix — Canonical Planning Set

This directory is the **single entrypoint** for humans and agentic coding workers implementing the 01-edu **Neo4flix** project.

The external assignment and audit remain non-negotiable requirements. This canonical set resolves their ambiguities into one implementable architecture while keeping the required technologies and behaviors intact.

## Start Here

1. Read this `README.md`.
2. Read `00_MASTER_EXECUTION_PLAN.md`.
3. Identify the first incomplete batch.
4. Read **only** that batch's listed canonical specifications.
5. Use `superpowers:writing-plans` to create the batch implementation plan under `docs/superpowers/plans/`.
6. Ensure work is isolated with `superpowers:using-git-worktrees` before executing the plan.
7. Prefer `superpowers:subagent-driven-development`; use `superpowers:executing-plans` when SDD/subagents are unavailable.
8. Use TDD, task review, fresh verification, and the batch evidence report.
9. Stop at the batch checkpoint for human review.

Do **not** begin implementation by feeding every specification to every worker. The controller owns cross-document context and should give each implementation task the exact requirement/interface context it needs.

## External Source of Truth

Official 01-edu subject:

- <https://github.com/01-edu/public/tree/master/subjects/java/projects/neo4flix>

Official audit:

- <https://github.com/01-edu/public/tree/master/subjects/java/projects/neo4flix/audit>

If the external subject/audit changes after this planning set was generated, do **not** silently implement the changed assignment. First compare the new requirement against the canonical set and explicitly reconcile it.

## Canonical Files

```text
README.md
00_MASTER_EXECUTION_PLAN.md
01_PRODUCT_SPEC.md
02_TECHNICAL_ARCHITECTURE.md
03_GRAPH_DATABASE_SPEC.md
04_API_SPEC.md
05_FRONTEND_SPEC.md
06_TESTING_SECURITY.md
07_RECOMMENDATION_AUDIT_VALIDATION.md
08_DEPLOYMENT_OPERATIONS.md

CODEX_BOOTSTRAP_PROMPT.md          # helper, not a specification authority
MANIFEST.json

docs/
├── superpowers/
│   └── plans/
│       └── YYYY-MM-DD-batch-N-*.md
└── audit/                         # generated during implementation
```

## Document Authority

| Need | Read |
|---|---|
| What is/isn't Neo4flix MVP? | `01_PRODUCT_SPEC.md` |
| What technologies/repository/runtime shape are required? | `02_TECHNICAL_ARCHITECTURE.md` |
| What graph data exists and how is it constrained/migrated? | `03_GRAPH_DATABASE_SPEC.md` |
| What HTTP contract must be implemented? | `04_API_SPEC.md` |
| What routes/pages/components/UX must exist? | `05_FRONTEND_SPEC.md` |
| What test and security proof is mandatory? | `06_TESTING_SECURITY.md` |
| How must the recommendation engine and 01-edu audit be demonstrated? | `07_RECOMMENDATION_AUDIT_VALIDATION.md` |
| How is the stack run, deployed, backed up, restored, and smoke-tested? | `08_DEPLOYMENT_OPERATIONS.md` |
| What do we implement next? | `00_MASTER_EXECUTION_PLAN.md` |

## Pinned MVP Choices

The assignment intentionally leaves many implementation details open. To prevent independent coding agents from making incompatible choices, this set pins:

- Java 21 LTS
- Spring Boot 4.1.1
- Spring MVC (imperative), not WebFlux
- Spring Security + OAuth2 Resource Server support for JWT validation
- Spring Data Neo4j 8.1.x / version managed compatibly by Spring Boot
- Neo4j Community 2026.07.x, deployment baseline `2026.07.1`
- Neo4j Graph Data Science 2026.07
- Maven + Maven Wrapper
- Angular 22.1.5 + Angular Material 22.1.5 + SCSS
- Node.js 24 LTS + TypeScript 6.0.x
- Angular standalone components + Signals/services; no NgRx
- JUnit 5 + Mockito + AssertJ
- Testcontainers Neo4j for real graph integration tests
- Vitest for Angular unit/component tests
- Playwright for browser E2E
- k6 for load/stress tests
- springdoc-openapi 3.1.x
- Neo4j-Migrations 4.1.x as a **one-shot migrator**, not service-owned startup migration
- Bucket4j 8.19.x for in-memory MVP rate limiting
- RFC 6238 TOTP with `java-otp` + ZXing QR generation
- RS256 short-lived access JWT + rotating opaque refresh token
- access token in Angular memory; refresh token in Secure/HttpOnly/SameSite cookie
- Nginx for Angular static hosting, TLS termination, and `/api/v1` reverse proxy
- Docker Compose; no Kubernetes
- four required business microservices only: User, Movie, Rating, Recommendation
- one shared Neo4j graph with strict service mutation ownership
- synchronous REST between Movie Service and Recommendation Service; no broker

Dependency lockfiles and Docker image tags must pin exact patch releases in the repository. Do not use floating `latest` in release paths.

## Core Reconciliation Decisions

The source assignment has overlapping responsibilities. The canonical interpretation is:

1. **Recommendation ownership:** Recommendation Service owns the personalized recommendation algorithm. Movie Service exposes a required recommendation facade (`/movies/recommended`) and related-movie queries, but delegates personalized ranking instead of implementing a second algorithm.
2. **Rating ownership:** Rating Service is the only writer of `RATED`. User Service may expose the user's rating history as a read facade to satisfy its user-centric responsibility, but does not independently mutate ratings.
3. **Recommendation CRUD wording:** Generated recommendations are computed results, not fake stored CRUD entities. Recommendation Service owns real CRUD for `RecommendationShare`, which also implements “share recommendations with friends.”
4. **Graph database:** all four services share one Neo4j graph to preserve traversability; this is an educational project-specific choice, not a claim that database-per-service is generally wrong.
5. **Movie dates:** `releaseYear` is required; `releaseDate` is optional. Never fabricate exact dates for imported datasets.
6. **Rating semantics:** one integer 1–5 rating per user/movie; `POST` creates and conflicts if one exists, `PUT` updates, `DELETE` removes. Do not silently turn POST into upsert.
7. **Concurrency:** `RATED` and `WATCHLISTED` carry deterministic relationship keys and use relationship property uniqueness constraints so concurrent requests cannot create duplicates. Application behavior is also tested under concurrency.
8. **2FA enrollment:** pending TOTP enrollment state is distinct from active TOTP state; active login 2FA cannot be enabled until confirmation succeeds.
9. **Deletion cleanup:** deleting a User or Movie must explicitly remove owned/session/share nodes that would otherwise be orphaned; `DETACH DELETE` alone is not sufficient for all graph-owned nodes.
10. **Schema ownership:** no business service independently applies graph migrations; the one-shot migrator owns schema evolution.

## Product Invariants

- Neo4flix is a movie discovery/recommendation app, not a streaming platform.
- Roles are `USER` and `ADMIN`.
- No formal friend/follower network in MVP; sharing is link-based.
- Explicit ratings are the primary preference signal; watchlisting is not treated as equivalent positive feedback.
- Personalized recommendations use graph behavior, not a hardcoded genre list.
- Already-rated movies are excluded from personalized recommendation results.
- Recommendations provide a human-readable reason.
- Admin owns catalog mutation; users own their profile, ratings, watchlist, and shares.
- Backend authorization is authoritative; Angular guards are UX only.
- Raw passwords, refresh tokens, TOTP secrets, JWT private keys, and security codes must never leak through APIs/logs.

## Superpowers Execution Policy

```text
Canonical specs
      ↓
00_MASTER_EXECUTION_PLAN batch
      ↓
superpowers:writing-plans
      ↓
docs/superpowers/plans/<batch-plan>.md
      ↓
superpowers:using-git-worktrees
      ↓
superpowers:subagent-driven-development
   or superpowers:executing-plans
      ↓
TDD → task review → fix/re-review
      ↓
verification-before-completion
      ↓
Batch evidence report
      ↓
HUMAN CHECKPOINT
      ↓
Next batch
```

Current Superpowers SDD also maintains plan-scoped progress/workspace artifacts under its `.superpowers/sdd/...` workspace. Use that ledger when the installed skill provides it; do not rely on chat memory alone for task completion state.

If implementation exposes a genuinely new product/design decision, use `superpowers:brainstorming`, update the owning canonical spec after approval, and then revise downstream plans. Do not use brainstorming to reopen already-approved choices merely because an agent prefers another stack.
