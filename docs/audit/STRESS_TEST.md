# Bounded Stress-Smoke Evidence

Date: 2026-09-15
Profile: `scripts/k6/smoke.js`
Status: **Partial — bounded public smoke passed**

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
docker run --rm -i --network host -v "${PWD}\scripts\k6:/scripts:ro" grafana/k6:0.53.0 run /scripts/smoke.js
```

## Current run record

| Field | Result |
| --- | --- |
| Native k6 discovery | `k6` was not installed; the pinned Docker runner was used |
| Profile execution | Passed with `grafana/k6:0.53.0`, 1 VU for 15 seconds |
| Covered routes | `GET /api/v1/movies?page=0&size=1`, `GET /api/v1/genres` |
| Authenticated coverage | None; recommendation/rating throughput is not claimed |
| Requests/checks | 30 requests; 30/30 checks passed; HTTP failure rate 0.00% |
| Latency | p95 `http_req_duration`: 14.83 ms |
| Graph continuity | Read-only relationship count remained `42` before and after the smoke |

This public smoke is recorded, but Batch 13 remains open until an authenticated
profile, relationship-integrity check over the load seed, and performance
interpretation are complete.
