# Human Usability Test

Date prepared: 2026-09-15
Status: **Pending a real participant**

The automated Playwright journey provides supporting interaction evidence, but
it must not be reported as human observation. A facilitator should run the
following path against a seeded local or staging stack and record the participant
without collecting passwords, tokens, or identifying data.

| Step | Participant task | Record |
| --- | --- | --- |
| 1 | Create an account and sign in | completion, hesitation, confusion |
| 2 | Find a movie by title and open its details | search success and time |
| 3 | Rate the movie | control discoverability and feedback |
| 4 | Add it to the watchlist, then remove it | state clarity and confirmation |
| 5 | Open recommendations and explain why one result appears | explanation comprehension |
| 6 | Apply a genre/rating filter | filter discoverability and empty-state clarity |
| 7 | Share a recommendation and open the public share page | sharing confidence and errors |

## Current evidence

- Automated browser coverage confirms login, reload, guarded navigation, logout,
  sharing, disposable-admin cleanup, and 2FA flow; see
  `docs/audit/batch-11-browser-failure-verification.md`.
- No human participant, confusion notes, satisfaction score, or time-on-task
  result has been invented. Batch 12 remains partial until a facilitator records
  those observations.

## Suggested record

Use an anonymous participant ID, capture one short observation per step, and
record whether the task was completed without facilitator intervention. Delete
any screenshots or notes containing credentials or personal data after the audit.
