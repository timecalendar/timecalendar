## 1. Firebase OTA observability seam

- [x] 1.1 Extend `mobile/src/firebase/index.ts` with a lazy modular RNFirebase v24 `setAttributes(getCrashlytics(), attributes)` helper, retaining the existing top-level FCM background-handler registration as the only native-on-import exception; verify TypeScript exposes only string attributes through `@/firebase`
- [x] 1.2 Extend `mobile/jest/setup-firebase.ts` and `mobile/src/firebase/firebase.test.ts` to prove the helper forwards the complete map to modular `setAttributes` and that `setBackgroundMessageHandler` still registers exactly once; verify with `npx jest --runInBand src/firebase/firebase.test.ts`

## 2. Silent OTA runtime boundary

- [ ] 2.1 Add the owned `mobile/src/updates/` non-visual runtime component and barrel: consume `useUpdates()`, install the five deterministic OTA Crashlytics keys once per JavaScript runtime, and catch attribute-installation rejection through `recordUnknownError(error, "ota/attributes")`; verify no module outside the boundary imports `expo-updates` for runtime behavior and no module outside `@/firebase` imports RNFirebase
- [ ] 2.2 Implement one stable AppState subscription using refs for pending state, a consumed background marker, and a pre-call reload latch; call `reloadAsync()` only after a real `background → active` boundary and record a rejection once through `recordUnknownError(error, "ota/reload")`
- [ ] 2.3 Mount the OTA runtime exactly once in `mobile/src/app/_layout.tsx` without changing splash gating, FCM side-effect import/registration, navigation, providers, visible UI, or user-facing text; verify the component renders `null`
- [ ] 2.4 Add focused `ota-update-runtime.test.tsx` CI proof cases for: pending-while-active no-op, background/inactive/active reload, no-pending boundary consumption, inactive-only no-op, pending-ref freshness without listener churn, duplicate events/remount guards, rejected reload recording/no retry, deterministic embedded/development keys, and listener cleanup; verify with `npx jest --runInBand src/updates/ota-update-runtime.test.tsx`

## 3. Explicit Expo launch policy

- [ ] 3.1 Set `updates.fallbackToCacheTimeout: 0` explicitly beside the existing URL in `mobile/app.config.ts`, changing no URL, request header, channel/profile, runtime-version policy, plugin, identity, Firebase file, certificate, credential, or environment-switching input
- [ ] 3.2 Resolve production and `APP_VARIANT=development` with `npx expo config --json`; verify both report timeout `0`, the unchanged update URL/fingerprint policy, and their existing app ids/Firebase files/network-exception split

## 4. Architecture Book and human verification handoff

- [ ] 4.1 Add and index ADR 036 with the ratified xprem + Cloudflare R2, existing production Postgres control plane/no ClickHouse, signed-update, fingerprint-compatibility, and silent foreground-apply decisions; include exactly “channel pointers and rollout percentages are imperative, deliberately.” and label endpoint/signing/deployment inputs as deferred
- [ ] 4.2 Update `docs/mobile/architecture-book/eas.md` and `firebase.md` with the current OTA runtime/Crashlytics contracts, reconcile `architecture.md` so `CHANGELOG.md` is the canonical rule-change log while Git retains implementation history, and append this dated rule change to the existing `CHANGELOG.md`; do not create `architecture-changelog.md`, and update `runtime.md` only if its baseline contract actually changed
- [ ] 4.3 Add a `docs/react-native-migration/inbox/` note tagged `(HUMAN: ...)` for real-device proof after endpoint/signing work: background download, no foreground interruption, one reload after return, embedded/downloaded Crashlytics keys, and both platforms/release configuration; record it as deferred, never a blocker

## 5. Local-green and proposal compliance

- [ ] 5.1 Run the focused Firebase and OTA Jest proof tests together and confirm the existing FCM top-level registration proof remains green
- [ ] 5.2 Run `npx tsc --noEmit`, `npm run lint`, and Prettier check/format for every touched mobile source/config file; resolve all errors and warnings
- [ ] 5.3 Run `npm test -- --coverage` so the focused OTA/Firebase proof executes in the same CI posture and the 90% logic/70% global thresholds remain green; Maestro is N/A because the change adds no screen, CTA, prompt, navigation, or automatable device transport
- [ ] 5.4 Run `openspec validate add-safe-mobile-ota-runtime` and review the final diff for sensitive surfaces: only `mobile/app.config.ts` native config and `docs/mobile/architecture-book/**` binding rules may be touched; confirm no OpenAPI/generated client, migration, Firebase config file, EAS/store credential, CI/infra, server, or Flutter legacy changes
