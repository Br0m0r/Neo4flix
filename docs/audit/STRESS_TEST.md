# Bounded Stress-Smoke Evidence

Date: 2026-09-15
Profile: `scripts/k6/smoke.js`
Status: **Partial / runner-dependent**

The checked-in profile is intentionally small: one to five virtual users, a
short duration, and anonymous catalog/genre reads only. It is a readiness probe,
not the full Batch 13 authenticated load, rate-limit, latency, or throughput
audit. It accepts 2xx/3xx/429 responses and fails on other HTTP responses or
the explicit latency/error thresholds.

Run with native k6 when installed:

```powershell
k6 run --vus 1 --duration 15s .\scripts\k6\smoke.js
```

The documented Docker fallback is:

```powershell
docker run --rm -i --network host -v "${PWD}\scripts\k6:/scripts:ro" grafana/k6 run /scripts/smoke.js
```

## Current run record

| Field | Result |
| --- | --- |
| Native k6 discovery | `k6` was not installed in the execution environment |
| Profile execution | Blocked here; no software was installed silently |
| Covered routes | `GET /api/v1/movies?page=0&size=1`, `GET /api/v1/genres` |
| Authenticated coverage | None; recommendation/rating throughput is not claimed |
| Graph continuity | The post-run read-only count check is required after a real run |

After a real run, record the k6 summary (duration, VUs, request count,
`http_req_failed`, and p95) here, then run a read-only Neo4j count query. Keep
Batch 13 open until the authenticated profile, relationship-integrity check,
and performance interpretation are complete.
