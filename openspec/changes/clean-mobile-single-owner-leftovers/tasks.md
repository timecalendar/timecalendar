## 1. Reconfirm ownership evidence

- [ ] 1.1 Search the whole repository for `FirebaseDebugPanel`, `firebase-debug-panel`, static imports, dynamic `import(...)`, `require(...)`, tests, barrels, routes, and documentation references; remove the component only if no live code consumer exists, and record which historical references are intentionally retained.
- [ ] 1.2 Inventory every file directly under `mobile/src/components/` and `mobile/src/hooks/`; confirm with import searches that each survivor is shared across features or owns an infrastructure/application-shell seam, and re-home nothing beyond the readiness hook unless one unambiguous feature owner is proven.

## 2. Remove the orphaned Firebase UI

- [ ] 2.1 Delete `mobile/src/components/firebase-debug-panel.tsx`; confirm no test or barrel export needs removal and that the `@/firebase` wrapper helpers and tests remain unchanged.
- [ ] 2.2 Remove only the now-unused `debug.firebase.heading`, `debug.firebase.logEvent`, and `debug.firebase.crash` entries from both FR and EN catalogs; verify the locale JSON remains valid and the catalogs retain matching key sets.

## 3. Move splash readiness to its owner

- [ ] 3.1 Move `mobile/src/hooks/use-app-ready.ts` and `use-app-ready.test.ts` unchanged to `mobile/src/features/splash/ui/`; update `splash-screen.tsx` to a local sublayer import and keep the hook private rather than exporting it from `ui/index.ts`.
- [ ] 3.2 Update `splash-screen.test.tsx` to mock the new feature-owned readiness module path without changing its assertions or timer/mutable-mock cleanup contract.
- [ ] 3.3 Run the focused CI proof tests for both the moved readiness logic and its only consumer: `npm test -- --runInBand src/features/splash/ui/use-app-ready.test.ts src/features/splash/ui/splash-screen.test.tsx`; confirm immediate readiness, watchdog release, reduced-motion handling, accessible status, and dismissal remain green.

## 4. Reconcile current specifications and documentation

- [ ] 4.1 Apply the `mobile-splash` delta so the canonical spec names `src/features/splash/ui/splash-screen.tsx`, its colocated test, and the splash-owned `use-app-ready.ts` path while preserving every behavioral requirement.
- [ ] 4.2 Apply the `mobile-firebase` delta by removing only the obsolete in-app dev-panel requirement; preserve the Firebase wrapper, SDK proof test, debug-build reporting, and manual console-arrival boundary.
- [ ] 4.3 Correct the current-state Firebase Architecture Book paragraph and the still-actionable splash device-verification note so neither points to the deleted panel. Preserve roadmap and archived OpenSpec chronology; do not add an ADR or Architecture Book changelog entry because no reusable rule changes.

## 5. Structural and local-green verification

- [ ] 5.1 Re-run repository reference searches and confirm the deleted component, old readiness import path, old canonical splash paths, and removed translation keys have no live source, current-spec, actionable-doc, test, or barrel references; classify historical references retained by design.
- [ ] 5.2 Run the route-thinness proof `npm test -- --runInBand src/components/settings-route-structure.test.ts` and `npm run lint`; confirm ESLint feature boundaries, sublayer imports, and route entrypoints stay green.
- [ ] 5.3 Run `npx tsc --noEmit` from `mobile/` and resolve every changed-area type failure without expanding the refactor.
- [ ] 5.4 Run React Doctor from `mobile/` against branch changes with `npx --yes react-doctor@0.9.13 --scope changed --base origin/main --project . --no-score --verbose`; classify every finding as fixed, pre-existing/out of scope, or an evidenced false positive, and add no score-only suppression.
- [ ] 5.5 Run the full mobile Jest suite with coverage (`npm test -- --coverage`) when practical; report whether the process exits naturally, and if an environment/resource limit prevents completion, record the exact limitation alongside the focused green proof.

## 6. Final scope and Architecture Book check

- [ ] 6.1 Walk `docs/mobile/architecture-book/definition-of-done.md` for this behavior-preserving refactor: i18n key parity, accessibility/testID behavior, route thinness, feature barrels, tests, types, lint, coverage, and documentation are green or explicitly N/A with a reason.
- [ ] 6.2 Confirm the implementation diff contains only the orphan deletion, readiness move/import updates, dead locale keys, applied spec deltas, and narrow current-document corrections; verify no OpenAPI/generated client, server migration, native/store/EAS/Firebase config, deployment/CI, dependency, or legacy Flutter path changed.
