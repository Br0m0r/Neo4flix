# Active Batch Context — Batch 5 Watchlist

> **Status:** READY — Batch 4 is complete and pushed; Batch 5 watchlist is the next unfinished workstream.
>
> **Purpose:** Compact handoff for direct-main Batch 4 execution. This cache does not override canonical specifications, the approved design, or the implementation plan.

## Repository state

- Worktree: `C:\Users\User\Desktop\Neo4flix`
- Branch: `main` (direct-main execution; do not create new worktrees)
- Current head: `9a9237c` (`docs: complete batch 4 verification checkpoint`)
- Batch 4 design: `docs/superpowers/specs/2026-09-14-batch-4-rating-design.md`
- Batch 4 plan: `docs/superpowers/plans/2026-09-14-batch-4-rating.md`
- Batch 3 audit: `docs/audit/batch-3-verification.md` (Batch 3 remains complete and preserved)
- Batch 4 audit: `docs/audit/batch-4-verification.md` (Batch 4 gates passed and pushed)
- Local `.env` is ignored and must never be committed or printed.

## Batch goal and binding contracts

Deliver Rating Service CRUD, derived movie rating summaries, User Service rating-history facade, and Angular rating/detail/profile flows.

- Rating Service is the sole writer of `RATED`.
- `RATED.key` is deterministic `<userId>:<movieId>` and uniqueness is enforced by the existing constraint.
- Scores are integers 1–5; POST is create-only and duplicate create returns 409.
- PUT requires an existing rating; DELETE is idempotent and ownership-bound.
- Public summaries derive `avg(RATED.score)` and `count(RATED)`; zero ratings return null average and zero count.
- User history facade is read-only and forwards bearer identity plus request ID.

## Workstream dispatch

| State | Workstream | Evidence / handoff |
| --- | --- | --- |
| Complete | Batches 0–3 | Master plan statuses and Batch 3 audit record all gates passed and pushed |
| Complete | Batch 4 Tasks 1–7 | Rating contracts/persistence/API, User facade, Angular detail/rating/profile flows, browser CRUD, audit, and main push |
| Next | Batch 5 | Watchlist vertical slice; read `00_MASTER_EXECUTION_PLAN.md` Batch 5 and its canonical specs before dispatch |

## Verification policy

- Use TDD for every production behavior change: red test, minimal implementation, green focused test, broader regression test.
- Keep Cypher parameterized and user identity derived from JWT subject.
- Run focused tests before broader suites; never claim completion without fresh verification output.
- Record exact commands/results in `docs/audit/batch-4-verification.md` without secrets.
- Do not redispatch completed Batches 0–4; next unfinished workstream is Batch 5.
