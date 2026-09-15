# Batch 10 Security Verification — Initial Hardening Evidence

Date: 2026-09-15  
Branch: `main`  
Scope: edge security headers, deterministic scan entry points, and evidence for existing cross-cutting security controls.

## Fresh checks

| Check | Result |
| --- | --- |
| Nginx header policy | `pwsh -NoProfile -File scripts/test-security-headers.ps1` — passed |
| Scan wrapper tests | `Invoke-Pester -Path scripts/security.Tests.ps1` — 2 passed, 0 failed |
| Frontend dependency audit | `npm audit --prefix frontend --audit-level high` — found 0 vulnerabilities |
| Tracked secret-path review | `scripts/security.ps1` — passed; no tracked `.env`, key, PEM, P12, or PFX paths |
| Full security wrapper | `pwsh -NoProfile -File scripts/security.ps1` — passed; gitleaks and Trivy explicitly skipped because they are not installed |
| Diff hygiene | `git diff --check` — passed |

## Implemented controls

- Nginx preserves `X-Request-Id` and now emits `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and a same-origin/HTTPS-compatible CSP.
- Spring `RequestIdFilter` validates or generates request IDs, exposes them in responses, and places them in MDC for structured logging.
- Shared Problem Details include generic status/detail, instance, stable code, and `traceId`; CORS rejection and rate-limit rejection use the same safe writer.
- Resource-server CORS uses an explicit origin allowlist with credentials and exposes only request ID and retry headers.
- Refresh/logout enforce the exact Origin/Referer allowlist; auth endpoints have bounded in-memory rate limits with `Retry-After`.
- Existing tests cover JWT issuer/audience/signature/expiry, role/ownership denial, CORS, request-ID propagation, cookie attributes, origin checks, path normalization, and 429 responses.

## Explicit gaps / follow-up

- gitleaks and Trivy were not available in this environment; the wrapper reports those skips rather than claiming scan results.
- The local Compose topology is HTTP-only on localhost; production TLS/HSTS certificate verification remains a deployment/audit concern, not a claim of this pass.
- k6 load/stress evidence is not claimed here.
