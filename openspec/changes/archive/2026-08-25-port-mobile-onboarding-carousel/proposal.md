## Why

The React Native onboarding entry is a text-only interim surface, while the migration roadmap still calls for the three-message onboarding experience users had in Flutter. This change finishes that polish with a native pager, the approved welcome-first order, and a neutral light/dark design without changing onboarding reachability or its downstream school-selection flow.

## What Changes

- Replace the single React Native welcome screen with a three-page carousel ordered welcome → agenda → notifications, using the approved French and English copy and the three existing Flutter illustrations copied into the React Native asset tree.
- Add `react-native-pager-view` as the native iOS/Android pager, with swipe and Next-button parity, reduced-motion snapping, a grouped accessible page indicator, Skip on pages 1–2, and a final “C'est parti !” action; Skip and the final action both push `/onboarding/school`.
- Refresh the screen to the React Native visual language: neutral token surfaces, framed raster illustrations, pink only for actions/active state, safe-area-aware chrome, responsive tablet-width bounds, and equal light/dark treatment.
- Replace the interim `onboarding.welcome.*` catalog with the approved flat `onboarding.page.*` and control keys in complete French/English parity; remove the welcome QR and URL actions while leaving their routes deep-linkable and preserving the school picker's iCal fallback.
- Rewrite component tests and extend the existing Maestro onboarding flow through both Next actions before continuing to the live school read.
- Record the native pager choice in a new ADR and update the Architecture Book, EAS/runtime guidance, roadmap state, architecture changelog, Phase 07 changelog note, and the existing onboarding device-pass inbox.
- Treat the Flutter `app/` files as read/copy sources only. No Flutter behavior or source is modified.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-onboarding-flow`: Replace the interim single welcome surface with the accessible, localized three-page native carousel while preserving the welcome-first route and school-selection handoff.

## Impact

- Mobile UI and proofs: `mobile/src/features/onboarding/ui/`, the EN/FR catalogs, Jest setup, onboarding Maestro flow, and copied assets under `mobile/assets/images/onboarding/`.
- Native dependency/runtime: `mobile/package.json` and `mobile/package-lock.json` gain Expo-compatible `react-native-pager-view`; it autolinks with no permissions or config plugin, changes the native fingerprint, and therefore requires fresh development/EAS binaries.
- Architecture binding: a new pager ADR plus updates to `features.md`, `runtime.md`, `eas.md`, `CHANGELOG.md`, the Phase 03/07 roadmaps, and the existing manual DoD inbox note.
- Sensitive surfaces: native dependency/runtime/EAS documentation and Architecture Book/ADR rules are intentionally touched. Legacy `app/assets/images/` and the Flutter onboarding screen are read/copy sources only.
- Explicitly untouched: `openapi/openapi.json`, generated API clients, server migrations/schema, `mobile/app.config.ts`, `mobile/eas.json`, Firebase/store config, secrets, deploy/CI workflows, Terraform, and Kubernetes.
