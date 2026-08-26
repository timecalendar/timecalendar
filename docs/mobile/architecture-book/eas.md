# EAS / distribution

> R-1 pointer note: entries below are pointers plus the caveats tooling can't carry. The config is encoded in `mobile/eas.json` + `mobile/app.config.ts`; the operator guide is [`mobile/EAS.md`](../../../mobile/EAS.md); the load-bearing decisions are **ADR [006](./decisions/006-eas-distribution.md)** (fingerprint policy), **ADR [037](./decisions/037-self-hosted-ota-runtime.md)** (self-hosted OTA runtime) and **ADR [040](./decisions/040-local-store-builds-and-store-preview.md)** (local store builds, store-distributed `preview`, no channel promotion).

For the plain-language release flow, signing custody and current readiness audit, see the
[mobile release guide](../releases/README.md). The `../ota/` folder is **exploration**, not
rules: it records how that decision was reached and is not maintained against the config. Where
it disagrees with this page or an ADR, this page wins.

## Three profiles, two identities

`mobile/eas.json` has `development` / `preview` / `production`, split along the `APP_VARIANT` line — **not** a third identity:

- **`development`** sets `env.APP_VARIANT = "development"` → `.dev` id, `timecalendar-dev` Firebase, dev network exceptions, `developmentClient: true`, simulator + APK. The only non-store profile, and it is a dev-client artifact rather than a release.
- **`preview`** and **`production`** **omit** `APP_VARIANT` so they take the production default in `app.config.ts` (real `fr.samuelprak.timecalendar`, `timecalendar-samuelprak` Firebase, no cleartext). Internal testers run the _real_ store bundle so their crashes/analytics land in production.
- `preview` vs. `production` differ by **channel and audience**, not identity and not artifact shape.

**Both release profiles are `distribution: "store"`** (ADR 040): Android `app-bundle`, store `.ipa`, `autoIncrement`, with `cli.appVersionSource: "remote"` so EAS owns the build number. `preview` reaches TestFlight internal + Play internal testing; `production` reaches the App Store and the Play production track. There is deliberately **no directly-installable release artifact** — an ad hoc `.ipa` or a raw `.apk` cannot enter either store's testing track, and there is no audience for one.

**Variant-drift is the headline risk** — a `preview`/`production` profile accidentally carrying `APP_VARIANT=development` would ship the `.dev` id + dev Firebase + cleartext to testers or the store. The guard: only `development` sets the env var, and the `expo config --json` **variant diff** verifies it (production → prod id/Firebase, dev → `.dev`). Can't be a lint rule (config-shape, not source), hence this prose (R-1).

## `runtimeVersion: { policy: "fingerprint" }`

In `app.config.ts`. An OTA JS bundle is delivered **only** to a build whose native runtime fingerprint matches; any native-affecting change (new config plugin, a dep with native code, an SDK bump) changes the fingerprint and **forces a fresh native build** instead of a silently-incompatible OTA. This is the intended safety property — **an expected OTA that "doesn't apply" usually means the change touched native config**, not a bug. Chosen over `appVersion` (a plugin change without a version bump could ship an incompatible OTA) and manual `nativeVersion` (more bookkeeping, no better safety). Load-bearing for a skeleton that churns native config feature-by-feature → ADR [006](./decisions/006-eas-distribution.md), decision 1, still in force.

A fingerprint move does **not** trigger anything on its own. Builds are requested deliberately (below), so a native change means "the next build for this channel must be fresh", not "rebuild every channel now".

## Store binaries are built locally

`eas build --local` on the macOS host produces the same signed artifacts EAS Build would, for **both** platforms (macOS can build iOS and Android). EAS stays the **credential authority** — a local build downloads the managed credentials at build time rather than storing them on the host — and the **submission transport**, via `eas submit --path`. Expo documents running builds locally as the supported alternative once a plan's build quota is exhausted, so this path consumes no build quota and no queue, and the free Expo plan is sufficient for the whole release process.

Consequences the tooling won't tell you (ADR 040):

- **Build caching is unavailable locally.** Expected; a release build is occasional, not a CI inner loop.
- **`node` / `fastlane` / `cocoapods` / `ndk` / `image` in `eas.json` are ignored.** The host's installed toolchain is the effective one, so **record the host's Xcode, Node, JDK and CocoaPods versions with each release**, not the `eas.json` values.
- **One platform per invocation** — `--platform all` is unavailable locally.
- **EAS environment variables with `Secret` visibility are not delivered**; set them in the host environment.
- The host holds an Expo token with build + credential scope and is therefore a credential-bearing machine.

Do **not** add a second release path (raw Fastlane, hand-driven `xcodebuild`) alongside this one.

## Builds are deliberate, and releases are tags

Nothing about merging to `main` builds or uploads a binary. A build is requested for a **named commit and a named profile**, by a human or a manually dispatched workflow. Release candidates are identified by an **annotated tag on a commit already reachable from `main`** — `mobile/` keeps no long-lived release branch, and the repository's legacy `production` branch is not part of the mobile release path.

Submission is a separate act from building: submit **the exact artifact that was verified**, and never rebuild between verification and upload. A rebuild can resolve different packages, take a new build number, or pick up changed remote config, so an approval that named one artifact no longer applies to it.

## Channels mapped to profiles — and never promoted

Two channels today: `preview` (internal testers) and `production` (store). A third, `beta` (opted-in students, TestFlight external + Play closed testing), is planned **after** the 4.0 cutover, because 4.0 ships to everyone at parity and only later features go to beta first. Channel names mirror profile names (the EAS convention) so the publish command is unambiguous.

**A binary carries its channel from build time, so channels are never promoted across.** Promoting a `preview` build to a production track would leave store users receiving internal updates; promoting a future `beta` build to production would leave them on the beta channel. **Play's console offers exactly this promotion and it is prohibited here** — each lane is built from its own commit, for its own channel, and submitted to its own track. The only supported "promotion" is within the production lane: a production-channel candidate verified through TestFlight/Play internal is the artifact that goes to review and rollout.

## Self-hosted OTA and silent application

ADR [037](./decisions/037-self-hosted-ota-runtime.md) ratifies self-hosted xprem with Cloudflare
R2 assets, the existing production Postgres service as its control plane, and signed updates.
ClickHouse is deliberately omitted because Crashlytics remains the client observability system.

The deployed control plane is live at `https://ota.timecalendar.app`. Its `TimeCalendar` app UUID
is `e89170b9-5b32-44f0-8f78-33eadb60ec28`, and xprem v3.1.2 uses its database-managed per-app
signing key as the single trust root. The exported public certificate is committed at
`mobile/codesigning/certs/certificate.pem`; its SHA-256 fingerprint is
`D9:24:B6:3E:67:2D:0F:D3:3D:28:F9:C9:24:C5:33:89:62:8E:83:3B:92:94:08:50:01:66:1B:E8:6F:4D:64:4A`.
The private key stays encrypted in xprem's database-key store and is never committed. Do not
generate a separate Expo key pair: it would create an unrelated trust root that xprem does not use.

These are available public inputs, not completed client wiring. `updates.url` still points at the
hosted default until the downstream delivery change configures the endpoint, request headers,
channel, app identifier and certificate verification. Publishing automation also remains deferred.

`updates.fallbackToCacheTimeout: 0` keeps cold launch non-blocking: the cached or embedded bundle
starts immediately while the update is checked and downloaded in the background. `OtaUpdateRuntime`,
the single owned `src/updates/` boundary, never displays progress or prompts. A downloaded
compatible bundle remains pending until the app has genuinely entered `background` and later
becomes `active`; it then makes one silent `reloadAsync()` attempt per JavaScript runtime. A
rejected attempt is recorded and left for a later cold launch rather than retried into a loop.

Channel promotion and progressive rollout remain operator actions in xprem; declarative
reconciliation must not overwrite incident-time rollback decisions. See ADR 037 for the rule.

## The initialized `expo-updates` project seam

`expo-updates` is in `plugins`; `updates.url` and `extra.eas.projectId` are derived from `easProjectId` = `process.env.EAS_PROJECT_ID` ?? the **committed real id** (`eas init` produced `@samuelprak/timecalendar`, projectId `3b427ef6-1aae-4175-8217-ea447ee6df6b`). The id is **not a secret** — it ships in the binary and the EAS project is public-by-id — so committing it as the fallback means a fresh clone / a CI build works with no env. (An earlier **zero-UUID placeholder** was wrong: a fake-but-present id makes EAS believe the project is already linked and **refuse `eas init`** — "Project already linked … Experience with id … does not exist". `eas init` was run with the id left `undefined`, which let it create and link the fresh project; the returned id is now the committed fallback.) `tsc`/lint/Jest don't read `projectId`, so CI `test-mobile` is unaffected.

**A locally-built binary does not read `eas.json`,** so it carries **no channel** and silently receives no updates. The fix is `updates.requestHeaders` in `app.config.ts` (`expo-channel-name`), with the open question of whether that feeds the fingerprint — verify on a device before relying on it. Until it lands, treat channel membership of a local build as unproven.

## Submit skeleton, no secrets

`submit.production` is structure only: iOS `appleId`/`ascAppId`/`appleTeamId` read from `$EXPO_APPLE_ID`/`$EXPO_ASC_APP_ID`/`$EXPO_APPLE_TEAM_ID`; Android `serviceAccountKeyPath` points outside git (`../ci/keys/eas-android-sa-key.json`), `track: internal`. **No Apple/Google credential value is committed.**

**EAS owns signing** (managed credentials — the iOS distribution cert + provisioning profile, and the Android upload key). The Flutter Fastlane `match` repo is **not** bridged into EAS; it stays with the Flutter app as a rollback asset (R-5 bounded maintenance). Same production bundle id → EAS targets the existing App Store record and Play listing (RN ships as an update, not a new app). Two signing mechanisms coexist during migration; no shared state to corrupt.

## No Jest proof test

This is build/release _configuration_, not runtime app behavior — a fabricated "eas.json parses" Jest test would be cargo-cult. The enforcing gates (R-1) are the **EAS CLI** (validates `eas.json` at build time — human) and `expo config --json` (the variant diff, covered by the existing `tsc`/lint gates). The DoD's E2E axis is **N/A** for this config.

## Human prerequisites (inbox — not blockers)

The EAS project link and public xprem bootstrap inputs are complete, and the Android upload key is
held and backed up. The app still uses the hosted `updates.url` until downstream client wiring lands.
Remaining: Apple credential setup + EAS-managed iOS signing, EAS remote version counters initialized
from the live store consoles, store submission credentials, TestFlight/Play internal tester groups,
and the first real `eas build --local` / `eas submit` / device install. The
[release readiness checklist](../releases/05-readiness-and-gaps.md) owns their current status. The
config is green without them; these unlock builds and installs.

## Deferred (recorded debt — not built)

- **No manual-dispatch build workflow yet** — builds are run by hand on the host until one exists.
- **`updates.requestHeaders` channel stamping** for locally-built binaries (above).
- **The `beta` profile and channel**, after the 4.0 cutover.
- **No verified live store credentials or device install**; the real EAS project link is done.
- **No `match`→EAS bridge** (intentional).
