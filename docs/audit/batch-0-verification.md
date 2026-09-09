# Batch 0 verification evidence

Status: **PASS — all Batch 0 acceptance gates completed.** Batch 0 is eligible for the human checkpoint after the separately committed master-plan status update.

## Run context

- Fresh runtime acceptance completed on 2026-09-09 (Europe/Athens) from the isolated `batch-0-repository-bootstrap` worktree.
- Docker Server: 29.6.1.
- The canonical `scripts/verify.ps1` verification passed against the current source with Temurin Java 21.0.11. It completed Maven verification, `npm ci`, lint, tests, production build, and Compose configuration validation.
- Environment values are intentionally omitted. The ignored local `.env` was used only as an input to Compose; no credentials, tokens, or passwords are recorded here.

## Scope and source acceptance

| Check | Result |
| --- | --- |
| Prohibited-scope scan for WebFlux, Kafka, RabbitMQ, Redis, GraphQL, Kubernetes, Spring Cloud, JPA, and NgRx | Pass — no matches |
| Floating-tag scan (`latest`) in `infra`, `frontend`, `backend`, and `pom.xml` | Pass — no matches |
| `scripts/verify.ps1` using Java 21.0.11 | Pass — Maven verification, npm install/lint/test/build, and Compose config all completed successfully |
| Final whole-branch review and scoped re-review after the Docker Node pin correction | Approved |

The Docker frontend build pin is `node:24.15.0-alpine3.22`, matching the locked Angular 22.1.5 toolchain's supported Node 24 range.

## Live Compose and GDS acceptance

The development override is required for host-port smoke checks. The live stack was started with:

```powershell
docker compose --env-file .env -f infra/compose.yml -f infra/compose.dev.yml up -d --wait --wait-timeout 600
```

Exit status: 0. Neo4j, `user-service`, `movie-service`, `rating-service`, `recommendation-service`, and `web` were healthy. The one-shot `database-migrator` completed successfully.

`scripts/smoke-compose.ps1` exited 0 and confirmed all of the following:

- `database-migrator` exit code 0;
- ports 8081, 8082, 8083, and 8084 were `UP`;
- migrator output included `GDS readiness check succeeded.`;
- the web endpoint was reachable.

An explicit read-only query also succeeded:

```cypher
RETURN gds.version()
```

It returned `2026.07.0`.

The stack was stopped with:

```powershell
docker compose --env-file .env -f infra/compose.yml -f infra/compose.dev.yml down
```

Exit status: 0. The shutdown command did not use a volume-removal flag, and the named `neo4flix_neo4j-data` volume remained present.

## Repository hygiene

- No tracked `.env`, PEM, key, or token-named files were found by the Task 7 hygiene scan.
- No secrets were added to this evidence.
- Runtime acceptance was performed after the previously recorded source review and Node-image compatibility correction; this document supersedes the earlier blocked runtime record.

## Completion gate

All source, runtime, GDS, smoke, shutdown, hygiene, and review gates have passed. Batch 0 may now be marked complete, with no later batch status changed.
