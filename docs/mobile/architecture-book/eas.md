# EAS / distribution

> R-1 pointer note: entries below are pointers plus the caveats tooling can't carry. The config is encoded in `mobile/eas.json` + `mobile/app.config.ts`; the operator guide is [`mobile/EAS.md`](../../../mobile/EAS.md); the load-bearing decisions are **ADR [006](./decisions/006-eas-distribution.md)** (fingerprint policy + human-invoked EAS).

For the plain-language release flow, signing recovery and current readiness audit, see the
[mobile release guide](../releases/README.md).

## Three profiles, two identities

`mobile/eas.json` has `development` / `preview` / `production`, split along the `APP_VARIANT` line — **not** a third identity:

- **`development`** sets `env.APP_VARIANT = "development"` → `.dev` id, `timecalendar-dev` Firebase, dev network exceptions, `developmentClient: true`, simulator + APK.
- **`preview`** and **`production`** **omit** `APP_VARIANT` so they take the production default in `app.config.ts` (real `fr.samuelprak.timecalendar`, `timecalendar-samuelprak` Firebase, no cleartext). Dogfooders run the _real_ store bundle so their crashes/analytics land in production.
- `preview` vs. `production` differ by **distribution + artifact + channel**, not identity.

Artifacts are **forced by distribution**: `preview` is `distribution: "internal"` → directly-installable iOS device `.ipa` + Android `.apk` (internal can't serve an `.aab`); `production` is `distribution: "store"` → `.aab` (Play) + store `.ipa`, `autoIncrement`. `cli.appVersionSource: "remote"` (EAS owns the build number, pairs with `autoIncrement`).

**Variant-drift is the headline risk** — a `preview`/`production` profile accidentally carrying `APP_VARIANT=development` would ship the `.dev` id + dev Firebase + cleartext to dogfooders/store. The guard: only `development` sets the env var, and the `expo config --json` **variant diff** verifies it (production → prod id/Firebase, dev → `.dev`). Can't be a lint rule (config-shape, not source), hence this prose (R-1).

## `runtimeVersion: { policy: "fingerprint" }`

In `app.config.ts`. An `eas update` JS bundle is delivered **only** to a build whose native runtime fingerprint matches; any native-affecting change (new config plugin, a dep with native code, an SDK bump) changes the fingerprint and **forces a fresh native build** instead of a silently-incompatible OTA. This is the intended safety property — **an expected OTA that "doesn't apply" usually means the change touched native config**, not a bug. Chosen over `appVersion` (a plugin change without a version bump could ship an incompatible OTA) and manual `nativeVersion` (more bookkeeping, no better safety). Load-bearing for a skeleton that churns native config feature-by-feature → ADR [006](./decisions/006-eas-distribution.md).

The onboarding carousel's `react-native-pager-view` dependency is one concrete fingerprint move: its `UIPageViewController`/`ViewPager2` bridge requires a fresh development, preview, or production EAS build before the carousel can run. EAS remains human-invoked; this consequence adds no workflow or `eas.json` change.

## Self-hosted OTA and silent application

ADR [037](./decisions/037-self-hosted-ota-runtime.md) ratifies self-hosted xprem with Cloudflare
R2 assets, the existing production Postgres service as its control plane, and signed updates.
ClickHouse is deliberately omitted because Crashlytics remains the client observability system.
The concrete endpoint, signing material, xprem identifiers, and publishing automation are deferred.

`updates.fallbackToCacheTimeout: 0` keeps cold launch non-blocking: the cached or embedded bundle
starts immediately while Expo checks and downloads in the background. `OtaUpdateRuntime`, the
single owned `src/updates/` boundary, never displays progress or prompts. A downloaded compatible
bundle remains pending until the app has genuinely entered `background` and later becomes
`active`; it then makes one silent `reloadAsync()` attempt per JavaScript runtime. A rejected
attempt is recorded and left for a later cold launch rather than retried into a loop.

Channel promotion and progressive rollout remain operator actions in xprem; declarative
reconciliation must not overwrite incident-time rollback decisions. See ADR 037 for the rule.

## Channels mapped to profiles

Two channels: `preview` (internal dogfood) and `production` (store). `eas update --channel <name>` reaches only installed builds on the matching channel. Channel names mirror profile names (the EAS convention) so the command is unambiguous.

## The `expo-updates` seam without a project

`expo-updates` is in `plugins`; `updates.url` (`https://u.expo.dev/<id>`) and `extra.eas.projectId` are derived from `easProjectId` = `process.env.EAS_PROJECT_ID` ?? the **committed real id** (`eas init` produced `@samuelprak/timecalendar`, projectId `3b427ef6-1aae-4175-8217-ea447ee6df6b`). The id is **not a secret** — it ships in the binary and the EAS project is public-by-id — so committing it as the fallback means a fresh clone / a CI build works with no env. (An earlier **zero-UUID placeholder** was wrong: a fake-but-present id makes EAS believe the project is already linked and **refuse `eas init`** — "Project already linked … Experience with id … does not exist". `eas init` was run with the id left `undefined`, which let it create and link the fresh project; the returned id is now the committed fallback.) `tsc`/lint/Jest don't read `projectId`, so CI `test-mobile` is unaffected.

## Submit skeleton, no secrets

`submit.production` is structure only: iOS `appleId`/`ascAppId`/`appleTeamId` read from `$EXPO_APPLE_ID`/`$EXPO_ASC_APP_ID`/`$EXPO_APPLE_TEAM_ID`; Android `serviceAccountKeyPath` points outside git (`../ci/keys/eas-android-sa-key.json`), `track: internal`. **No Apple/Google credential value is committed.**

**EAS owns signing** (managed credentials — it generates/stores the iOS dist cert + provisioning profile, links the Apple account on first `eas build`). We do **not** bridge the Flutter Fastlane `match` repo into EAS — `match` stays with the Flutter app (R-5 bounded maintenance). Same production bundle id → EAS targets the existing App Store record (RN ships as an update). Two signing mechanisms coexist during migration; no shared state to corrupt.

## CI untouched — EAS is human-invoked

EAS Build/Submit/Update are **not** wired into CI; **no `.eas/workflows/`**. The native E2E keeps building via `expo prebuild` + Gradle/`xcodebuild`. Reasons: a CI `eas build` would be a _second_ build path to maintain and pay for (EAS Build minutes) for no new signal; dogfood cadence is human-driven; and the protected exact-SHA build/submit workflow and credential gates are still design work. The EAS project itself now exists.

- **Recorded debt:** a `.eas/workflows/` (or GH Action) that builds+submits the dogfood build on a tag/label — **trigger:** manual dogfood builds become a friction point.
- **Consequence accepted:** a broken `eas.json` is only caught when a human runs `eas build` (the first human verification step) — the EAS CLI requires login even for offline config validation.

## No Jest proof test

This is build/release _configuration_, not runtime app behavior — a fabricated "eas.json parses" Jest test would be cargo-cult. The enforcing gates (R-1) are the **EAS CLI** (validates `eas.json` at build time — human) and `expo config --json` (the variant diff, covered by the existing `tsc`/lint gates). The DoD's E2E axis is **N/A** for this config.

## Human prerequisites (inbox — not blockers)

The real `projectId`/`updates.url` link is complete. Account login/recovery, Apple credentials +
EAS-managed iOS signing, confirmation or recovery of Android signing, store submission credentials,
a store-distributed preview profile, actual `eas build`/`submit` runs, real-device installs and
TestFlight/Play internal groups remain. The [release readiness checklist](../releases/05-readiness-and-gaps.md)
owns their current status. The config is green without them; these unlock builds/installs.

## Deferred (recorded debt — not built)

- **No `.eas/workflows/` / CI EAS path** (trigger above).
- **No verified live EAS/store credentials or device install**; the real EAS project link is done.
- **No `match`→EAS bridge** (intentional).
