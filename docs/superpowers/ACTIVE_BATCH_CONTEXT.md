# Active Batch Context — Batch 4 Ratings

> **Status:** IN PROGRESS — Batch 4 implementation is complete; final verification/audit is the only unfinished workstream.
>
> **Purpose:** Compact handoff for direct-main Batch 4 execution. This cache does not override canonical specifications, the approved design, or the implementation plan.

## Repository state

- Worktree: `C:\Users\User\Desktop\Neo4flix`
- Branch: `main` (direct-main execution; do not create new worktrees)
- Current head: `b210ba0` (`feat: show rating history in profile`)
- Batch 4 design: `docs/superpowers/specs/2026-09-14-batch-4-rating-design.md`
- Batch 4 plan: `docs/superpowers/plans/2026-09-14-batch-4-rating.md`
- Batch 3 audit: `docs/audit/batch-3-verification.md` (Batch 3 remains complete and preserved)
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
| Complete | Tasks 1–6 | Rating contracts/persistence/API, User facade, Angular detail/rating/profile flows; focused tests green |
| In progress | Task 7 | Final repository verification, audit evidence, review, main push |

## Verification policy

- Use TDD for every production behavior change: red test, minimal implementation, green focused test, broader regression test.
- Keep Cypher parameterized and user identity derived from JWT subject.
- Run focused tests before broader suites; never claim completion without fresh verification output.
- Record exact commands/results in `docs/audit/batch-4-verification.md` without secrets.
- Do not redispatch completed Batches 0–3; next unfinished workstream after Batch 4 is Batch 5.
