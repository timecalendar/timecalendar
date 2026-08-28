# EAS / distribution

> R-1 pointer note: entries below are pointers plus the caveats tooling can't carry. The config is encoded in `mobile/eas.json` + `mobile/app.config.ts`; the operator guide is [`mobile/EAS.md`](../../../mobile/EAS.md); the load-bearing decisions are **ADR [006](./decisions/006-eas-distribution.md)** (fingerprint policy), **ADR [037](./decisions/037-self-hosted-ota-runtime.md)** (self-hosted OTA runtime), **ADR [040](./decisions/040-local-store-builds-and-store-preview.md)** (local store builds, store-distributed `preview`, no channel promotion), and **ADR [042](./decisions/042-iphone-ipad-portrait-contract.md)** (iPhone+iPad, portrait-only/full-screen).

For the plain-language release flow, signing custody and current readiness audit, see the
[mobile release guide](../releases/README.md). The `../ota/` folder is **exploration**, not
rules: it records how that decision was reached and is not maintained against the config. Where
it disagrees with this page or an ADR, this page wins.

## Three profiles, two identities

`mobile/eas.json` has `development` / `preview` / `production`, split along the `APP_VARIANT` line — **not** a third identity:

- **`development`** sets `env.APP_VARIANT = "development"` → `.dev` id, `timecalendar-dev` Firebase, dev network exceptions, `developmentClient: true`, simulator + APK. The only non-store profile, and it is a dev-client artifact rather than a release.
- **`preview`** and **`production`** **omit** `APP_VARIANT` so they take the production default in `app.config.ts` (real `fr.samuelprak.timecalendar`, `timecalendar-samuelprak` Firebase, no cleartext). Internal testers run the _real_ store bundle so their crashes/analytics land in production.
- `preview` vs. `production` differ by **`OTA_CHANNEL` and audience**, not identity and not artifact shape. Their profile `env` values stamp the matching `expo-channel-name` request header; `eas.json` contains no `channel` key, so local and EAS builds share one authority.

Each profile also sets an independent `BACKEND_ENVIRONMENT_CAPABILITY`: development, preview or
production respectively. Preview defaults to preproduction and exposes fixed
preproduction/production choices; production is locked to production. This input changes no app
identity, Firebase, OTA header/signing, artifact or submission setting (ADR 043).

**Both release profiles are `distribution: "store"`** (ADR 040): Android `app-bundle`, store `.ipa`, `autoIncrement`, with `cli.appVersionSource: "remote"` so EAS owns the build number. `preview` reaches TestFlight internal + Play internal testing; `production` reaches the App Store and the Play production track. There is deliberately **no directly-installable release artifact** — an ad hoc `.ipa` or a raw `.apk` cannot enter either store's testing track, and there is no audience for one.

**Variant-drift is the headline risk** — a `preview`/`production` profile accidentally carrying `APP_VARIANT=development` would ship the `.dev` id + dev Firebase + cleartext to testers or the store. The guard: only `development` sets the env var, and the `expo config --json` **variant diff** verifies it (production → prod id/Firebase, dev → `.dev`). Can't be a lint rule (config-shape, not source), hence this prose (R-1).

## iOS device-family and orientation contract

Every variant supports iPhone and iPad while remaining portrait-only and full-screen. The source
fields are `orientation: "portrait"`, `ios.supportsTablet: true`, and
`ios.requireFullScreen: true` in `mobile/app.config.ts`; full-screen mode deliberately disables
iPad Slide Over and Split View because Expo SDK 56 otherwise requires landscape orientations.
`mobile/app.config.test.ts` proves each resolved variant. From `mobile/`, run
`npm run verify:ios-device-contract` to generate a clean preview project in a disposable directory
and assert the application target has `TARGETED_DEVICE_FAMILY=1,2`, `UIRequiresFullScreen=true`,
and portrait-only effective iPad orientations. Generated `mobile/ios/` remains uncommitted.

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

Release configs are wired to `https://ota.timecalendar.app/manifest` with these request headers:

- `expo-channel-name`: required `OTA_CHANNEL`, exactly `preview` or `production`;
- `expo-app-id`: `e89170b9-5b32-44f0-8f78-33eadb60ec28`;
- `xprem-branch`: empty, so xprem's channel mapping selects the branch.

They embed `./codesigning/certs/certificate.pem` with key id `main` and algorithm
`rsa-v1_5-sha256`. Expo filters the certificate fields from public config output, but prebuild
embeds them in both native projects. The release config has no signing-disable switch. Development
sets `updates.enabled: false`, carries no release headers, and stays on Metro/dev-client. Publishing,
channel administration, rollout and rollback remain deliberately separate operator actions.

`updates.fallbackToCacheTimeout: 0` keeps cold launch non-blocking: the cached or embedded bundle
starts immediately while the update is checked and downloaded in the background. `OtaUpdateRuntime`,
the single owned `src/updates/` boundary, never displays progress or prompts. A downloaded
compatible bundle remains pending until the app has genuinely entered `background` and later
becomes `active`; it then makes one silent `reloadAsync()` attempt per JavaScript runtime. A
rejected attempt is recorded and left for a later cold launch rather than retried into a loop.

Channel promotion and progressive rollout remain operator actions in xprem; declarative
reconciliation must not overwrite incident-time rollback decisions. See ADR 037 for the rule.

## Signed xprem client seam

`expo-updates` is in `plugins`. `extra.eas.projectId` resolves from `EAS_PROJECT_ID` with committed
fallback `3b427ef6-1aae-4175-8217-ea447ee6df6b` (`@samuelprak/timecalendar`). The public EAS id is
retained only for Build/Submit linkage; changing it cannot redirect `updates.url` or xprem headers.

Production identity fails config resolution when `OTA_CHANNEL` is missing or not `preview` /
`production`. `eas.json` supplies the value for its two release profiles. Local release commands
must supply the same input explicitly; there is no silent production fallback.

`eas build --local` reads the selected profile and stamps its channel into the native updates
configuration. The signed iOS preview artifact must contain
`EXUpdatesRequestHeaders.expo-channel-name = preview` in `Expo.plist`; this is part of artifact
verification. Raw Xcode or Gradle builds are not a supported release path and provide no equivalent
channel guarantee.

## Fingerprint evidence (SDK 56)

Run from `mobile/`, substituting both platforms and both channels:

```bash
OTA_CHANNEL=preview BACKEND_ENVIRONMENT_CAPABILITY=preview node ./node_modules/expo-updates/bin/cli.js runtimeversion:resolve --platform ios --workflow managed --debug
OTA_CHANNEL=production BACKEND_ENVIRONMENT_CAPABILITY=production node ./node_modules/expo-updates/bin/cli.js runtimeversion:resolve --platform ios --workflow managed --debug
OTA_CHANNEL=preview BACKEND_ENVIRONMENT_CAPABILITY=preview node ./node_modules/expo-updates/bin/cli.js runtimeversion:resolve --platform android --workflow managed --debug
OTA_CHANNEL=production BACKEND_ENVIRONMENT_CAPABILITY=production node ./node_modules/expo-updates/bin/cli.js runtimeversion:resolve --platform android --workflow managed --debug
```

The post-iPad baseline and exact post-selector results on 2026-08-27 are:

| Platform | Lane       | Post-iPad baseline                         | Post-selector                              |
| -------- | ---------- | ------------------------------------------ | ------------------------------------------ |
| iOS      | preview    | `0fc2a429052003b4ee3042c6e55cb06b05176b89` | `528a496b844aa35f469d21ab8950c7db3f0b382b` |
| iOS      | production | `cc3763c96401c5920b66957a226cb7b6ce1c3a05` | `bc617dff81b2f6592fd4e54b51fbd3c9c8937fc0` |
| Android  | preview    | `ffa945e7c6723b2a93341bd7a9b5c4de891aa5f7` | `ed259cbefbe0cf6acc290ce242b547e69fb9a6a6` |
| Android  | production | `42ded73f46ab802da4472931415b66664ab96328` | `c6eafecd2ef61472381bfb8f663f36753918434f` |

All four lanes changed. Relevant combined-head sources are `expoConfig` (preview
`7c53cca87a4acf3d4d5375c4b13d080453086c2f`; production
`a7645628d2820dc74a037ff18a93e6060eee7fce`), `eas.json`
(`b4f0b05d403ddb435c0e9434e01a9330000c7285`) and package scripts
(`781272c9fdbd25824cf0c3e7f998c635d7d88a3e`). Therefore preview and production both require
fresh iOS and Android native builds before receiving this code. No `.fingerprintignore` was added
or broadened: excluding `app.config.ts` would weaken protection for plugins, signing and other
native config. No build, submission, publish, promotion or rollout was performed.

## Submit configuration, no secrets

`submit.preview` and `submit.production` commit the existing iOS App Store Connect app ID
(`ascAppId`). EAS holds the project-scoped App Store Connect API key used to authenticate the
upload. `eas.json` is not a shell template, so literal `$EXPO_*` strings are invalid field values;
an Apple ID is only supplied through the supported `EXPO_APPLE_ID` process environment when an
app-specific password flow actually needs it. Android `serviceAccountKeyPath` points outside git
(`../ci/keys/eas-android-sa-key.json`), `track: internal`. **No Apple/Google credential value is
committed.**

**EAS owns signing** (managed credentials — the iOS distribution cert + provisioning profile, and the Android upload key). The Flutter Fastlane `match` repo is **not** bridged into EAS; it stays with the Flutter app as a rollback asset (R-5 bounded maintenance). Same production bundle id → EAS targets the existing App Store record and Play listing (RN ships as an update, not a new app). Two signing mechanisms coexist during migration; no shared state to corrupt.

## CI config proof

`mobile/app.config.test.ts` resolves isolated development, preview and production configs and parses
`eas.json`. It enforces identity/Firebase selection, development OTA disablement, release endpoint,
headers and certificate metadata, EAS-link independence, invalid-channel rejection, profile
artifact guarantees, recursive absence of `channel` keys, and the tablet/full-screen/portrait
source contract. It also proves preview's exact App Store Connect destination, rejects an unresolved
app-id placeholder there, and preserves the production submit shape. Pair it with
`jq -e -r '.submit.preview.ios.ascAppId == "1479613630"' mobile/eas.json` from the repository root.
`cd mobile && npm run verify:ios-device-contract` is the generated-native proof.
The DoD's Maestro axis is N/A for build/runtime configuration; real signed delivery and rejection
stay in the human device ticket.

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
- **The `beta` profile and channel**, after the 4.0 cutover.
- **No verified live store credentials or device install**; the real EAS project link is done.
- **No `match`→EAS bridge** (intentional).
