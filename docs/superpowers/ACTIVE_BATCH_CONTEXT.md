# Active Batch Context — Batch 3 Catalog

> **Status:** IN PROGRESS — code verification pass; live Compose acceptance pending `.env`
>
> **Purpose:** Compact handoff for Batch 2 execution. This cache does not override canonical specifications, the approved plan, or the SDD ledger.

## Repository state

- Worktree: `C:\Users\User\Desktop\Neo4flix`
- Branch: `main` (direct-main execution; do not create new worktrees)
- Batch 1 merged base: `b93ec22` (`merge: batch 1 graph schema and migrations`)
- Current Batch 2 head: `6d53d32` (`fix: wire compose authentication configuration`)
- Plan: `docs/superpowers/plans/2026-09-13-batch-2-authentication.md`
- SDD workspace/ledger: `.superpowers/sdd/2026-09-13-batch-2-authentication/`
- Existing historical Batch 2 worktree is preserved for audit context; all new work lands directly on `main`.

## Batch goal

Deliver User Service registration/login, BCrypt password policy, RS256 JWT issuance and cross-service validation, rotating opaque refresh sessions, logout/revocation, auth/me, profile GET/PATCH, password change, pending/active TOTP 2FA, one-time login challenges, rate limiting, deletion cleanup, and the Angular auth/profile/security flows.

## Binding contracts

- User Service alone signs JWTs and mutates credentials, sessions, challenges, TOTP, and profile/account state.
- JWTs are short-lived RS256 with `sub`, `roles`, issuer, audience, `iat`, `exp`, and JTI; protected services validate issuer/audience/signature.
- Passwords use BCrypt; refresh/challenge values are random and persist only as hashes; active TOTP is AES-256-GCM encrypted outside Neo4j.
- Pending TOTP is separate and expiring; password-only login never authenticates an active-2FA user.
- Refresh rotates atomically and rejects replay; logout revokes the current session and clears the cookie.
- Access JWT and enrollment material remain memory-only in Angular; refresh cookie is Secure/HttpOnly/SameSite with origin checks.
- Identity comes from JWT subject; profile/account mutations cannot accept arbitrary user IDs; deletion removes shares, sessions, and challenges before the user.

## Required canonical reading by workstream

| Workstream | Read only these sections in addition to the plan |
| --- | --- |
| Security foundation | `02_TECHNICAL_ARCHITECTURE.md` §§8–12; `04_API_SPEC.md` §§3–6, 39–45; `06_TESTING_SECURITY.md` §§16, 28–32 |
| Auth/profile backend | `01_PRODUCT_SPEC.md` §§5–7, 21, 24; `03_GRAPH_DATABASE_SPEC.md` §§3, 9–11, 19, 23; `04_API_SPEC.md` §§8–18; `06_TESTING_SECURITY.md` §§13–20 |
| Angular auth/profile | `05_FRONTEND_SPEC.md` §§4–10, 22–23, 28–32; `06_TESTING_SECURITY.md` §§29, 35–36 |
| Acceptance | `00_MASTER_EXECUTION_PLAN.md` Batch 2 gate; `06_TESTING_SECURITY.md` §§13–20, 28–32, 35–36; `08_DEPLOYMENT_OPERATIONS.md` §§4, 6, 18–19, 25 |

## Workstream dispatch

| State | Workstream | Required handoff |
| --- | --- | --- |
| Complete | Task 1 security dependencies/key/JWT foundation | `4941506..fcf20da`, review clean |
| Complete | Task 2 registration/login/refresh/profile backend | `46a278f..2b1f96a`, review clean |
| Complete | Task 3 TOTP/challenges/rate limiting/deletion | `178821b..f6cced8`, review clean |
| Complete | Task 4 Angular auth store/interceptor/routes | `c639e67..2c185f6`, review clean |
| Complete | Task 5 Angular profile/security/browser contracts | `0c492ec..567434a`, review clean |
| Complete | Task 6 acceptance evidence/status | Fresh backend integration, Compose auth, cross-service JWT, Playwright browser, and frontend verification evidence recorded in `docs/audit/batch-2-verification.md` |

Final whole-branch review and consolidated fix `31f9fc3` are clean. The fix wires CORS, trusted-proxy rate identity, shared Problem Details errors, and immediate profile-name synchronization without changing the acceptance blockers.

## Current blocker

Batch 2 is complete. Batch 3 code verification is passing, but live Compose acceptance is pending the user-provided `.env`. Do not claim Batch 3 complete until live catalog/admin smoke and frontend catalog e2e pass.

## Dispatch policy

Dispatch only the first unfinished workstream. Each implementer receives this context, its task brief, the precise base/head range, and the minimum canonical row above. Implementers use TDD, commit their task, and write a report before one independent review. Failed reviews resume the same implementer for rounds 1–3; later rounds use a fresh stronger implementer. Do not mark Batch 2 complete or merge/push without explicit human authority and fresh acceptance evidence.

## Environment notes

- JDK 26 may be present; Maven must compile with release 21 and record compatibility warnings without treating them as Java 21 proof.
- Use an ephemeral local `.env` for live Compose checks; never commit or print secrets.
- Docker/Testcontainers and Maven wrapper network access may require approved escalation.
