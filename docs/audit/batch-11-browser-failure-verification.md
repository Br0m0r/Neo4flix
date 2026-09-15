# Batch 11 Browser and Failure-Mode Verification

Date: 2026-09-15  
Branch: `main`  
Entry point: rebuilt Docker Compose stack at `http://localhost:8080`

## Stack evidence

- Rebuilt all Compose images with `docker compose ... up -d --build --wait --wait-timeout 600`.
- Neo4j volume was preserved; no reset or deletion was performed.
- Neo4j, migrator, user, movie, rating, recommendation, and web services became healthy.
- `GET /` returned `200` through Nginx with request ID and all configured browser security headers.

## Playwright evidence

Command: `NEO4FLIX_E2E_BASE_URL=http://localhost:8080 npm run e2e` from `frontend`.

- 9 tests discovered.
- 8 passed: anonymous catalog browse, USER admin denial, login/profile/logout, rating lifecycle, recommendation load/filter/outage flow, watchlist lifecycle, authenticated sharing/public lookup, and 2FA enrollment/login verification.
- 1 skipped because no disposable ADMIN E2E credentials were configured: ADMIN catalog CRUD.
- No browser test failed.
- The Playwright suite runs with one worker because these stateful auth flows intentionally share the local Nginx client identity and production auth rate-limit bucket.

## Failure-mode limitations

- With `recommendation-service` stopped, `GET /api/v1/movies?page=0&size=1` continued to return `200`; the service was then restored and all six Compose services returned healthy.
- The first live sharing smoke exposed a Neo4j temporal-binding defect; converting share timestamps to UTC `ZonedDateTime` fixed it. Repository tests, a live API smoke, and the new Playwright sharing test all pass after the fix.
- ADMIN CRUD could not be exercised without `NEO4FLIX_E2E_ADMIN_EMAIL` and `NEO4FLIX_E2E_ADMIN_PASSWORD`.
- The 2FA browser scenario enrolls a disposable user from the returned `otpauth://` URI, verifies the password-only challenge, completes the current TOTP code, and deletes the user with reauthentication.
- Neo4j failure injection and k6 stress execution were not performed in this pass.

## Batch disposition

Batch 11 implementation is not marked complete: the real stack and available browser flows passed, while credential-gated and failure-injection scenarios remain explicitly unverified.
