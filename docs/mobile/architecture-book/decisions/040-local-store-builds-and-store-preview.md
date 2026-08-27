# 040 — Build store binaries locally, distribute `preview` through the stores

## Status

Accepted. Supersedes decision 2 of ADR [006](./006-eas-distribution.md) (human-invoked EAS,
no CI path) and replaces its `preview` distribution shape. Decision 1 of ADR 006 — the
`fingerprint` runtime-version policy — is unchanged and remains in force.

## Context

ADR 006 chose EAS-managed signing with builds invoked by hand, and gave `preview` an
`internal` distribution so a dogfood artifact could be installed directly from a link. Three
facts have since changed the trade space:

1. **There is no direct-install audience.** Internal testers are reached through TestFlight
   internal and Play internal testing, which distribute the production app record and
   therefore require a store-distributed build: an `.aab` on Android and an App Store-signed
   `.ipa` on iOS. An ad hoc `.ipa` and a raw `.apk` cannot enter either track.
2. **A dedicated macOS host is available and is already a development machine.** macOS can
   build both platforms, so `eas build --local` produces the same signed artifacts EAS Build
   would, on hardware we already own.
3. **EAS Build is metered and local builds are not.** Expo's billing guidance names running
   builds locally as the documented alternative to upgrading a plan once its build quota is
   exhausted, so the local path carries no build quota and no queue.

Signing credentials remain EAS-managed: a local build downloads them at build time rather
than storing them on the host, and `eas submit --path` uploads a locally-produced binary.

## Decision

- **`preview` is a store-distributed profile.** `distribution: "store"`, Android `app-bundle`,
  store `.ipa`, `channel: "preview"`, remote auto-incremented build numbers. It keeps the
  production identity. No profile produces a directly-installable release artifact; the
  `development` profile remains the only non-store build and is a simulator/dev-client
  artifact, not a release.
- **Store binaries are built with `eas build --local` on the macOS host.** EAS remains the
  credential authority and the submission transport. Do not maintain a second Fastlane or
  raw `xcodebuild` release path alongside it.
- **Build and submit are invoked deliberately, never on merge.** A build is requested for a
  named commit and a named profile by a human or by a manually dispatched workflow. Nothing
  about pushing to `main` produces or uploads a binary.
- **Submission is a separate act from building.** Submit the exact artifact that was built
  and verified; never rebuild between verification and upload.
- **Release selection is by tag, not by branch.** An annotated tag on a commit already
  reachable from `main` identifies a release candidate. The repository keeps no long-lived
  release branch for mobile.
- **Channels are never promoted across.** A binary carries its channel from build time, so a
  `preview` build must not be promoted to a production track and a future `beta` build must
  not be promoted to production. Each lane is built from its own commit for its own channel.
  Play's console offers exactly this promotion; it is prohibited here.

## Consequences

- Every release artifact needs store-compatible signing, including internal previews. There
  is no longer a signing-free way to put a release build on a colleague's phone.
- Build caching is unavailable locally (Expo documents this), and the `node`, `fastlane`,
  `cocoapods`, `ndk` and `image` fields of `eas.json` are ignored by a local build, so the
  host's installed toolchain is the effective one and must be recorded per release.
- One platform per invocation: `--platform all` is unavailable locally.
- EAS-secret-visibility environment variables are not delivered to a local build and must be
  present in the host environment.
- An Expo access token with build and credential scope exists on the macOS host. That host is
  therefore a credential-bearing machine and is treated as one.
- The free Expo plan remains sufficient. Nothing in the release path depends on a paid tier.

## Revisit if

- A direct-install audience appears that store tracks genuinely cannot serve.
- Local build times or toolchain drift on the host cost more than EAS Build would.
- Release cadence grows enough that a deliberate, manually dispatched build becomes the
  bottleneck.
- The macOS host stops being available or stops being trusted with a scoped Expo token.
