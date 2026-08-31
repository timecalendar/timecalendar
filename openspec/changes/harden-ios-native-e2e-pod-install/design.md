## Context

The iOS native E2E job currently delegates both Continuous Native Generation (CNG) and CocoaPods installation to `npx expo prebuild --platform ios --clean`. In exact-head runs `33373365380` and `33374795401`, CocoaPods refreshed the trunk CDN metadata and followed `cdn.cocoapods.org/Specs/...` to `cdn.jsdelivr.net/cocoa/Specs/...`, where `GoogleAppMeasurement/12.9.0` returned HTTP 400. Expo continued after the failed `pod install --repo-update --ansi`, left no `.xcworkspace`, and the next step failed later with Xcode exit 66.

The failure is outside the repository's dependency graph: the same podspec path is available from the official `CocoaPods/Specs` repository, and the jsDelivr GitHub-backed and raw GitHub representations were byte-identical during investigation. CocoaPods' CDN implementation stores specs under the local trunk repo path and reuses a valid local file when installation runs without repository refresh. Expo SDK 56 documents `prebuild --no-install`, which provides a supported seam for generating the clean native project before invoking CocoaPods explicitly.

This change touches the sensitive GitHub Actions surface. It must keep native E2E a real release-config development build, not weaken or skip any build/flow, and not rely on `~/.cocoapods` surviving from an earlier hosted-runner job.

## Goals / Non-Goals

**Goals:**

- Make pod installation an explicit, fail-closed stage with actionable logs.
- Recover from the diagnosed CocoaPods Specs jsDelivr alias HTTP-400 family using the same official spec path and a single bounded retry.
- Prove the fallback from an empty CocoaPods home and prove every unrelated failure remains terminal.
- Stop before Xcode whenever pod installation did not produce exactly one workspace.
- Preserve the development variant, development backend capability, loopback API URL, release configuration, server lifecycle, simulator install, Maestro flows, and failure artifacts.
- Obtain green Android and iOS jobs on the exact implementation head.

**Non-Goals:**

- Upgrade, downgrade, pin, or vendor Google/Firebase pods or JavaScript dependencies.
- Replace CocoaPods trunk with a permanent full `CocoaPods/Specs` git clone.
- Retry arbitrary network, repository-update, dependency-resolution, Ruby, or Xcode failures.
- Commit generated `mobile/ios`, change app/native/store configuration, or alter product behavior.
- Change Android build behavior, Maestro assertions/retries, backend lifecycle, workflow triggers, or deployment behavior.

## Decisions

## Decision 1 — Split CNG generation from explicit pod installation

Run iOS generation with `npx expo prebuild --platform ios --clean --no-install`, then invoke a repository-owned pod-install helper from the generated `mobile/ios` directory. Both actions receive `APP_VARIANT=development` and `BACKEND_ENVIRONMENT_CAPABILITY=development`; the later release build additionally retains `EXPO_PUBLIC_API_URL=http://localhost:3005`.

This uses Expo's documented CNG seam and gives the workflow the real CocoaPods exit status instead of accepting Expo's continuation after pod failure. Android remains on the existing combined prebuild path because the incident and fallback are iOS/CocoaPods-specific.

Alternative: keep Expo-managed pod installation and inspect for a workspace afterward. Rejected because it improves the error location but provides no recovery path and continues to obscure the original pod exit status.

Alternative: edit generated native files before running the same prebuild command. Rejected because `--clean` owns and recreates that tree.

## Decision 2 — Put the classifier and bounded recovery in a focused helper

Add a small Bash helper under `mobile/e2e/` rather than embedding a multi-branch parser in YAML. It first runs the normal `pod install --repo-update --ansi` and captures its complete output and exit status. Success returns immediately. Failure is eligible for fallback only when every actionable CocoaPods CDN error is an HTTP 400 for a podspec beneath the exact `https://cdn.jsdelivr.net/cocoa/Specs/` prefix and at least one such URL was found. Assertion logic rejects query strings, fragments, traversal, non-podspec paths, and mixed/unclassified errors.

For each distinct eligible path, the helper fetches `https://raw.githubusercontent.com/CocoaPods/Specs/master/<same Specs path>` with curl's fail/redirect/retry-safe transport flags into a temporary file, parses it as JSON, and verifies that its declared pod name and version match the path. It then places the validated file at the corresponding trunk CDN cache path created by the first attempt. A second and final `pod install --ansi` intentionally omits `--repo-update`, allowing CocoaPods to reuse the repaired local spec while preserving all other resolver behavior. The helper returns the retry status unchanged.

The fallback is path-preserving rather than version-pinning: normal CocoaPods resolution chooses the pod/version, the official Specs repository supplies the identical selected path, and no podspec enters the repository. Any fallback-source, validation, or retry failure remains red.

Alternative: retry the CDN command unchanged several times. Rejected because the same alias returned deterministic HTTP 400 across separate clean runners and the host; blind retries add latency without changing source.

Alternative: replace trunk with `https://github.com/CocoaPods/Specs.git`. Rejected because cloning the full Specs repository is disproportionate, slower, and changes the source mode for every pod.

Alternative: permanently pre-seed `GoogleAppMeasurement` 12.9.0. Rejected because it hard-codes the current symptom, can become stale, and cannot safely cover another broken official alias.

Alternative: treat every CDN/network error as retryable through GitHub. Rejected because broad classification could hide repository corruption, authentication, dependency resolution, rate limiting, or a different upstream incident.

## Decision 3 — Require exactly one workspace before Xcode

Immediately after successful pod installation, the workflow enumerates generated `mobile/ios/*.xcworkspace` entries and requires exactly one. Zero fails with an explicit prebuild/pod-install diagnostic; more than one fails as ambiguous rather than selecting alphabetically. The verified path is then used to derive the existing app scheme and invoke the unchanged Release simulator build.

Alternative: retain `ls -d *.xcworkspace | head -n1` in the build step. Rejected because an empty glob fails late and multiple workspaces are silently resolved by ordering rather than intent.

## Decision 4 — Test the control flow without requiring a live outage

Extend the deterministic shell regression with fake `pod` and `curl` commands plus an isolated temporary CocoaPods home. Cases cover: first-attempt success; one and multiple eligible 400 paths; byte placement beneath the isolated trunk cache; one retry without `--repo-update`; mixed, malformed, traversal, non-400, and ordinary resolver failures; fallback fetch/JSON/identity failures; retry failure propagation; and zero/multiple workspace rejection. Static assertions retain the three build environment values and the real native build/flow steps.

A small live-source validation exercises the reported 12.9.0 path: it records the current alias response, fetches the official GitHub-backed representation, validates name/version JSON, and compares the official raw/jsDelivr-GitHub content. The test must not require the alias to remain broken—during proposal work it had already recovered from 400 to 200—so deterministic fakes own the negative path and the live check owns source equivalence/availability.

Alternative: test only with grep assertions over the workflow. Rejected because static presence cannot prove classification, retry count, cache isolation, or exit-status propagation.

Alternative: require the live alias to return 400. Rejected because that makes CI depend on continuation of the upstream outage.

## Decision 5 — Update current guidance without a new ADR

Update the Architecture Book testing page, its changelog, and the agent environment handbook with the explicit CNG/pod-install boundary, narrow fallback, workspace guard, and exact-head proof rule. This is a reversible CI reliability mechanism for one external transport failure, not a costly product architecture decision; no new ADR is warranted.

## Risks / Trade-offs

- **[CocoaPods log wording changes and the classifier misses an eligible incident]** → Default to failure, keep the parser pinned to the observed URL/status family, and update only from captured runner evidence.
- **[A malicious or malformed log path escapes the cache root]** → Accept only the exact Specs prefix and podspec suffix, reject traversal/query/fragment input, normalize beneath a fixed cache root, and test adversarial paths.
- **[The official Specs branch changes between index refresh and fallback fetch]** → Validate pod name/version and let the second CocoaPods resolution/build remain authoritative; the fallback never invents a version or bypasses resolver checks.
- **[The first failed update leaves incomplete metadata beyond the reported specs]** → Repair every eligible 400 podspec URL in the captured output and retry once; any other missing metadata or resolver error remains terminal.
- **[The CocoaPods cache masks cold-run defects]** → Run deterministic tests with an empty isolated home and ensure the fallback creates only the paths it needs; do not accept a proof based solely on hosted cache restoration.
- **[GitHub raw availability becomes the next transient dependency]** → Keep it fallback-only, bounded, and fail-closed; normal installs continue to use CocoaPods CDN first.
- **[Sensitive workflow edits disturb backend or product proof]** → Assert triggers, job dependencies, release configuration, all three environment inputs, simulator install, complete Maestro invocation, and failure uploads remain unchanged.

## Migration Plan

1. Add the helper and focused regression, wire explicit iOS CNG/pod installation/workspace verification into the existing workflow, and update current docs on the same branch.
2. Run the deterministic helper/workflow tests, Bash syntax checks, formatting, OpenSpec validation, and a complete sensitive-surface diff audit locally.
3. Push the implementation head with the `run-e2e` label and record the workflow run whose Android and iOS jobs both succeed on that exact SHA. The iOS log must show the normal path or the narrowly classified fallback and a verified workspace before Xcode; either is honest proof after the alias recovered.
4. Rollback is a normal revert to Expo-managed pod installation. No data, dependency, native-project, or user migration exists.

## Open Questions

None. The live alias may be healthy or broken when implementation runs, but the deterministic failure simulation and exact-head native jobs make both states testable without changing the contract.
