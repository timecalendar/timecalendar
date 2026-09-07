## Context

The mobile tree already follows the layered feature-module pattern: feature-owned UI and logic live under `src/features/<feature>/<layer>/`, while `src/components/` and `src/hooks/` retain only shared shell, primitives, and infrastructure. Two leftovers violate that current ownership shape:

- `src/components/firebase-debug-panel.tsx` is definition-only. Repository-wide searches find no static import, dynamic import, `require`, barrel export, route, or test consumer. The Profile route now redirects to Settings, and the Settings hub deliberately does not render the panel.
- `src/hooks/use-app-ready.ts` is imported in production only by `src/features/splash/ui/splash-screen.tsx`. Its test is colocated with the old shared path, and the splash test mocks that old path.

The audit also establishes why the other top-level modules stay put: `AppTabs` is the application navigation shell; `components/chrome` is the shared native-chrome seam; themed text/view and the write-error notice serve many features; `useColorScheme` connects platform appearance to theme and feature UI; and `useRecordedAction` is used by mutations across calendar sources, checklists, feedback, hidden events, and personal events.

## Goals / Non-Goals

**Goals:**

- Remove the unreferenced Firebase debug component and its dead translations only after a final whole-repository reference check.
- Make the readiness hook privately owned by the splash UI sublayer without changing its implementation or behavior.
- Keep every surviving top-level component/hook backed by a concrete shared-shell, cross-feature, or infrastructure justification.
- Keep specifications and actionable operational guidance aligned with the resulting source tree.
- Preserve lint boundaries, route thinness, tests, and all runtime behavior.

**Non-Goals:**

- No broad folder or feature-layer redesign.
- No relocation of shared primitives, navigation shell, native chrome, color scheme, recorded-action, storage, database, Firebase, theme, or OTA seams.
- No changes to Firebase helper behavior, debug reporting configuration, native files, API contracts, database schema, deployment, CI, or legacy Flutter.
- No rewrite of historical roadmap entries or archived OpenSpec changes; those remain accurate records of earlier implementation states.
- No ADR: this applies the accepted feature ownership rule and removes dead code rather than establishing or changing a load-bearing rule.

## Decision 1 — Keep readiness private to the splash `ui/` sublayer

Move `use-app-ready.ts` and `use-app-ready.test.ts` to `src/features/splash/ui/`. `splash-screen.tsx` imports the hook with a local relative import, and `splash-screen.test.tsx` mocks the new feature-owned module path. The `ui/index.ts` barrel continues to expose only `SplashScreen`; the readiness hook remains an implementation detail because it has no external consumer.

This is preferred over a new `data/` or `store/` layer because the hook owns transient launch-presentation readiness, not server data or persisted state. It is preferred over exporting the hook publicly because a public barrel would advertise reuse contradicted by the ownership evidence. The hook body and test assertions move unchanged.

## Decision 2 — Remove the panel and obsolete labels, retain the Firebase seam

Delete `firebase-debug-panel.tsx` only after repeating searches for its filename, exported symbol, static imports, dynamic imports, `require` calls, tests, barrels, routes, and current documentation. Remove the three `debug.firebase.*` locale entries because the panel is their only consumer. Keep `logEvent`, `crashTest`, debug Crashlytics configuration, Firebase tests, and the `@/firebase` boundary unchanged.

This is preferred over re-homing the panel into Settings or a new debug feature: no runtime consumer exists, and introducing one would be a product/diagnostic feature rather than a mechanical ownership cleanup. It is also preferred over retaining dead code for possible future verification because the wrapper test and external console-arrival workflow remain the durable seams.

## Decision 3 — Correct current contracts, preserve history

Add delta specifications that replace the old splash paths with `src/features/splash/ui/` ownership and remove the obsolete in-app Firebase-panel requirement. Update the current Architecture Book Firebase page and the still-actionable splash device-verification note so neither instructs a reader to use a deleted component. Do not rewrite migration-roadmap completion narratives, archived changes, or historical ADR references.

The Architecture Book is a sensitive surface, but this is a current-state correction rather than a rule change: no changelog entry or ADR is needed. If implementation discovers a reusable contract change beyond these corrections, it must stop and flag the exact documentation/decision impact before expanding scope.

## Decision 4 — Treat the ownership audit as a bounded verification artifact

The implementation records the survivor rationale in its completion notes and verifies the source tree with repository searches and executable gates. It does not add a permanent inventory document: import consumers, ESLint boundaries, tests, and current source are the authoritative evidence, while a hand-maintained ownership table would immediately begin to drift.

## Risks / Trade-offs

- **A hidden dynamic consumer is missed.** → Search the whole repository for the symbol and filename plus `import(` and `require(` patterns before deletion, then let TypeScript, lint, and full Jest detect unresolved paths.
- **The splash mock keeps targeting the old alias and silently stops controlling readiness.** → Update the explicit Jest mock path and run both the moved hook test and splash component suite.
- **Moving the hook changes Jest coverage matching or import boundaries.** → Run focused Jest with coverage, TypeScript, ESLint, and boundary/route-thinness tests; confirm the logic file still participates in the 90% logic threshold.
- **Documentation becomes historical fiction or loses useful provenance.** → Change only current specifications and actionable guidance; preserve roadmap and archived-change chronology.
- **React Doctor reports unrelated repository debt.** → Run it against the changed React/TypeScript files, classify findings as changed-file actionable or pre-existing/not applicable, and suppress nothing without evidence.

## Migration Plan

This is a source-only mechanical refactor with no persisted-data or rollout migration.

1. Re-run orphan and ownership searches.
2. Move the readiness hook/test, update the splash import/mock, delete the orphan, and remove its unused locale keys.
3. Apply the spec/current-document corrections.
4. Run focused and structural checks, then the mobile-wide gates requested by the issue.

Rollback is a normal revert of the source moves/deletion and documentation deltas; no data or native state is affected.

## Open Questions

None. The ownership and scope evidence is sufficient for the mechanical implementation.
