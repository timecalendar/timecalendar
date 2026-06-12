## 1. Scaffold the Expo app

- [x] 1.1 Run `npx create-expo-app@latest mobile` (default template), pinned to Expo SDK 56; verify `expo@56.x` / RN 0.86 in `mobile/package.json` *(actual pairing: SDK 56 ↔ RN 0.85.3 — the 0.86 figure in the proposal was wrong; `expo install --check` is clean)*
- [x] 1.2 Add `expo-dev-client` via `npx expo install expo-dev-client`
- [x] 1.3 ~~Add `"mobile"` to root workspaces~~ **Revised (design D7):** keep `mobile/` standalone with its own `package-lock.json` (root `package.json` untouched), `npm install` in `mobile/`, and confirm `npx expo-doctor` passes *(done: 21/21 checks pass; workspace attempt hit the react version-coupling conflict and was reverted)*

## 2. Configure the app

- [x] 2.1 Replace `app.json` with a dynamic `app.config.ts` implementing the `APP_VARIANT` pattern: default/production → `fr.samuelprak.timecalendar` + "TimeCalendar", `APP_VARIANT=development` → `fr.samuelprak.timecalendar.dev` + "TimeCalendar (Dev)" *(also: slug/scheme `timecalendar`, dev scheme `timecalendar-dev`; verified via `expo config --json` for both variants)*
- [x] 2.2 Add `ios` / `android` npm scripts in `mobile/package.json` that set `APP_VARIANT=development` and run `expo run:ios` / `expo run:android` *(`start` also sets `APP_VARIANT=development` so the dev server resolves the same identity)*
- [x] 2.3 Install and configure `expo-build-properties` with `ios.deploymentTarget: "15.1"` and `android.minSdkVersion: 24`; check SDK 56's own minimums and note the effective floors (if they exceed K-2, flag the K-2 revisit in `migration-approach.md` §8) *(SDK 56 iOS minimum is 16.4 → effective floors iOS 16.4 / API 24; configured 16.4 explicitly; K-2 revisit flagged in §8)*
- [x] 2.4 Enable TS strict flags in `mobile/tsconfig.json` (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) and fix any template code that fails; `npx tsc --noEmit` clean *(template code passes as-is; created `expo-env.d.ts` for the CSS-module declarations the template references)*
- [x] 2.5 Set up CNG: gitignore `mobile/android/` and `mobile/ios/`, verify `npx expo prebuild --clean` regenerates both and leaves `git status` clean of native dirs *(template .gitignore already ignores `/ios` `/android`; prebuild + pod install succeeded; `git check-ignore` confirms both)*
- [x] 2.6 Write `mobile/README.md`: toolchain prerequisites (Xcode, JDK, Android SDK), the two launch commands, the `APP_VARIANT` convention, and the prebuild-on-variant-switch caveat

## 3. Create the Architecture Book

- [x] 3.1 Create `.claude/rules/mobile/architecture.md` seeded with: the book's charter (what it is, how it changes — referencing migration-approach §7), the R-1…R-6 working rules, and this change's decisions (SDK 56 via K-1 revisit clause, TS strict flags, CNG, `APP_VARIANT` identity, standalone-project placement per D7, effective OS floors)
- [x] 3.2 Update `docs/react-native-migration/00-exploration/migration-approach.md` (§2 artifact table) and `docs/react-native-migration/01-roadmap/01-foundation.md` (step 12) to state that the Architecture Book lives at `.claude/rules/mobile/` *(also marked roadmap steps 1–2 done with the effective floors)*

## 4. Verify launchability (the DoD)

- [x] 4.1 `npm run ios` in `mobile/`: dev-client build succeeds and the default screen renders on an iOS simulator; confirm the installed app is "TimeCalendar (Dev)" / `fr.samuelprak.timecalendar.dev` *(Xcode 26.5: Build Succeeded 0 errors; bundled 1643 modules; screenshot-verified on iPhone 17 Pro — CFBundleDisplayName "TimeCalendar (Dev)", CFBundleIdentifier `fr.samuelprak.timecalendar.dev`, runtime exposdk:56.0.0)
- [x] 4.2 `npm run android` in `mobile/`: dev-client build succeeds and the default screen renders on an Android emulator; confirm identity as above *(Pixel_10 / API 36: screenshot-verified "Welcome to Expo" + dev menu "TimeCalendar (Dev)" exposdk:56.0.0; APK badging `fr.samuelprak.timecalendar.dev`, minSdk 24, targetSdk 36. Build needs JAVA_HOME→JDK 17: the SDKMAN-default JDK 25 daemon crashes Gradle 9.3's foojay resolver and the worklets CMake step)
- [x] 4.3 Spot-check the generated native projects: New Arch enabled, Hermes active, iOS deployment target ≥ 15.1, Android `minSdkVersion` ≥ 24 *(verified in generated projects: `newArchEnabled=true`, `hermesEnabled=true` / `expo.jsEngine: hermes`, `IPHONEOS_DEPLOYMENT_TARGET = 16.4`, `android.minSdkVersion=24`, applicationId `fr.samuelprak.timecalendar.dev`; runtime confirmation lands with 4.1/4.2)
- [x] 4.4 Sanity-check the rest of the repo still works: root `package.json`/`package-lock.json` are untouched by this change (git-verified), root `npm install` is clean, `web` still typechecks
