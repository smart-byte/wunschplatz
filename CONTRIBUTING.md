# Contributing

Use a supported Node.js version from `package.json`, run `npm ci`, and keep changes focused. Include a concrete before/after description and the checks you ran in your pull request. Use synthetic student data in fixtures, screenshots, and bug reports.

## Architecture

- `src/store/session.ts` guards edits during startup, round transitions, and storage failures. Tabs select rounds independently using session storage.
- `src/store/persist.ts` commits the complete workspace in one IndexedDB read/write transaction. `workspaceSync.ts` merges local changes against the latest saved revision; `bootstrapRounds.ts` broadcasts invalidations and refreshes on focus. Never persist a stale whole-store snapshot over the shared record.
- `legacyWorkspace.ts` reads older databases and recovers staged round switches before creating the new workspace. Keep legacy data intact during migration.
- The selected round uses the working stores; other rounds contain snapshots. `roundsTransaction.ts` drains pending edits before switching. Replacing projects goes through `commitProjects`; replacing students goes through `commitImportedStudents`.
- `src/excel/studentValidation.ts` validates both import formats. `useImportWorkbook` handles file decoding and cancellation. Preserve project IDs and previous form versions; never silently remove a bad wish and change the remaining ranks.
- `src/lib/distribution.ts` derives current rows, ranks and statistics. Both manual assignment views use `useManualAssignment`. Solver runs record their inputs, and `useSolver` cancels results when those inputs or the round change.
- App routes are loaded on demand. Keep spreadsheet and drag/drop dependencies out of the landing page.

## Validation

Run `npm run lint`, `npm run format:check`, `npm test`, `npm run build`, and `npm run test:e2e`. Run `npm run format` to format edits. Browser tests use synthetic data and independent browser contexts. Add regression tests for data loss, import interpretation, solver changes, and user-visible failures. Use role/label locators and wait for observable state rather than fixed delays.

The browser suite starts its own server on port 5174 and runs in Chromium. Keep that port free. To run specific tests, pass their paths after `npm run test:e2e --`. Failed tests retain traces under `test-results/`; open one with `npx playwright show-trace path/to/trace.zip`.

Keep German and English locale keys aligned. Name every interactive control. Check dialogs, navigation, and primary actions at narrow mobile widths as well as desktop widths. Prefer the existing UI primitives and shared domain helpers over duplicated business logic.

## Dependencies and storage changes

Commit `package-lock.json` with dependency changes. SheetJS is pinned to an official tarball because the registry package is outdated. Check the source and integrity when upgrading it.

Preserve old persisted data and test migrations. Changing the working-set layout or round transaction protocol requires recovery tests, including a failed storage write and a competing browser tab. Do not add telemetry or upload student data without an explicit product decision.

## License

Contributions are provided under the repository's ISC license.
