## 1. Restore the Expo device-family contract

- [ ] 1.1 Set `ios.supportsTablet: true` and `ios.requireFullScreen: true` in `mobile/app.config.ts`, retain the top-level `orientation: "portrait"`, and make no direct Xcode/plist, EAS profile, credential, Firebase, workflow, dependency, or Flutter change; verify preview Expo config resolves the production bundle identifier with tablet support, full-screen mode, and portrait orientation.
- [ ] 1.2 Extend `mobile/app.config.test.ts` so development and the parameterized preview/production cases each assert `ios.supportsTablet === true`, `ios.requireFullScreen === true`, and `orientation === "portrait"`; run the focused Jest file directly and confirm removing any field would fail the CI-discovered proof test.

## 2. Prove generated iOS output without committing it

- [ ] 2.1 Add a repository-owned command under `mobile/scripts/` that creates and traps cleanup of its own disposable directory, reuses the installed project dependencies, and runs `OTA_CHANNEL=preview npx expo prebuild --platform ios --clean --no-install` without modifying or committing `mobile/ios/`.
- [ ] 2.2 In that command, inspect the generated application target rather than an unconstrained text match and accept harmless Xcode quoting while requiring `TARGETED_DEVICE_FAMILY` to resolve exactly to `1,2`; make a wrong or missing family value return non-zero.
- [ ] 2.3 Inspect the generated plist, require `UIRequiresFullScreen=true`, resolve iPad orientations from `UISupportedInterfaceOrientations~ipad` when present or the generic `UISupportedInterfaceOrientations` fallback, require portrait-only values, and return non-zero if either landscape orientation appears; add fixture/self-test coverage for the verification parser where practical, then run the command against an actual clean preview prebuild and record the generated values.

## 3. Refresh fingerprint evidence

- [ ] 3.1 From `mobile/`, run the project-local SDK 56 managed-workflow runtime resolver for iOS with `OTA_CHANNEL=preview` and `OTA_CHANNEL=production`; record exact commands and post-change hashes, and confirm the device-family change moved the iOS fingerprints rather than adding or broadening `.fingerprintignore`.
- [ ] 3.2 Update the exact iOS preview/production hashes in `docs/mobile/architecture-book/eas.md` and `mobile/EAS.md`; leave Android values untouched unless a reproducible Android measurement proves they changed, and state that the corrected native shell requires a fresh signed iOS preview binary and is not OTA-compatible with the rejected/previous shell.

## 4. Update the Architecture Book and operator pointers

- [ ] 4.1 Create and index ADR 042 for the iPhone+iPad, portrait-only, full-screen platform contract, including the App Store continuity constraint, disabled iPad multitasking trade-off, Expo/CNG source of truth, source and generated-native gates, consequences, rejected alternatives, and concrete revisit conditions.
- [ ] 4.2 Update `docs/mobile/architecture-book/runtime.md`, `docs/mobile/architecture-book/eas.md`, `docs/mobile/architecture-book/CHANGELOG.md`, `mobile/EAS.md`, and Phase 01 roadmap step 11 so current-state/operator prose points to the enforcement commands and fresh-binary consequence without claiming that a build or submission occurred.

## 5. Local green and CI proof

- [ ] 5.1 From `mobile/`, run `npm run generate` followed by `git diff --exit-code src/api/generated`, `APP_VARIANT=development npx expo customize tsconfig.json`, `npx tsc --noEmit`, `npm run lint`, and `npm test -- --coverage`; verify the focused config test executes in the same Jest/coverage gate and all prescribed checks are green.
- [ ] 5.2 Run the disposable preview prebuild/device-family/orientation command again, `npx prettier --check` or format every touched TypeScript/Markdown/shell file as repository tooling requires, and run `git diff --check` plus `openspec validate restore-mobile-ipad-support --strict`.
- [ ] 5.3 Audit the final diff and generated/untracked files: `mobile/app.config.ts` and Architecture Book rules are the only sensitive surfaces; confirm no `mobile/ios/` or `mobile/android/`, OpenAPI/generated client, migration, secret/certificate, Firebase, infrastructure, workflow, EAS submission/profile, dependency, or legacy Flutter change exists.
- [ ] 5.4 Push implementation commits to the existing branch/PR and use exact-head GitHub mobile CI as the proof test; do not add `run-e2e`, build/upload/submit a store artifact, or mark apply complete until the required mobile checks are green or a concrete pipeline blocker has been escalated.
