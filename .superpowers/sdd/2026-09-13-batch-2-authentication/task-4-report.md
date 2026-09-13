# Task 4 Report — Angular Authentication Flows

## Status

Implemented the Angular authentication foundation and login, registration, and TOTP login flows on `batch-2-authentication` from backend head `f6cced8`. Profile and security management UI remains intentionally deferred to Task 5.

## Delivered

- Added typed authentication DTOs and `AuthApiService` contracts for register, login, TOTP verification, refresh, logout, and current identity.
- Added a signal-based `AuthStore` with idle/bootstrap/authenticated/anonymous state, in-memory access tokens and TOTP challenges, refresh bootstrap, login, registration, verification, logout, and clear behavior.
- Added a functional HTTP interceptor that:
  - attaches the current in-memory bearer token;
  - coordinates one shared refresh observable for concurrent eligible 401 responses;
  - retries each eligible request once with the rotated access token;
  - excludes public/session authentication calls from recursive refresh;
  - clears authentication and routes to `/auth/login` when refresh fails.
- Added functional `authGuard`, `anonymousOnlyGuard`, and `adminGuard` redirects using `UrlTree` values. These are navigation conveniences only; backend authorization remains authoritative.
- Added standalone Angular Material login, registration, and two-factor login components with external templates and styles.
- Added generic credential and TOTP errors, 429 messaging, loading/duplicate-submit prevention, bounded client controls, registration password-policy guidance, success routing, and no 2FA resend action.
- Added `/auth/login`, `/auth/register`, and `/auth/2fa` lazy routes, protected the root route, registered the interceptor, and wired startup refresh through `provideAppInitializer`.
- Updated the application shell with authenticated and anonymous navigation, an ADMIN entry, logout, and a compact Material menu for small screens.

## TDD Evidence

The following RED runs were observed before their implementations:

- `npm test -- --watch=false --include src/app/core/auth.store.spec.ts`
  - failed because `auth.models`, `auth-api.service`, and `auth.store` did not exist.
- `npm test -- --watch=false --include src/app/core/auth.interceptor.spec.ts`
  - failed because `auth.interceptor` did not exist.
- `npm test -- --watch=false --include src/app/core/auth.guards.spec.ts`
  - failed because `auth.guards` did not exist.
- `npm test -- --watch=false --include src/app/features/auth/*.spec.ts`
  - failed because the three auth components did not exist.
- `npm test -- --watch=false --include src/app/app*.spec.ts`
  - failed on missing auth routes, startup bootstrap, and shell auth actions.
- `npm test -- --watch=false --include src/app/app.component.spec.ts`
  - failed on the incomplete authenticated top-navigation contract before the remaining links and compact menu were added.

Each focused suite was rerun GREEN before moving to the next behavior. Tests exercise state transitions, HTTP requests, actual `UrlTree` serialization, and rendered component output; only external HTTP/navigation boundaries are replaced with test doubles.

## Final Verification

Executed from `frontend/` on the final implementation tree:

- `npm test`
  - PASS: Docker Node pin check passed.
  - PASS: 10 Vitest files, 28 tests, 0 failures.
- `npm run lint`
  - PASS: 0 errors and 0 warnings with `--max-warnings=0`.
- `npm run build`
  - PASS: Angular production build completed.
  - Initial bundle: 421.95 kB raw / 102.81 kB estimated transfer, within configured budgets.
- Production storage scan:
  - `rg -n 'localStorage|sessionStorage' frontend/src/app --glob '!*.spec.ts'`
  - PASS: no production references. The only storage references are spies in `auth.store.spec.ts` proving neither storage API is written.
- `git diff --check`
  - PASS: no whitespace errors. Git emitted only expected LF-to-CRLF working-copy notices on Windows.

## Environment Notes and Concerns

- The existing worktree `node_modules` was incomplete (`semver` missing), so `npm install` restored packages from the pinned lockfile. Neither `package.json` nor `package-lock.json` changed.
- Angular commands required execution outside the restricted filesystem sandbox because the builder resolves paths above the linked worktree; this is a harness/path-resolution constraint, not an application failure.
- Browser-level refresh-cookie flag and storage inspection remain Task 5 acceptance work, along with profile/security UI. This task contains no profile editing, password change, TOTP enrollment/disable, or account deletion UI.
