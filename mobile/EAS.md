# EAS — build, submit, and over-the-air updates

For the release flow, signing custody and readiness audit, start with
[`docs/mobile/releases/`](../docs/mobile/releases/README.md). The binding rules are the
Architecture Book's [EAS / distribution](../docs/mobile/architecture-book/eas.md) page and
ADRs [006](../docs/mobile/architecture-book/decisions/006-eas-distribution.md) /
[037](../docs/mobile/architecture-book/decisions/037-self-hosted-ota-runtime.md) /
[040](../docs/mobile/architecture-book/decisions/040-local-store-builds-and-store-preview.md).
This file describes the committed configuration and the commands.

Store binaries are built **locally on the macOS host** with `eas build --local` (ADR 040). EAS
is the credential authority and the upload transport; it does not run our builds. Builds are
requested deliberately for a named commit and profile — nothing about merging to `main` builds
or uploads anything.

## Profiles ↔ channels ↔ variants

Three build profiles in [`eas.json`](./eas.json), split along the `APP_VARIANT`
identity line (not a third identity — design D1):

| Profile       | `APP_VARIANT` | Identity / Firebase                         | Distribution | Artifacts                        | Channel      | Audience                            |
| ------------- | ------------- | ------------------------------------------- | ------------ | -------------------------------- | ------------ | ----------------------------------- |
| `development` | `development` | `…timecalendar.dev` / `timecalendar-dev`    | `internal`   | iOS **simulator** + Android APK  | —            | Us, at a laptop                     |
| `preview`     | _(unset)_     | `…timecalendar` / `timecalendar-samuelprak` | `store`      | store **.ipa** + Android **.aab** | `preview`    | TestFlight internal / Play internal |
| `production`  | _(unset)_     | `…timecalendar` / `timecalendar-samuelprak` | `store`      | store **.ipa** + Android **.aab** | `production` | App Store / Play production         |

- `development` is the fast inner loop: `developmentClient: true`, simulator + APK, no
  signing needed. It carries the `.dev` id, the dev Firebase project, and the dev-variant
  network exceptions (cleartext / local-networking). It is the **only** non-store profile.
- `preview` is the internal-tester track. It builds the **real production identity** so
  testers run the thing we ship and their crashes/analytics land in
  `timecalendar-samuelprak`. TestFlight and Play internal testing distribute the production
  app record, so a store-distributed build is required — there is no direct-install artifact
  and no audience for one (ADR 040).
- `production` is the store track. Same artifacts, different channel and audience.
- A future `beta` profile/channel (TestFlight external + Play closed testing) lands **after**
  the 4.0 cutover: 4.0 ships to everyone at parity, and only later features go to beta first.

Only `development` sets `APP_VARIANT`; `preview`/`production` omit it so they take the
production default in `app.config.ts`. **Verify with the variant diff:**
`npx expo config --json` (production) vs `APP_VARIANT=development npx expo config --json`
— the production config must show `fr.samuelprak.timecalendar` and the
`timecalendar-samuelprak` Firebase files; the dev config the `.dev` id and the
`timecalendar-dev` files.

## Building

Run on the macOS host, one platform per invocation (`--platform all` is unavailable locally):

```bash
npx eas build --profile preview --platform ios     --local --output ./build/preview-ios.ipa
npx eas build --profile preview --platform android --local --output ./build/preview-android.aab
```

Requires `eas login` (managed credentials are downloaded at build time, not stored here), plus
Xcode, fastlane, CocoaPods and the Android SDK/NDK installed on the host.

Local builds carry caveats the CLI won't remind you of:

- **No build caching.** Expo does not support it for local builds.
- **`node` / `fastlane` / `cocoapods` / `ndk` / `image` in `eas.json` are ignored** — the
  host's installed toolchain is what you get. Record its versions with each release.
- **EAS `Secret`-visibility environment variables are not delivered.** Set them in the host
  environment.
- Local builds consume **no EAS build quota**, so the free plan is sufficient.

## Submitting

Submit the exact artifact you built and verified. Never rebuild between verification and
upload — a rebuild can resolve different packages or take a new build number, so the approval
no longer refers to it.

```bash
npx eas submit --profile preview --platform ios     --path ./build/preview-ios.ipa
npx eas submit --profile preview --platform android --path ./build/preview-android.aab
```

`submit.preview` and `submit.production` in `eas.json` are **structure only — no secrets**:
iOS `appleId` / `ascAppId` / `appleTeamId` read from `$EXPO_APPLE_ID` / `$EXPO_ASC_APP_ID` /
`$EXPO_APPLE_TEAM_ID`; Android `serviceAccountKeyPath` points at `../ci/keys/eas-android-sa-key.json`
(outside git), `track: internal`. Never committed.

A production release is submitted to the internal track first, verified on real devices, and
then promoted **within the Play console for that same production-channel artifact**. That is
the only supported promotion — see below.

## Never promote a build across channels

A binary carries its channel from build time. Promoting a `preview` build to a production
track would leave store users receiving internal updates; promoting a future `beta` build to
production would leave them on the beta channel forever. **Play's console offers exactly this
promotion and it must not be used across lanes.** Each lane is built from its own commit, for
its own channel, and submitted to its own track.

## Releases are tags

A release candidate is an **annotated tag on a commit already reachable from `main`**.
`mobile/` keeps no long-lived release branch, and the repository's legacy `production` branch
is not part of the mobile release path.

## Over-the-air updates (`expo-updates`)

- `runtimeVersion: { policy: "fingerprint" }` in `app.config.ts`. An OTA bundle is only
  delivered to a build whose **native runtime fingerprint matches**. Any native-affecting
  change — a new config plugin, a dependency with native code, an SDK bump — changes the
  fingerprint and therefore **requires a fresh native build**; it will not (and must not) ship
  as an OTA. This is the intended safety property, not a bug: if an expected OTA "doesn't
  apply," check whether the change touched native config.
- Updates are served by **self-hosted xprem** (ADR 037), published with `eoas`, not
  `eas update`. The endpoint, signing material and publish workflow are still being delivered;
  `updates.url` points at the hosted default until that change lands, so **do not publish yet**.
- `updates.url` and `extra.eas.projectId` derive from `EAS_PROJECT_ID`, falling back to the
  committed real EAS project ID `3b427ef6-1aae-4175-8217-ea447ee6df6b` for
  `@samuelprak/timecalendar`. The ID is public build metadata, not a secret.
- **A locally-built binary does not read `eas.json`**, so it carries no channel and receives no
  updates at all. The fix is `updates.requestHeaders` in `app.config.ts`; it is not wired yet,
  so treat a local build's channel membership as unproven until it is verified on a device.

## Signing

EAS uses its own **managed credentials** — the iOS distribution certificate + provisioning
profile, and the Android upload key. The Android upload key is held and backed up in three
places; Play App Signing is enabled, so Google holds the user-facing app-signing key. We do
**not** reuse the Flutter Fastlane `match` repo — that stays with the Flutter app as a rollback
asset (design D5). Same production bundle id, so EAS targets the existing App Store record and
Play listing (the RN app ships as an update, not a new app).

## Human prerequisites (cannot be automated)

Real builds still require Apple account access and EAS-managed iOS signing setup, EAS remote
version counters initialized from the live store consoles, store submission credentials,
TestFlight/Play internal tester groups, and physical-device verification. The release guide's
[readiness checklist](../docs/mobile/releases/05-readiness-and-gaps.md) owns current status, and
the [(HUMAN: mobile release bootstrap) inbox note](../docs/react-native-migration/inbox/2026-08-26-mobile-release-bootstrap.md)
owns the exact operator actions. No credential or private key belongs in git.
