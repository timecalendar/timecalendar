## Why

The last ownership cleanup left one dead shared component and one splash-only hook in the top-level shared folders. Removing the orphan and colocating splash readiness with its sole feature owner makes the existing feature boundaries truthful without changing launch behavior or redesigning the architecture.

## What Changes

- Prove `mobile/src/components/firebase-debug-panel.tsx` has no static, dynamic, runtime, test, or documentation-backed consumer, then remove it and its now-unused translated labels.
- Move `use-app-ready.ts` and its colocated test from `mobile/src/hooks/` into the splash feature's `ui/` sublayer, and update the splash component/test to use the local sublayer module rather than the old shared-hook path.
- Audit every other top-level component and hook and retain only modules with concrete cross-feature or infrastructure ownership; do not relocate established shared primitives, shell components, or infrastructure seams.
- Correct current-state specifications and operational documentation that would otherwise name the removed panel or the old splash module locations. Preserve historical roadmap and archived-change records.
- Preserve splash timing, watchdog behavior, reduced-motion handling, accessibility, translations outside the deleted debug labels, test IDs, route thinness, and lint-enforced dependency direction.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities

- `mobile-splash`: the readiness gate and its test become splash-feature-owned modules while retaining the existing readiness and dismissal contract.
- `mobile-firebase`: remove the obsolete requirement for an in-app development debug panel while retaining the Firebase wrapper helpers, automated SDK-wiring proof, debug-build reporting, and manual console-arrival boundary.

## Impact

- **Code:** delete `mobile/src/components/firebase-debug-panel.tsx`; move `mobile/src/hooks/use-app-ready.ts` and `.test.ts` under `mobile/src/features/splash/ui/`; update only local splash imports/mocks; remove the three unused `debug.firebase.*` entries from both locale catalogs.
- **Specs/docs:** delta updates for `mobile-splash` and `mobile-firebase`; narrowly correct `docs/mobile/architecture-book/firebase.md` and the still-actionable splash device-verification note. No ADR or Architecture Book changelog entry because no reusable rule changes.
- **Retained shared ownership:** `AppTabs` remains navigation shell; `components/chrome` remains the native-chrome infrastructure seam; themed text/view and write-error notice remain cross-feature primitives; `useColorScheme` remains theme/platform infrastructure; `useRecordedAction` remains a cross-feature mutation helper.
- **API/schema/native/dependencies:** no OpenAPI, generated-client, server migration, native/store/EAS/Firebase configuration, deployment/CI, or legacy Flutter changes.
- **Behavior:** no user-visible or runtime behavior change is intended.
