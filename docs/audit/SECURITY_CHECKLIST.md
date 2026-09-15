# Security Checklist

Date: 2026-09-15
Scope: evidence available in the repository and the current local Compose stack

This checklist distinguishes verified controls from evidence that still needs an
external scanner, deployment certificate, or human operator. A checked row is
backed by a tracked test, scan, or audit document; it is not a claim that a
production deployment has been independently certified.

| Area | Evidence | Status |
| --- | --- | --- |
| Password hashing, JWT signing/validation, refresh rotation, TOTP enrollment and replay protection | `docs/audit/batch-2-verification.md`; `AuthProductionContextIT`, `AuthNeo4jIntegrationIT`, refresh/challenge tests | Verified |
| USER/ADMIN authorization and ownership boundaries | `docs/audit/batch-11-browser-failure-verification.md`; browser/API authorization checks | Verified |
| Parameterized Cypher, sort/filter bounds, URL validation, XSS-safe projections | `docs/audit/batch-3-verification.md`, `batch-4-verification.md`, `batch-10-verification.md`; focused backend/frontend tests | Verified |
| Generic Problem Details, request IDs, no credential/token logging | `docs/audit/batch-10-verification.md`; security wrapper tests and service tests | Verified |
| Security headers, explicit CORS, refresh-cookie origin checks, trusted-proxy handling | `docs/audit/batch-10-verification.md`; Nginx/header and auth tests | Verified for local HTTP configuration |
| Dependency and repository secret scans | `make security`; `scripts/security.ps1` | Optional scanners are unavailable in this environment; repository checks pass |
| TLS termination, HTTPS redirect, HSTS, certificate rotation | `08_DEPLOYMENT_OPERATIONS.md` | Deployment evidence required; not provided by the local HTTP stack |
| Authenticated k6 load and rate-limit profile | `docs/audit/STRESS_TEST.md`, `scripts/k6/smoke.js` | Public smoke profile only; full profile remains open |
| Backup/restore recovery evidence | `scripts/backup-neo4j.ps1`, `scripts/restore-neo4j.ps1` | Helpers are guarded; disposable recovery run is required before release sign-off |

## Operator checks

Before sharing a non-local deployment, run `make security`, inspect the generated
Compose configuration, verify the certificate/redirect policy at the edge, and
complete the restore and human usability records. Do not place key material,
passwords, refresh tokens, or TOTP secrets in this document.
