# Batch 0 verification evidence

Status: **BLOCKED — build and review evidence recorded; live runtime acceptance unavailable.** Batch 0 remains `[ ]` in `00_MASTER_EXECUTION_PLAN.md`. No live Docker, Neo4j/GDS, migrator, container-health, or shutdown-success claim is made.

## Run context

- Fresh checks ran on 2026-09-08 from 15:39 to 15:42 Europe/Athens (UTC+03:00), in `.worktrees/batch-0-repository-bootstrap`.
- Initial acceptance source revision: `20ba777230c99783d1367cb87604b1884b4d1948`. Final implementation revision after the review fix: `0da53ace63f1b093f95bc33233e4de2d7767daa5`; affected checks and review results are recorded below.
- Host tools: Windows PowerShell launcher, portable PowerShell 7.5.4, Temurin Java 21.0.11, Node 24.18.0, npm 11.16.0, Docker CLI 29.6.1, Docker Compose 5.3.0.
- Java and PowerShell 7 were already available in ignored task artifacts. Maven used a process-local `JAVA_HOME` pointing at `.superpowers/sdd/2026-09-07-batch-0-repository-bootstrap/jdk21/jdk-21.0.11+10`; its `bin` was prepended to process-local `PATH`. The smoke invocation similarly prepended the existing portable `pwsh` directory. No global environment was changed.
- `npm.cmd` selected the installed Windows npm launcher because the default PowerShell `npm.ps1` launcher is blocked by host execution policy.
- Local `.env` exists and `git check-ignore .env` returned `.env` with exit 0. No environment-file contents or credentials are included here. Resolved Compose configuration was captured in memory and omitted from output to avoid exposing environment values.

## Fresh command results

Times below are within the run window above unless a precise completion time was emitted by the command.

| Command | Exit | Observation |
| --- | --- | --- |
| Prohibited-scope `rg` command shown below | 1 | No output: no prohibited-scope matches. Repeated at 15:42 with the same result. |
| `rg -n "latest" infra frontend backend pom.xml` | 1 | No output: no floating `latest` tag matches. Repeated at 15:42 with the same result. |
| `.\mvnw.cmd verify` with the process-local Java setup above | 0 | Approved rerun completed at 15:40:34+03:00: reactor `BUILD SUCCESS`, all seven modules successful, 10 Java tests, zero failures/errors/skips. |
| `npm.cmd ci` in `frontend` | 0 | 494 packages installed in 32 seconds. |
| `npm.cmd run lint` in `frontend` | 0 | ESLint completed with `--max-warnings=0`. |
| `npm.cmd test -- --run` in `frontend` | 0 | Approved rerun: Vitest 4.1.11, one test file and one test passed; test run started at 15:41:26 and took 6.68 seconds. |
| `npm.cmd run build` in `frontend` | 0 | Angular production build completed at 12:41:46.228Z / 15:41:46+03:00. Initial bundle 223.00 kB, estimated transfer 61.45 kB; output `frontend/dist/frontend`. |
| `docker compose --env-file .env.example -f infra/compose.yml config` | 0 | Base configuration resolved successfully. Sandbox Docker-config access warnings were nonfatal. |
| `docker compose --env-file .env -f infra/compose.yml up --build -d` | 1 | Failed before startup because the Docker engine pipe was absent. |
| `pwsh -File scripts/smoke-compose.ps1` | 1 | Docker status lookup failed; script stopped at line 9 with `Could not read Compose service status.` |
| `docker compose --env-file .env -f infra/compose.yml down` | 1 | Engine pipe absent; shutdown could not execute. No volume-removal flag was used. |
| `docker version` outside the sandbox | 1 | Client available, context `desktop-linux`; Linux engine pipe absent (exact output below). |

Exact prohibited-scope command:

```powershell
rg -n "spring-boot-starter-webflux|kafka|rabbitmq|redis|graphql|kubernetes|spring-cloud|spring-data-jpa|ngrx" pom.xml backend frontend infra
```

Ripgrep exit 1 is the expected no-match result, not a failed scope gate. Java test counts were also read from the freshly generated Surefire reports: platform-common 6, user-service 1, movie-service 1, rating-service 1, recommendation-service 1. These tests exercise the application health endpoints in test processes; they do not establish Compose runtime or database readiness.

Initial unsuccessful host/sandbox attempts are retained as limitations rather than hidden: Maven first exited 1 because `JAVA_HOME` was unset, then exited 1 with `java.net.SocketException: Permission denied: connect` inside the network sandbox after selecting Java. Its approved rerun exited 0. The default `npm ci` launcher failed under the host execution policy before npm started; `npm.cmd ci` passed. The first frontend test run exited 1 because Angular/esbuild could not traverse an ancestor directory (`Cannot read directory "../../../../..": Access is denied.`); the approved rerun passed. Production build used the same approved filesystem access. All requested escalations were approved; no automatic-approval rejection occurred.

Nonfatal build output included existing Java dynamic-agent/class-sharing warnings, npm deprecation notices for Angular animations and ESLint, and pending install-script notices for four npm packages. No dependency pins or script permissions were changed. This fresh npm install did not print an audit result, so no fresh vulnerability-audit claim is made.

## Runtime blocker and missing evidence

The restricted Docker invocation could not read the user's Docker configuration and selected the `default` context. Startup, smoke, and shutdown reported:

```text
failed to connect to the docker API at npipe:////./pipe/docker_engine; check if the path is correct and if the daemon is running: open //./pipe/docker_engine: The system cannot find the file specified.
```

A separately approved, read-only check outside the sandbox removed the Docker-configuration access warning and confirmed that the configured Desktop Linux engine is also unavailable:

```text
Client:
 Version:           29.6.1
 API version:       1.55
 Go version:        go1.26.4
 Git commit:        8900f1d
 Built:             Fri Jun 26 11:43:32 2026
 OS/Arch:           windows/amd64
 Context:           desktop-linux
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine; check if the path is correct and if the daemon is running: open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

Consequently there is no service-health table, successful migrator exit/log, observed GDS version, successful web response, or successful shutdown result. Named-volume preservation is configured by omitting volume deletion from shutdown, but could not be demonstrated against a running stack. No containers or volumes were deleted by this verification.

The literal base-only runtime commands from Task 7 were attempted above. The controller's prior Task 5 ruling and the canonical development workflow require the development override for the smoke script's host ports. Once Docker Desktop's Linux engine is available, the remaining runtime rerun must use:

```powershell
docker compose --env-file .env -f infra/compose.yml -f infra/compose.dev.yml up --build -d --wait
pwsh -File scripts/smoke-compose.ps1
docker compose --env-file .env -f infra/compose.yml -f infra/compose.dev.yml down
```

That rerun must capture actual service health, migrator exit/log output, GDS version, web reachability, and successful shutdown without deleting the named Neo4j volume. GNU Make and remote GitHub Actions execution were not performed in this Task 7 run; the Task 6 report documents the existing host Make limitation. Direct commands above provide the fresh local build evidence.

## Repository hygiene

All three required Git commands were rerun at approximately 15:42+03:00, before this evidence draft was created, and exited 0.

`git status --short` output:

```text
(empty)
```

`git ls-files .env '*.pem' '*.key' '*token*'` output:

```text
(empty)
```

`git log --oneline 72d285c..HEAD` output:

```text
20ba777 build: add baseline verification workflow
630047d infra: preserve LF for shell entrypoints
88f8d1e infra: add baseline Compose topology
8557727 fix: add signal-backed application state service
3fbc5bd feat: add Angular application baseline
4c34346 fix: package services as executable jars
3348b0a feat: add four service health baselines
2dd35ba test: make wrapper mirror proof JDK discovery portable
bb8b054 build: use standard Maven wrapper
cfd85a2 build: correct wrapper mirror paths
ca5d554 build: regenerate reliable Maven wrapper
df94d6d feat: add HTTP request and error baseline
774c2a8 build: bootstrap Maven reactor
cf8298d chore: ignore local worktrees
6387883 docs: add batch 0 implementation plan
c4cbdd3 docs: add batch 0 bootstrap design
```

## Final review, correction, and affected verification

The controller completed the final whole-branch spec-compliance/code-quality review and the subsequent fix/re-review loop on 2026-09-08. The final review identified a P1 incompatibility: the Docker build used Node 24.12.0, below the locked Angular 22.1.5 toolchain's supported Node 24 minimum. Commit `0da53ace63f1b093f95bc33233e4de2d7767daa5` (`fix: align Docker Node pin with Angular requirements`) changes the Dockerfile and implementation plan to `node:24.15.0-alpine3.22` and adds a regression test to the normal frontend test command. Angular dependency pins and the lockfile are unchanged.

The regression checks the exact Docker Node 24/Alpine pin against the locked Node engine requirements of Angular CLI, build, compiler-cli, and core. The fix worker's report records a failing test against 24.12.0 and a passing test after the correction. It also records fresh lint, the full npm test command (one Docker compatibility test plus one Angular/Vitest test), production build, base Compose configuration, and base-plus-development Compose configuration all exiting 0 at approximately 15:50-15:51+03:00. Frontend test/build passed through approved reruns after the known sandbox traversal restriction. Those affected-check results are attributed to the fix worker's report; the initial full acceptance run above remains tied to its original revision.

The controller reported that the scoped re-review of `20ba777..0da53ac` was approved and that the final review/fix loop was complete. This approval establishes the reviewed source correction; it does not waive the outstanding Docker runtime gate. Prior per-task reviews remain provenance rather than substitutes for this final review.

At 15:54+03:00, the evidence worker independently reran `node --test scripts/docker-node.test.mjs` from `frontend`: exit 0, one test passed, no failures/skips. It also reran `docker compose --env-file .env.example -f infra/compose.yml config --quiet`: exit 0, with the same nonfatal sandbox Docker-config warnings. The final Git log rerun contains the original log above with this additional first entry:

```text
0da53ac fix: align Docker Node pin with Angular requirements
```

The repeated tracked-sensitive-filename scan produced no output, and `git diff --exit-code -- 00_MASTER_EXECUTION_PLAN.md` exited 0. Before staging the evidence, `git status --short` contained only `?? docs/audit/`.

## Completion gate

The controller explicitly authorized committing this evidence document after the review/fix loop, superseding the earlier instruction to leave it uncommitted. That authorization does not include changing the master-plan status. Runtime acceptance remains blocked by the missing Docker Desktop Linux engine described above, and Batch 0 remains `[ ]`. The next completion step is the documented live stack rerun with real GDS, health, web, and shutdown observations.
