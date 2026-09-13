# Neo4flix frontend

Angular 22.1.5 standalone baseline with Angular Material 22.1.5, TypeScript 6.0.3,
SCSS, and Vitest. The root shell and empty route list are ready for later features.
Future browser API calls use the reserved `/api/v1` contract.

Run from `frontend/`:

```sh
npm ci
npm start
```

The development server listens at `http://localhost:4200/`.

Verification:

```sh
npm run lint
npm test -- --run
npm run build
```

The test script maps Vitest's `--run` flag to Angular's `--watch=false` option;
Angular compiles the application and initializes TestBed before running Vitest.
Use `npm test -- --watch` for watch mode. Production assets are written to
`dist/frontend/browser/`.

On Windows PowerShell with script execution disabled, use `npm.cmd` in place of
`npm`. No execution-policy change is needed.
