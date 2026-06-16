# 006 — EAS distribution: fingerprint runtime policy, human-invoked builds

> Origin: the `add-mobile-eas` change, design D3 + D4 (foundation roadmap step 11).
> Lands two load-bearing distribution decisions; the full profile/channel/submit
> layout lives in the Architecture Book "EAS / distribution" and `mobile/EAS.md`.

## Status

Accepted.

## Context

Foundation step 11 gives `mobile/` its first release path (`eas.json`, `expo-updates`,
build profiles). Two of its choices are load-bearing — copied by every later release and
costly to reverse — and so earn an ADR (R-4):

1. **Runtime-version policy** for `expo-updates`. The policy decides when an over-the-air
   JS update is allowed to reach an installed build. Get it wrong and an OTA can land on a
   build whose native layer is incompatible (crash), or every trivial change forces a full
   native rebuild (no OTA benefit). The trade space: `appVersion` (runtime = the human
   version string), `nativeVersion`/manual (hand-maintained), or `fingerprint` (computed
   from everything that affects the native runtime).
2. **Whether EAS Build is wired into CI** now. The native E2E already builds via
   `expo prebuild` + Gradle/`xcodebuild`. Adding `eas build` to CI would be a second build
   path — more maintenance and EAS Build minutes — before any release rhythm exists.

## Decision

1. **`runtimeVersion: { policy: "fingerprint" }`.** The fingerprint bumps the runtime
   version whenever anything native-affecting changes (a config plugin, a dep with native
   code, an SDK bump), so an OTA is only ever delivered to a compatible build and any
   native change automatically forces a fresh native build. Rejected: `appVersion` (a
   plugin change without a version bump could ship an incompatible OTA) and manual
   `nativeVersion` (same-or-worse safety, more bookkeeping). For a skeleton that will churn
   native config feature-by-feature, fingerprint is the least-footgun choice.
2. **EAS Build/Submit/Update stay human-invoked; CI is not changed.** No `.eas/workflows/`
   is added; the native E2E keeps building via `prebuild`. A human runs
   `eas build --profile preview` / `eas submit` / `eas update --channel preview` by hand.
   Rejected: wiring CI now — premature; doubles the build surface before there's a release
   cadence to automate, and `.eas/workflows/` needs an EAS project that is itself a human
   step.

## Consequences

- An expected OTA that "doesn't apply" is usually a native-config change, not a bug — the
  fingerprint did its job. Documented in the book so it isn't mistaken for breakage.
- A broken `eas.json` is only caught when a human runs `eas build` (the EAS CLI requires
  login even for offline validation) — accepted: dogfood is human-cadence, and the first
  `eas build --profile preview` is the first human verification step.
- Two signing mechanisms coexist during the migration (Flutter `match`, EAS managed) — no
  shared state to corrupt (R-5 bounded Flutter maintenance).
- `expo config --json` (the variant diff) and `tsc`/lint are the only CI gates that touch
  this config; there is no Jest proof test (the change ships config, not runtime behavior).

## Revisit if

- Manual dogfood builds become a friction point → wire `.eas/workflows/` (or a GH Action)
  to build+submit on a tag/label (recorded debt).
- The fingerprint policy forces native rebuilds so often that OTA stops paying off, or a
  case appears where a hand-pinned runtime version is genuinely needed.
