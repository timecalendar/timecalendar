# EAS — human-only steps (credentials, account, real-device install, store channels)

**Date:** 2026-06-13
**Owner:** Samuel (account + credential holder)
**Change:** `add-mobile-eas` (foundation roadmap step 11)
**Blocking:** the *dogfood-on-a-real-device* half of step 11. The **config half**
(`eas.json`, `expo-updates` wiring, channel/profile mapping) is landed by the change and
does **not** need any of the below to `tsc`/lint/test green. These items unlock actual
builds and installs.

Each task below is tagged `(HUMAN: see inbox/2026-06-13-eas-credentials.md)` in
`openspec/changes/add-mobile-eas/tasks.md` — the implementer skips them and continues.

---

## 1. `eas login` + `eas init` (creates the EAS project)

**What:** From `mobile/`, run `npx eas-cli login` (Expo account), then
`npx eas init`. This creates the EAS project and produces the real **`projectId`** and
**`updates.url`** (`https://u.expo.dev/<projectId>`).

**Why:** `expo-updates` and `eas update` cannot work without a real project id. The change
wires the config to read `EAS_PROJECT_ID` from env / a placeholder so the repo type-checks
without it; `eas init` fills in the real value (and may write `extra.eas.projectId` directly
into `app.config.ts` — keep it consistent with the seam the change added).

**How to verify:** `npx eas project:info` shows the project; `npx expo config --json` shows
a real `extra.eas.projectId` and `updates.url`. Commit the resolved `projectId` (it is not a
secret).

## 2. Apple Developer credentials + signing (iOS)

**What:** During the first `npx eas build --profile preview --platform ios` (or
`npx eas credentials`), link the Apple Developer account and let **EAS manage signing**
(distribution cert + provisioning profile for `fr.samuelprak.timecalendar`). Provide the
Apple id, App Store Connect app id, and Apple team id for the `submit.production.ios` block
via the env vars the skeleton references — do **not** commit them.

**Why:** iOS device/store builds need signing. We use EAS managed credentials, **not** the
Flutter Fastlane `match` repo (that stays with the Flutter app — design D5). Same bundle id,
so it targets the existing App Store record (RN ships as an update).

**How to verify:** `npx eas build --profile preview --platform ios` produces a signed
device `.ipa`; `npx eas credentials` lists the managed profile.

## 3. Google Play service account (Android submit)

**What:** Supply a Google Play service-account JSON key (same key class the Flutter Android
Fastlane uses) and point `submit.production.android.serviceAccountKeyPath` at it (outside
git, like `ci/keys/...`).

**Why:** `eas submit --platform android` needs it to upload the `.aab` to Play.

**How to verify:** `npx eas submit --platform android --profile production` uploads to the
configured track.

## 4. Real-device install (dogfood) + internal-distribution channel

**What:** Run `npx eas build --profile preview` for both platforms; install on a real device
from the EAS internal-distribution URL (iOS: register the device UDID / use TestFlight
internal; Android: install the `.apk` or use Play internal testing). Set up the
**TestFlight internal testing** group (iOS) and the **Play Console internal testing** track
(Android) so dogfooders get builds.

**Why:** This is the Phase 0 exit criterion *"App builds and ships to a real device via EAS
internal channel."* Cannot be automated — needs a physical device, Apple/Google consoles, and
account access.

**How to verify:** the production-identity app launches on a real device; Crashlytics +
Analytics land in the **production** Firebase project (`timecalendar-samuelprak`); an
`eas update --channel preview` is picked up by the installed build on next launch.

## 5. (Already a known prior deferral) `.dev` Firebase apps

The dev-variant Firebase registration is owned by the firebase change's inbox/README
(`mobile/firebase/README.md`), not this one. Listed here only because the `development` EAS
profile builds the `.dev` identity — that profile's builds need the `.dev` Firebase config
files present (already tracked).
