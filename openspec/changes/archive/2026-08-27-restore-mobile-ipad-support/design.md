## Context

The legacy App Store binary advertises iPhone and iPad support (`TARGETED_DEVICE_FAMILY` values `1,2`). The Expo app omits `ios.supportsTablet`, so its generated Xcode target is iPhone-only and App Store Connect rejected the 4.0.0 preview as an update that removes a supported device family. The top-level Expo orientation is already `portrait`; enabling tablets must preserve that deliberate restriction in the generated iPad Info.plist behavior. Expo SDK 56 otherwise treats a tablet-enabled app as multitasking-capable and adds every iPad orientation unless `ios.requireFullScreen` is true.

`mobile/app.config.ts` is the source of truth. `mobile/ios/` is CNG output, gitignored, and never edited or committed. The app uses Expo's fingerprint runtime-version policy, and `docs/mobile/architecture-book/eas.md` plus `mobile/EAS.md` publish exact per-lane SDK 56 hashes, so a native config correction must refresh that evidence and require a new signed binary. Store build and submission remain separately authorized release operations.

## Goals / Non-Goals

**Goals:**

- Restore the product's iPhone+iPad contract in all Expo variants.
- Encode source-level and generated-native regression checks for device families and portrait-only orientation.
- Keep generated Xcode output disposable and out of git.
- Record the durable platform contract and the exact fingerprint/fresh-binary consequence.
- Give the Applier deterministic local checks and a CI-discovered source-config proof.

**Non-Goals:**

- Building, uploading, submitting, promoting, or installing a store artifact.
- Changing EAS profiles, credentials, certificates, Firebase files, workflows, dependencies, API/schema surfaces, infrastructure, or the legacy Flutter app.
- Adding landscape support, side-by-side iPad multitasking, iPad-specific layouts, or UI redesign.
- Adding the `run-e2e` label; native E2E remains on its established main-branch path.

## Decision 1 — Declare one iPhone+iPad, portrait-only contract in Expo source config

Set `ios.supportsTablet: true` and `ios.requireFullScreen: true` in `mobile/app.config.ts`, and retain the top-level `orientation: "portrait"`. The contract applies equally to development, preview, and production because device-family support is a product capability, not an identity or OTA-lane distinction. Full-screen mode deliberately forgoes iPad split-screen/multitasking: Expo SDK 56 requires all portrait and landscape orientations when multitasking is enabled, which conflicts with the accepted portrait-only behavior.

Do not set `TARGETED_DEVICE_FAMILY`, `UIRequiresFullScreen`, or orientation keys directly in an Xcode project or raw plist override. Expo owns the generated values from these source fields. Hand-editing generated native output was rejected because a clean prebuild would erase it and source review could not enforce it. A release-only tablet flag was rejected because development must exercise the same supported form factors as the shipped app. Leaving multitasking enabled was rejected because Expo would expand iPad support to landscape.

## Decision 2 — Split source-config proof from generated-native proof

Extend `mobile/app.config.test.ts` to assert `ios.supportsTablet === true`, `ios.requireFullScreen === true`, and `orientation === "portrait"` for development and each signed lane. This is the fast, CI-discovered regression test and makes the intended source contract obvious.

Add a repository-owned verification command under `mobile/scripts/` that creates disposable workspace output, runs a clean iOS prebuild with `OTA_CHANNEL=preview`, and asserts the generated application target has `TARGETED_DEVICE_FAMILY` set to `1,2`. It also reads the generated Info.plist, requires `UIRequiresFullScreen` to be true, and resolves the effective iPad orientation list (`UISupportedInterfaceOrientations~ipad` when present, otherwise the generic `UISupportedInterfaceOrientations` fallback) to portrait entries only, rejecting either landscape orientation. The command must clean only its own temporary directory and leave `mobile/ios/` untracked/absent.

Testing only the TypeScript config was rejected because it would not prove Expo SDK 56 maps the fields into the Xcode target. Committing the generated project was rejected because CNG makes it derived state. Grepping for an unconstrained `1,2` string was rejected; the check must bind the value to the app target build setting and evaluate full-screen plus effective iPad plist orientation semantics.

## Decision 3 — Make preview the generated-native proof lane

Run the clean generated-native assertion with `OTA_CHANNEL=preview`. Preview and production share the same production identity and native device-family/orientation source fields; they differ only in their OTA request header. Source-config tests still cover both lanes, while one clean preview prebuild is the smallest proof of Expo-to-Xcode generation for the rejected TestFlight path.

Prebuilding all variants was rejected as redundant and slow. Using development alone was rejected because the failure occurred in a store-distributed production-identity archive.

## Decision 4 — Record the platform-support rule in ADR 042 and current-state pointers

Create ADR 042 for the durable choice to support both iPhone and iPad while remaining portrait-only/full-screen, including the App Store continuity constraint, the iPad multitasking trade-off, CNG enforcement, verification commands, consequences, and revisit triggers. Index it and update `runtime.md`, `eas.md`, the Architecture Book changelog, `mobile/EAS.md`, and the Phase 01 step 11 pointer without duplicating implementation details.

This is ADR-worthy because removing a previously shipped device family is store-blocking and changes TimeCalendar's supported platform contract. Treating the rejection as a local config typo without a recorded rule was rejected because it would leave the same regression easy to repeat.

## Decision 5 — Refresh iOS fingerprint evidence and require a fresh binary

After the source change, resolve the SDK 56 managed-workflow fingerprints for iOS preview and production with the existing project-local commands. Replace stale exact iOS hashes in both authoritative tables, keep Android hashes unchanged unless measurement proves otherwise, and record the commands and results. Do not add or broaden `.fingerprintignore`.

The iPad support flag is native-affecting, so the corrected app is not OTA-compatible with the rejected or prior shell. Documentation must say that a fresh signed iOS preview binary is required, while this change itself performs no build or submission. Reusing the old hashes or manually pinning a runtime was rejected because it would contradict ADR 006's compatibility guarantee.

## Risks / Trade-offs

- **[Expo SDK output shape changes]** → Keep the verification semantic and target-bound, accepting harmless quoting and plist fallback differences while requiring the exact device-family set, full-screen flag, and effective portrait-only iPad orientations.
- **[The verification script leaves generated output behind]** → Generate only under a command-owned temporary directory, install a cleanup trap, and verify the repository working tree contains no native artifacts.
- **[Config lanes drift]** → Cover development, preview, and production independently in the focused test even though they share the same source field.
- **[Fingerprints are updated from an unclean tree]** → Run the documented project-local resolver after implementation from the intended branch state and record exact commands/results; do not weaken fingerprint inputs.
- **[The fix is mistaken for release authorization]** → Keep EAS build, upload, submission, credentials, and store-console actions explicitly out of scope in artifacts, docs, PR, and handoff.

## Migration Plan

1. Add the Expo tablet flag and source-config assertions.
2. Add and run the disposable preview prebuild verification against the generated Xcode target and Info.plist.
3. Recompute iOS preview/production fingerprints and synchronize ADR/current-state/operator/roadmap documentation.
4. Run the focused verification, repository-prescribed mobile gate, OpenSpec validation, and final sensitive-surface audit.
5. Push the implementation on the existing branch/PR. A separately authorized release operation later builds and submits a fresh preview binary.

Rollback is a normal source revert, but a reverted iPhone-only archive remains unsuitable for the existing App Store record. No deployed state changes during this engineering ticket.

## Open Questions

None. Product has explicitly retained iPhone and iPad support, portrait-only behavior is intentional, and store submission is outside this change.
