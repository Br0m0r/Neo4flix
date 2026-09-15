# Bounded Stress-Smoke Evidence

Date: 2026-09-15
Profile: `scripts/k6/smoke.js`
Status: **Partial — bounded public and authenticated smoke passed**

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

An authenticated disposable-account smoke profile is also available. It never
embeds a password or prints the access token; the account is deleted in k6
`teardown`:

```powershell
$secure = Read-Host 'Disposable k6 password' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $env:K6_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  docker run --rm -i --network host -e BASE_URL=http://host.docker.internal:8080 -e K6_PASSWORD -v "${PWD}\scripts\k6:/scripts:ro" grafana/k6:0.53.0 run --vus 1 --duration 15s /scripts/authenticated-smoke.js
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  Remove-Item Env:K6_PASSWORD -ErrorAction SilentlyContinue
}
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

## Authenticated smoke run

Profile: `scripts/k6/authenticated-smoke.js`
Runner: `grafana/k6:0.53.0`, 1 VU for 15 seconds

| Field | Result |
| --- | --- |
| Requests/checks | 48 requests; 45/45 authenticated endpoint checks passed |
| HTTP failure rate | 0.00% |
| Latency | p95 `http_req_duration`: 131.53 ms |
| Disposable cleanup | 0 `k6-*` users remained after teardown |
| Graph continuity | Relationship count remained `42` after cleanup |

These bounded public and authenticated smokes are recorded, but Batch 13
remains open until sustained concurrency, a deterministic load-seed integrity
check, and performance interpretation are complete.

The authenticated profile is a bounded smoke probe only; a successful run does
not establish sustained throughput or a release SLO. The full Batch 13 gate
still requires a deterministic load seed, sustained concurrency, and integrity
analysis under load.
