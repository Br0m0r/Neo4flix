# Batch 1 verification — 2026-09-10

Acceptance status: **NOT PASSING — Compose authentication/environment gate blocked.**
Batch 1 remains `[ ]` pending independent Task 6 and whole-branch review. This
report records fresh Task 6 evidence against base
`dd8586a371222e68134555a58de07d828cf5939b` on
`batch-1-graph-schema-migrations`; it does not reuse prior task results as fresh
runtime proof.

## Environment and authorized deviations

Worktree: `C:\Users\User\Desktop\Neo4flix\.worktrees\batch-1-graph-schema-migrations`.
All timestamps below are local ISO 8601 with offset `+03:00` (Europe/Athens);
Neo4j log timestamps are UTC. Docker Desktop server reported `29.6.1`, API `1.55`.

The checkout has no `.env`. It was neither read nor created. The controller
authorized using tracked `.env.example` with the existing Compose files, and
required preserving the existing named volume if its credentials did not work.
No environment values or credentials are reproduced here. No new fixed port
bindings were introduced; the smoke script discovers published HTTP ports from
Compose status.

`make` is unavailable on this host. The exact Makefile recipes were invoked via
PowerShell where possible. `JAVA_HOME` was initially absent; Maven was rerun with
the discovered installed `C:\Program Files\Java\jdk-26.0.1` in the process
environment. This is **JDK 26 host testing, not Java 21 runtime proof**. Maven
reported native-access, deprecated `Unsafe`, and reflective final-field warnings.
The existing Compose Dockerfiles build with pinned Temurin 21 images; successful
image builds do not establish business-service runtime health.

Default sandbox Docker access failed with named-pipe permission denied and an
inaccessible Docker config warning. Scoped elevated Docker executions were
approved and reached the real Docker daemon. These are not WhatIf runs.

## Pre-extension smoke and contract-first checks

At `2026-09-10T00:53:59.6728462+03:00`, before editing the smoke script:

```text
pwsh -File scripts/smoke-compose.ps1
Create .env from .env.example and replace local placeholders first.
PRE_EXTENSION_SMOKE_EXIT=1
end: 2026-09-10T00:54:00.1494554+03:00
```

This failed at the missing-file prerequisite and **did not test live schema**.
Source inspection showed the original script already required migrator exit 0,
but had no migration-completion assertion or named constraint/index queries. Its
GDS assertion expected the obsolete `GDS readiness check succeeded.` marker,
whereas the current Java migrator logs `GDS verification succeeded ...`.

`scripts/test-smoke-compose.ps1` executes the actual smoke script with controlled
Docker/HTTP responses. These are **contract checks, not live acceptance proof**.
An initial fixture scoping error was corrected before the meaningful RED run.
At `2026-09-10T00:57:05.9013134+03:00`:

```text
pwsh -NoProfile -File scripts/test-smoke-compose.ps1
Smoke contract failed: missing migration completion; rejected=False expected=True
SMOKE_CONTRACT_RED_EXIT=1
end: 2026-09-10T00:57:06.5685606+03:00
```

After the minimal smoke extension, the first GREEN run ended at
`2026-09-10T00:58:08.7810791+03:00`, exit 0. The final focused run started at
`2026-09-10T00:59:37.4492152+03:00` and ended at
`2026-09-10T00:59:37.9810803+03:00`, exit 0:

```text
PASS: missing migration completion
PASS: missing GDS readiness
PASS: migrator nonzero exit
PASS: missing named constraint
PASS: missing or offline named index
PASS: failed schema query
PASS: current migrator and complete schema
SMOKE_CONTRACT_GREEN_EXIT=0
```

Failure cases require their expected exception, so an unrelated script error
cannot pass a negative test. The green case uses the current Java migrator log
markers and nonstandard published ports. The smoke now requires all 11 named
constraints and all 3 named search indexes ONLINE, migration completion through
five versions, and a live GDS `2026.07.x` version query. Credentials expand inside
the Neo4j container; the script does not print raw migrator logs or environment
configuration. The schema names are fixed literals, not request data.

## Fresh live integration evidence

`make test-integration` was attempted at
`2026-09-10T00:54:11.0877416+03:00`: command-not-found; no make process or native
exit status existed. The surrounding diagnostic shell returned 0 because its
unset native status was propagated, **not because the test passed**.

The equivalent recipe `pwsh -NoProfile -File scripts/verify.ps1 -Integration`
then exited 1 (`00:54:29.5791358`–`00:54:30.1316536`, `+03:00`) because
`JAVA_HOME` was absent. With the discovered JDK configured, the exact recipe was
rerun from `2026-09-10T00:56:28.9172976+03:00` through
`2026-09-10T00:58:06.6049416+03:00`, exit **0**. It invokes:

```powershell
.\mvnw.cmd -pl backend/platform-common,backend/rating-service,backend/user-service -am '-Dtest=Neo4jSchemaIntegrationTest,*ConcurrencyIT' '-Dsurefire.failIfNoSpecifiedTests=false' test
```

```text
Neo4jSchemaIntegrationTest: Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
WatchlistedRelationshipConcurrencyIT: Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
RatedRelationshipConcurrencyIT: Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
INTEGRATION_EXIT=0
```

These tests started real `neo4j:2026.07.1-community` containers with ephemeral
ports. The empty-database test runs the current migrator, requires positive
migration history, checks named constraints, reruns migration with zero added
history entries and unchanged history count, then runs verification. Migrator
verification checks versions 001–005, all expected constraint/index metadata,
and ONLINE indexes. The GDS test executes `RETURN gds.version()` and requires
`2026.07.x`. **The exact GDS patch string is not printed by this harness**, so
this report does not invent one. The concurrency tests passed their actual
RATED duplicate-constraint handling and concurrent WATCHLISTED MERGE assertions.

Independent seed coverage was freshly run against temporary real Neo4j
containers, not the blocked Compose graph:

```powershell
.\mvnw.cmd -pl database/migrator -am '-Dtest=AuditSeedLoaderIT' '-Dsurefire.failIfNoSpecifiedTests=false' test
```

Start `2026-09-10T00:59:41.1576059+03:00`; end
`2026-09-10T01:00:11.7298150+03:00`; exit **0**.

```text
Applied migration 001 ("core node constraints").
Applied migration 002 ("relationship uniqueness").
Applied migration 003 ("search indexes").
Applied migration 004 ("auth support constraints").
Applied migration 005 ("share constraints").
AuditSeedLoaderIT: Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
AUDIT_SEED_IT_EXIT=0
```

The audit test asserts three users, the fixed Alice/Matrix score of five, and ten
RATED edges after a second load. Its second case verifies UUID IDs in demo/load
scaffolding. This proves loader behavior; **it does not prove `make seed-audit`
success against the retained Compose volume**.

## Compose, smoke, and explicit seed path

The exact requested command was attempted at
`2026-09-10T01:00:17.2707565+03:00` and ended at
`2026-09-10T01:00:17.3735435+03:00`, exit 1:

```powershell
docker compose --env-file .env -f infra/compose.yml -f infra/compose.dev.yml up --build -d --wait --wait-timeout 600
```

Output: `couldn't find env file: ...\.env`. This is an environment failure, not
a migration or service-health result.

The controller-authorized live alternative started at
`2026-09-10T00:54:53.7064002+03:00` and ended at
`2026-09-10T01:03:19.9542758+03:00`, exit **1**:

```powershell
docker compose --env-file .env.example -f infra/compose.yml -f infra/compose.dev.yml up --build -d --wait --wait-timeout 600
```

All six application/migrator/web images built successfully. Neo4j started with
the existing `neo4flix_neo4j-data` named volume. At
`2026-09-10T00:58:51.9941563+03:00`, safe startup diagnostics showed:

```text
neo4j-1 | 2026-09-09 21:57:07.592+0000 INFO Started.
neo4j-1 | 2026-09-09 21:57:10.020+0000 WARN The client is unauthorized due to authentication failure.
neo4j-1 | 2026-09-09 21:58:45.256+0000 WARN The client is unauthorized due to authentication failure.
neo4flix_neo4j-data 2026-09-09T09:09:46Z
```

The volume predates this run and was not empty. The tracked example credentials
did not authenticate to it. No password reset, volume replacement, new bindings,
or user-specific environment access was attempted.

The startup command's terminal result was:

```text
Container neo4flix-neo4j-1 Error dependency neo4j failed to start
dependency failed to start: container neo4flix-neo4j-1 is unhealthy
COMPOSE_UP_EXIT=1
```

The extended smoke was run against that actual stack:

```powershell
pwsh -File scripts/smoke-compose.ps1 -EnvFile .env.example
```

Start `2026-09-10T00:59:54.2395884+03:00`; end
`2026-09-10T00:59:55.2296084+03:00`; exit **1**:

```text
Service                State   Health   ExitCode
database-migrator      created                 0
movie-service          created                 0
neo4j                  running starting        0
rating-service         created                 0
recommendation-service created                 0
user-service           created                 0
web                    created                 0
The database-migrator must have exited successfully.
LIVE_SMOKE_EXIT=1
```

The unrun migrator's status-field zero does not count as successful completion.
No live Compose schema counts, migration-completion logs, GDS query version,
business-service health, or web success were established.

`make seed-audit` at `2026-09-10T01:00:17.3030936+03:00` failed command lookup
(PowerShell exit 1; no native make exit). The exact recipe
`pwsh -NoProfile -File scripts/seed.ps1 audit` ran from
`2026-09-10T01:00:17.3430106+03:00` to
`2026-09-10T01:00:17.8189151+03:00`, exit 1:
`NEO4J_URI must be set; seed commands do not read .env or start containers.`
No Compose audit data was loaded.

The exact requested shutdown with `--env-file .env` ran from
`2026-09-10T01:00:48.6565280+03:00` to
`2026-09-10T01:00:48.7414211+03:00`, exit 1 (missing `.env`).
After the startup command exited, the authorized ordinary shutdown was run:

```powershell
docker compose --env-file .env.example -f infra/compose.yml -f infra/compose.dev.yml down
docker volume inspect neo4flix_neo4j-data --format '{{.Name}} {{.CreatedAt}}'
docker compose --env-file .env.example -f infra/compose.yml -f infra/compose.dev.yml ps --all --format '{{.Service}} {{.State}}'
```

Start `2026-09-10T01:03:33.6876703+03:00`; end
`2026-09-10T01:03:45.5379555+03:00`. All three commands exited **0**:

```text
COMPOSE_DOWN_EXIT=0
neo4flix_neo4j-data 2026-09-09T09:09:46Z
VOLUME_INSPECT_EXIT=0
POST_DOWN_STATUS_EXIT=0
```

Post-down container status output was empty. The seven Compose containers and
their network were removed by ordinary `down`; the same named Neo4j data volume
and creation timestamp remained. Containers can be recreated from Compose. No
`down -v`, data deletion, or reset was performed. This proves volume retention,
not authenticated read-back of graph contents.

## Verification limits and review handoff

No WhatIf result is used as live proof. Seven controlled-boundary smoke cases
and source inspection are explicitly distinct from six passing real Neo4j
integration tests. The fresh Compose run failed its environment/authentication
gate; the full Batch 1 live acceptance path therefore remains incomplete.
The exact GDS patch value and Java 21 service health remain unproven in this
run. Public register/login/movie/rating/recommendation/watchlist flows in the
eventual clean-stack runbook belong to later batches and were not exercised.

Task 6 changes are confined to the smoke script, its contract test, and this
audit. No architecture, public API, migration, seed, or batch status changed.
No push, merge, destructive cleanup, or secret-bearing file was added. Review
must preserve the non-passing acceptance status until the missing live gate is
resolved and independent reviews complete.

## Git hygiene (full requested outputs)

At `2026-09-10T01:02:48.6687096+03:00`, all three commands below exited 0.
The status is the pre-commit snapshot including this audit file; the commit
cannot contain its own hash. The post-commit SHA and clean-status verification
are recorded in the Task 6 handoff report.

```text
> git status --short
 M scripts/smoke-compose.ps1
?? docs/audit/batch-1-verification.md
?? scripts/test-smoke-compose.ps1

> git ls-files .env '*.pem' '*.key' '*token*'

> git log --oneline 9e10b26..HEAD
dd8586a docs: advance active batch context
bd72812 fix: align seed scaffolding with graph ID contract
90e8296 feat: add deterministic graph seed loaders
e5f85c2 docs: advance active batch context
a19aa3f test: prove graph relationship uniqueness
b636bf9 docs: advance active batch context
07b6548 fix: harden Neo4j GDS integration harness
e28c7b7 test: add Neo4j GDS integration harness
e104d66 docs: advance active batch context
d96fae1 fix: complete graph relationship mappings
e778998 feat: add graph persistence mappings
4817697 docs: advance active batch context
4ca6fe4 docs: add active batch context
ec68e1f fix: harden database migration verification
a9c2e36 feat: add Neo4j migration baseline
fca6db7 docs: add batch 1 implementation plan
63a7103 docs: add batch 1 graph schema design
```

`git diff --check` at the same timestamp exited 0. Git emitted its local
LF-to-CRLF conversion warning for the modified PowerShell file, not a whitespace
error. The blank `git ls-files` output means no tracked file matched the exact
requested globs; it is not a comprehensive secret scanner.

Final focused verification ran from `2026-09-10T01:03:57.6317038+03:00` to
`2026-09-10T01:03:58.2073742+03:00`: `git diff --check` exit 0, all seven
`pwsh -NoProfile -File scripts/test-smoke-compose.ps1` cases exit 0, and
`git diff --exit-code -- 00_MASTER_EXECUTION_PLAN.md` exit 0. The batch-status
source was not modified.
