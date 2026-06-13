## Context

The skeleton has every cross-cutting system wired (API client, lint, tests, i18n, a11y,
Firebase, soon theming) but **no release path**. There is no `eas.json`, no `expo-updates`,
and no way to get the app onto a real device. Foundation step 11 makes dogfooding possible.

Constraints inherited from the Architecture Book and the Flutter app:

- **`APP_VARIANT` identity is fixed** (scaffold D4): production
  `fr.samuelprak.timecalendar` / scheme `timecalendar`; development
  `fr.samuelprak.timecalendar.dev` / scheme `timecalendar-dev`. The `ios`/`android`/`start`
  npm scripts already set `APP_VARIANT=development`. **The RN app ships as an update to the
  existing Flutter store app**, so the production bundle id / package must be byte-identical
  to what the stores already know.
- **Per-environment Firebase** (firebase change): `googleServicesFile` is variant-switched
  on `IS_DEV`. Any EAS profile that builds the production identity *must* run with
  `APP_VARIANT` unset/`production` so it picks the `timecalendar-samuelprak` files; dev
  profiles must set `APP_VARIANT=development`.
- **CNG**: `ios/`/`android/` are gitignored, generated, never hand-edited; all native config
  flows through `app.config.ts` + plugins. `expo-updates` config is no exception.
- **Existing native build path is prebuild, not EAS**: CI's native E2E uses `expo prebuild`
  + Gradle/`xcodebuild` (Architecture Book "E2E — Maestro → E2E builds are release-config").
  EAS is a *second*, human-invoked build path for distribution, not a replacement.
- **The Flutter app** signs iOS via **Fastlane `match`** (App Store provisioning) and
  submits Android with a **Play service-account JSON** (`ci/keys/fastlane-android-sa-key.json`).
  EAS has its own credential model (managed signing); we do **not** reuse `match` — EAS owns
  its credentials (see Decision 5).

I (the planner) cannot create an EAS project, log in, or supply credentials. The seam is
built now; the credential-bearing values are handed to the inbox.

## Goals / Non-Goals

**Goals:**
- A committed `eas.json` with three profiles (`development`, `preview`, `production`) whose
  identity/Firebase/network behavior matches the existing `APP_VARIANT` rules.
- An **internal-distribution** dogfood profile (`preview`) producing directly-installable
  artifacts (`.ipa` device build + `.apk`).
- `expo-updates` wired with a `runtimeVersion` policy and channel↔profile mapping, so OTA
  JS updates work once the EAS project exists.
- A `submit` skeleton so a human can `eas submit` after dropping in credentials.
- `tsc`/lint/Jest stay green; `expo config --json` parses under both variants.

**Non-Goals:**
- **No `.eas/workflows/` and no CI wiring of EAS Build** (Decision 4). EAS stays
  human-invoked this step.
- **No credentials, no `eas login`/`eas init`, no real `projectId`, no real-device install,
  no TestFlight/Play console setup** — all handed to the inbox (Decision 6).
- No reuse of the Flutter `match`/Fastlane signing (Decision 5).
- No new app behavior, no schemas (resist scope creep — roadmap risk note).

## Decisions

### D1 — Three profiles, mapped to the two variants, not three identities
`development` and `preview`+`production` split along the `APP_VARIANT` line, not a third
identity. `development` sets `env.APP_VARIANT = "development"` → `.dev` id, `timecalendar-dev`
Firebase, dev network exceptions, `developmentClient: true`. `preview` and `production` leave
`APP_VARIANT` unset (production identity, `timecalendar-samuelprak` Firebase, no cleartext).
The difference between `preview` and `production` is **distribution + artifact + channel**,
not identity — dogfooders run the *real* app so their crashes/analytics land in production
and TestFlight/Play-internal accept the bundle. *Alternative rejected:* a third `.preview`
identity — would need its own Firebase registration and would *not* exercise the real store
bundle, defeating "dogfood the thing you ship."

### D2 — Artifacts: dev = simulator+APK, preview = device ipa+apk (internal), production = ipa+aab (store)
- `development`: `ios.simulator: true`, `android.buildType: "apk"` — fast inner-loop installs,
  no signing needed for the simulator.
- `preview`: `distribution: "internal"`, iOS **device** build (real signing, installable via
  the Expo internal URL / ad-hoc / TestFlight-internal), `android.buildType: "apk"` (internal
  distribution requires `.apk`/`.ipa`, not `.aab`).
- `production`: `distribution: "store"`, `android.buildType: "app-bundle"` (`.aab` — Play
  store requirement), iOS store `.ipa`, `autoIncrement: true`.
*Rationale:* internal distribution by definition cannot serve an `.aab`; the store cannot
accept an internal ad-hoc `.ipa`. The artifact per profile is forced by its distribution.

### D3 — `runtimeVersion` policy: `fingerprint`
`{ "policy": "fingerprint" }` at the app level. The fingerprint policy bumps the runtime
version whenever anything that affects the native runtime changes — exactly the right
safety property for OTA: an OTA JS update is only ever delivered to a build whose native
layer is compatible, and any native-affecting change (a new config plugin, a dep with native
code, an SDK bump) automatically forces a new native build instead of a silently-incompatible
OTA. *Alternatives rejected:* `appVersion` — ties runtime to the human version string, so a
plugin change without a version bump could ship an incompatible OTA; `nativeVersion`/manual —
more bookkeeping, same or worse safety. For a skeleton that will churn native config feature
by feature, `fingerprint` is the least-footgun choice. (This is an ADR-worthy call — see the
Decision block lifted into `decisions/` later.)

### D4 — CI untouched; EAS is human-invoked this step
EAS Build is **not** wired into CI. Reasons: (1) the native E2E already builds via
`prebuild` + native tooling — adding `eas build` to CI would be a *second* build path to
maintain and pay for (EAS Build minutes) for no new signal; (2) dogfood cadence is
human-driven, not per-push; (3) wiring `.eas/workflows/` needs the EAS project to exist,
which is a human step anyway. So this step configures `eas.json` so a human runs
`eas build --profile preview` / `eas submit` / `eas update --channel preview` by hand.
*Recorded debt:* a `.eas/workflows/` (or GH Action) that builds+submits the dogfood build on
a tag/label is a natural later step; the trigger is "manual dogfood builds become a friction
point." *Alternative rejected:* wire CI now — premature; doubles the build surface before
there's a release rhythm to automate.

### D5 — EAS owns its credentials; do not reuse Flutter `match`
The Flutter app signs iOS via Fastlane `match` (a git-stored cert repo) and submits Android
via a service-account JSON. EAS has **managed credentials** (it generates/stores signing
assets on Expo's servers, or accepts a `credentials.json`). We let **EAS manage signing**
rather than bridging `match` into EAS — bridging is fragile and `match` is a Flutter-era
mechanism we're migrating *away* from. The production bundle id is identical, so EAS's
managed App Store provisioning targets the same app record; the human links the Apple
account during `eas credentials` / first `eas build`. *Consequence:* the iOS App Store
Connect app id (`ascAppId`) and Apple team id go in the `submit.production.ios` block via
**env vars** (mirroring the Flutter Appfile's `DEVELOPER_APP_IDENTIFIER` /
`APP_STORE_CONNECT_TEAM_ID` pattern) — never committed. Android `submit` references a
service-account key path supplied by the human (same key class the Flutter harness uses).

### D6 — Build the seam, inbox the secrets
`expo-updates` needs `updates.url` (`https://u.expo.dev/<projectId>`) and
`extra.eas.projectId`, both produced by `eas init` against a logged-in account — a human step.
The config in `app.config.ts` reads `projectId` from `process.env.EAS_PROJECT_ID` (or a clearly
marked placeholder) and derives `updates.url`, so `tsc`/`expo config --json` parse cleanly with
the value absent; `eas init` (human) fills the real value and may also write it into the config
directly. Everything credential- or console-bearing — `eas login`, `eas init`, Apple/Google
credentials, the actual `eas build`/`submit`/`update` runs, real-device install, TestFlight
internal + Play internal testing channel setup — goes to
`docs/react-native-migration/inbox/2026-06-13-eas-credentials.md` and is tagged
`(HUMAN: see inbox/...)` in tasks.md so the implementer skips-and-continues.

### D7 — Channel naming: `preview` (dogfood) and `production`
Two channels: `preview` for the internal dogfood track, `production` for store releases. The
`development` profile pins no channel in a way that gates it — a dev client can run updates
from any channel. *Rationale:* channel names mirror profile names (the EAS convention) so
`eas update --channel preview` is unambiguous; "dogfood" was considered but `preview` matches
the profile and the Expo docs' own naming, reducing cognitive load.

### D8 — No CI proof test (justified N/A)
Unlike i18n/a11y/firebase, this change ships **no runtime app behavior** — it is build and
release *configuration*. There is nothing for Jest to assert that the existing gates don't
already cover: `eas.json` is validated by the EAS CLI (human, at build time), and the
`app.config.ts` changes are covered by `tsc` + the manual `expo config --json` sanity check
(both variants). A fabricated "eas.json parses" test would be cargo-cult (R-1: encode where
it bites — here that's the EAS CLI and `expo config`, not Jest). The DoD's E2E axis is
**N/A for this change** with that reason. Recorded so the reviewer doesn't expect a proof test.

## Risks / Trade-offs

- **Production identity drift** → if a `preview`/`production` profile accidentally set
  `APP_VARIANT=development`, dogfood/store builds would carry the `.dev` id + dev Firebase +
  cleartext exception. Mitigation: only `development` sets the env var; `preview`/`production`
  omit it (production is the default branch in `app.config.ts`); the `expo config --json` diff
  between profiles is the verification (D8, mirrors the firebase change's variant-diff check).
- **`fingerprint` surprises** → a seemingly-JS change that touches a config plugin bumps the
  runtime version and forces a native build, "breaking" an expected OTA. Mitigation: this is
  the *intended* safety behavior; documented in the book section so it's not mistaken for a bug.
- **`expo-updates` without a real `projectId`** → `eas update` fails until `eas init` runs.
  Mitigation: that's a human task in the inbox; the *config* parses regardless, so CI is green
  and the implementer isn't blocked. The build profiles work for `eas build` even before
  Update is fully initialized (Update is opt-in per build via channel).
- **EAS managed signing vs Flutter `match`** → two signing mechanisms coexist during the
  migration (R-5: Flutter is bounded-maintenance). Low risk: same bundle id, different tool;
  the Flutter app keeps `match`, the RN app uses EAS. No shared state to corrupt.
- **No CI build path for EAS** → a broken `eas.json` is only caught when a human runs
  `eas build`. Accepted: dogfood is human-cadence; `eas build --profile preview` is the first
  human verification step (in tasks, HUMAN-tagged). Cheaper than maintaining a CI EAS job now.
