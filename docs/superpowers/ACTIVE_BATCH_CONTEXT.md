# Active Batch Context — Batch 1

## Use of this file

This is the compact handoff for the active Batch 1 execution. A dispatched implementer or reviewer must read this file first, then read only its task brief, task report, and the smallest listed canonical references needed for that task. Do not restart Batch 1, recreate the worktree, re-read the entire plan by default, or redispatch a workstream already completed or currently in review.

The durable detailed plan remains `docs/superpowers/plans/2026-09-09-batch-1-graph-schema-migrations.md`; the design remains `docs/superpowers/specs/2026-09-09-batch-1-graph-schema-design.md`; transient task records are under `.superpowers/sdd/2026-09-09-batch-1-graph-schema-migrations/`.

## Repository state

- Worktree: `C:\Users\User\Desktop\Neo4flix\.worktrees\batch-1-graph-schema-migrations`
- Branch: `batch-1-graph-schema-migrations`
- Batch 0 base: `9e10b26`
- Batch 1 design commit: `63a7103`
- Batch 1 plan commit: `fca6db7`
- Task 1 initial implementation: `a9c2e36 feat: add Neo4j migration baseline`
- Task 1 fix round 1 implementation: `ec68e1f fix: harden database migration verification`
- Working tree when this context was written: clean.
- The main checkout remains untouched and behind this Batch 1 branch. Do not work in `main`.

## Batch goal and non-goals

Batch 1 delivers versioned Neo4j schema migrations, deterministic seed entry points, service-owned persistence mappings, a real Neo4j/GDS Testcontainers harness, concurrency proof for relationship-key uniqueness, and fresh acceptance evidence.

Do not add public API behavior, authentication flows, recommendation scoring, automatic seed loading, a new business service, WebFlux, JPA/SQL, APOC, Kafka, RabbitMQ, Redis, GraphQL, Spring Cloud, or committed secrets.

## Binding contracts

- Exactly four business services remain: user, movie, rating, recommendation. `database-migrator` is one-shot infrastructure.
- Java 21, Spring Boot 4.1.1, Spring MVC, Spring Data Neo4j, Neo4j Community `2026.07.1`, GDS `2026.07`, and Neo4j-Migrations `4.1.2` are pinned requirements.
- `database/migrations/` is the sole schema source. Business services never apply migrations. Migration names are `V001__core_node_constraints.cypher` through `V005__share_constraints.cypher`.
- Migration execution must first prove `RETURN gds.version()` and must block business service startup on a non-zero exit.
- Migrations are append-only; seeds are explicit `seed-demo`, `seed-audit`, and `seed-load` commands and never ordinary startup behavior.
- Application identifiers are UUID strings. Never expose Neo4j internal IDs or persistence entities from controllers.
- Owner mapping: User/AuthSession/AuthChallenge/WATCHLISTED → User Service; Movie/Genre/IN_GENRE → Movie Service; RATED → Rating Service; RecommendationShare relations → Recommendation Service.
- `RATED.key` and `WATCHLISTED.key` are exactly `<userId>:<movieId>`. Prove duplicate prevention against a real Neo4j instance with concurrent writes.
- Custom Cypher must use parameters; never interpolate request data into Cypher. Never log Neo4j credentials.

## Canonical references by active workstream

| Workstream | Read only these additional sections |
| --- | --- |
| Task 1 migration gate | `02_TECHNICAL_ARCHITECTURE.md` §§21–24, `03_GRAPH_DATABASE_SPEC.md` §§24–25, `08_DEPLOYMENT_OPERATIONS.md` §§4, 8–9, 18 |
| Task 2 mappings | `02_TECHNICAL_ARCHITECTURE.md` §§10–13, `03_GRAPH_DATABASE_SPEC.md` §§3–18 |
| Tasks 3–4 integration/concurrency | `03_GRAPH_DATABASE_SPEC.md` §§6–7, 24–25; `06_TESTING_SECURITY.md` §§4–5 |
| Task 5 seeds | `02_TECHNICAL_ARCHITECTURE.md` §22, `03_GRAPH_DATABASE_SPEC.md` §26, `08_DEPLOYMENT_OPERATIONS.md` §19 |
| Task 6 acceptance | `00_MASTER_EXECUTION_PLAN.md` Batch 1 gate, `08_DEPLOYMENT_OPERATIONS.md` §§4, 6, 18–19, 25 |

## Completed, active, and queued work

| State | Workstream | Durable evidence |
| --- | --- | --- |
| Complete — review approved | Task 1 migration baseline | Brief: `task-1-brief.md`; report: `task-1-report.md`; initial implementation `a9c2e36`, fix `ec68e1f`, scoped re-review approved. Strict schema metadata/ONLINE validation, Java driver `6.2.0`, and final-image wrapper are complete. Live empty-db/GDS/rerun proof remains explicitly owned by Task 3. |
| Complete — review approved | Task 2 service-owned persistence mappings | Initial implementation `e778998`, relationship-mapping fix `d96fae1`, and scoped re-review approved. It may now be consumed by concurrency tests. |
| Complete — review approved | Task 3 Neo4j/GDS Testcontainers harness | Initial implementation `e28c7b7`, hardening fix `07b6548`, and scoped re-review approved. It provides the live empty-db, GDS, current-migrator, and no-new-history rerun proof. |
| Complete — review approved | Task 4 concurrent RATED/WATCHLISTED proof | Implementation `a19aa3f` and independent review approved. It proves one RATED edge from concurrent CREATE/constraint handling and one WATCHLISTED edge from two concurrent MERGEs. |
| Complete — review approved | Task 5 deterministic seed loaders | Initial implementation `90e8296`, UUID/documentation fix `bd72812`, and scoped re-review approved. It provides only explicit, deterministic, non-destructive seed modes. |
| Complete — acceptance passed and Task 6 reviewed | Task 6 live acceptance/evidence/status | Clean-rerun evidence commit `fe6b74f` supersedes the historical blocked attempt in `9de357f`. Clean Compose, migration/rerun, GDS, default smoke, and explicit audit-seed acceptance have passed and been Task-6-reviewed. Final review addressed the runtime-driver and Genre/IN_GENRE blockers; one non-load-bearing audit-provenance wording issue is parked. Batch 1 is now `[x]` in `00_MASTER_EXECUTION_PLAN.md`. |

Tasks 1 and 2 are complete and must not be redispatched. Do not repeat the Task 1 initial implementation (`a9c2e36`) or the Task 2 initial mapping pass (`e778998`); their approved fix commits are `ec68e1f` and `d96fae1`.

## Current Task 1 review disposition

The initial review reported:

1. Schema verification accepted object names without validating label/type/property and could accept indexes before they were online.
2. Live empty-database, migration-discovery, GDS, and rerun proof was absent.
3. Neo4j-Migrations 4.1.2 ran with the BOM-selected Neo4j Java Driver 6.1.0.
4. The legacy wrapper was not present in the final migration image.

Controller ruling: item 2 is explicitly owned by Task 3's Testcontainers harness; do not duplicate that harness in Task 1. Its cost is that a live migrator defect may first be discovered in Task 3. Fix round 1 addressed items 1, 3, and 4, and scoped re-review approved `a9c2e36..ec68e1f`. Task 1 is complete; Task 3 is the next dispatch.

## Dispatch and review policy

1. Dispatch only the first genuinely unfinished workstream shown above. Every task receives a fresh implementer; no implementer dispatches subagents or reviewers.
2. Prompts name this context file, one task brief, one report path, the precise base/head range, and only the canonical-reference row needed by that task. Do not paste the full plan or prior task history.
3. Production changes follow TDD: report the focused RED command/output, minimal GREEN command/output, then the relevant suite. Configuration-only work still needs a concrete static or runtime contract check.
4. An implementer commits its task and writes the full report before review. The controller creates or preserves a task-local review record and dispatches one independent reviewer.
5. A failing review resumes the same implementer for rounds 1–3. Each round has one scoped re-review over only the fix range. At rounds 4–5 use a fresh, stronger implementer. Record every ruling/fix/completion in the existing SDD ledger.
6. Reviewers report separate spec-compliance and task-quality verdicts, cite file/line evidence for every blocking finding, and do not request a full-plan reread when this context and the task brief cover the work.
7. Never push, merge, delete worktrees, or change Batch 1 status without the corresponding explicit user authority and completed acceptance/review gates.

## Environment notes

- The host may present JDK 26. The project compiles with release 21 and container build/runtime images are Temurin 21.0.11. Record JDK 26 warnings without treating them as Java 21 proof.
- WSL Bash cannot start (`Bash/Service/CreateInstance/E_ACCESSDENIED`) and Git Bash cannot create SDD scratch directories under the managed filesystem. The existing `.superpowers/sdd/...` workspace is the authoritative artifact location and is ignored.
- Docker host access can require approved escalation. Compose config warnings about inaccessible user Docker configuration are nonfatal only when the command exits 0. Never claim live runtime proof from a static config result.
- Task 6's clean rerun in `docs/audit/batch-1-verification.md` passed live integration, clean Compose startup, migration/rerun, GDS `2026.07.0`, default smoke, and repeated explicit audit seeding; ordinary shutdown retained the new seeded named volume. This acceptance evidence has been Task-6-reviewed, final whole-branch review passed after the driver/Genre fix wave, and Batch 1 status is `[x]`. The earlier authentication failure remains historical evidence only.
