# Local development

Run commands from the repository root. This guide covers the Batch 0 bootstrap;
the [canonical planning set](../README.md) remains the implementation authority.

## Required tools

- Git and GNU Make (`make` on PATH).
- Java 21 JDK, with `JAVA_HOME` set to the JDK directory and its `bin` on PATH.
  The committed Maven Wrapper downloads Maven 3.9.11; no global Maven is needed.
- Node.js 24 LTS and npm (the frontend lockfile was generated with npm 11.16.0).
- PowerShell 7 (`pwsh` on PATH), on Windows, Linux, or macOS.
- Docker with Compose v2.17 or newer. Start Docker Desktop or the Docker engine
  before bringing up the stack. Configuration validation alone needs no engine.

Dependency installation and initial image builds need network access. On Windows,
run these commands in PowerShell 7 with GNU Make available as `make`.

## Clean checkout

Create the ignored local environment file using PowerShell:

```powershell
Copy-Item .env.example .env
```

Replace the `change-me` values in `.env` with local, non-production values before
startup. Keep `NEO4J_USERNAME=neo4j`. The JWT key paths and TOTP/demo settings are
future-batch placeholders; Batch 0 does not require generating keys or seed data.
Never commit `.env` or private keys. Changing a password in `.env` does not rotate
credentials in an existing Neo4j data volume.

Run the same acceptance path used by CI:

```powershell
make verify
```

This runs Maven `verify`, then frontend `npm ci`, lint, tests in run-once mode,
and the production build, then validates `infra/compose.yml` with `.env.example`.
It stops on the first failing command. It installs dependencies and writes build
outputs but starts no containers and changes no database data. The example
environment makes verification independent of local credentials.

To preview commands without running them, or run only Java/frontend tests:

```powershell
pwsh -NoProfile -File scripts/verify.ps1 -WhatIf
make test
```

`make test` includes `npm ci` so it also works before the first frontend install.
The PowerShell wrapper can be invoked directly with `-TestOnly` for the same path.
Maintainers can run its behavioral tests with Pester installed:

```powershell
Invoke-Pester scripts/verify.Tests.ps1
```

## Start and check the stack

```powershell
make dev-up
pwsh -NoProfile -File scripts/smoke-compose.ps1
```

`make dev-up` builds and starts the base plus development Compose files and waits
up to 600 seconds for readiness. The smoke check verifies the migrator exited
successfully, all four service health responses report `UP`, and web returns 200.

| Endpoint | Purpose |
| --- | --- |
| <http://localhost:8080/> | Angular app through Nginx |
| <http://localhost:8081/actuator/health> | User Service health |
| <http://localhost:8082/actuator/health> | Movie Service health |
| <http://localhost:8083/actuator/health> | Rating Service health |
| <http://localhost:8084/actuator/health> | Recommendation Service health |
| <http://localhost:7474/> | Neo4j Browser; Bolt is `localhost:7687` |

For an individual health check:

```powershell
Invoke-RestMethod http://localhost:8081/actuator/health
```

The base topology publishes only web. `infra/compose.dev.yml` adds localhost-only
backend and Neo4j ports for these checks. Both local lifecycle commands use:
`docker compose --env-file .env -f infra/compose.yml -f infra/compose.dev.yml`.

The one-shot `database-migrator` first proves `RETURN gds.version();`, then in
`migrate` mode applies the versioned schema migrations and verifies both their
history and the expected Neo4j schema. `verify` and every explicit `seed-*`
mode require that same migrated, valid schema before completing; they do not
apply migrations themselves. Business services start only after the migrator
succeeds. Development currently downloads GDS at Neo4j startup; deterministic
GDS packaging is required for release/audit. See [Neo4j bootstrap details](../infra/neo4j/README.md).

## Explicit seed data

Seed data is separate from schema migrations and is never loaded by application
startup or Compose. First run the migrator in `migrate` mode against the target
test/development graph; seed modes verify that existing migration history and
schema before they write fixture data. Then export its Neo4j connection values
in the shell that invokes one of:

```powershell
make seed-demo
make seed-audit
make seed-load
```

The commands require `NEO4J_URI`, `NEO4J_USERNAME`, and `NEO4J_PASSWORD`; they
do not read `.env`, publish ports, or start containers. `seed-audit` loads the
fixed, idempotent audit fixture (three users and ten ratings). `seed-demo` and
`seed-load` create only deterministic, credential-free scaffolding. To preview
without building or changing graph data, use:

```powershell
pwsh -NoProfile -File scripts/seed.ps1 -WhatIf audit
```

`make reset-db` is intentionally deferred to the deployment batch. No destructive
reset target is available in this batch.

## Stop the stack

```powershell
make dev-down
```

This removes the development containers and network while preserving the named
Neo4j data volume for the next start. The target never requests volume deletion.
