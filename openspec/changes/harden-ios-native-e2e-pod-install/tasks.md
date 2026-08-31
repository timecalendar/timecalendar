## 1. Add the bounded CocoaPods fallback

- [x] 1.1 Add a Bash helper under `mobile/e2e/` that runs `pod install --repo-update --ansi`, preserves its complete output and exit status, returns immediately on success, and defaults every unclassified failure to terminal without retry.
- [x] 1.2 Implement the narrow fallback classifier: require at least one HTTP-400 podspec URL beneath exactly `https://cdn.jsdelivr.net/cocoa/Specs/`; reject mixed actionable errors, other statuses/hosts/paths, traversal, queries, fragments, and non-podspec candidates; deduplicate multiple eligible paths.
- [x] 1.3 For each eligible path, fetch the identical path from the official `CocoaPods/Specs` raw source into run-owned temporary storage, parse it as JSON, verify declared name/version against the path, and place it only beneath the configured trunk Specs cache root; add no podspec or generated native output to git.
- [x] 1.4 Retry exactly once with `pod install --ansi` (no repository refresh), propagate its status unchanged, clean temporary files on every exit, and print concise diagnostics that distinguish normal success, eligible recovery, rejected classification, fallback validation failure, and retry failure without exposing secrets.

## 2. Prove the fallback deterministically

- [x] 2.1 Add a focused shell regression using fake `pod`/`curl` executables and a fresh isolated CocoaPods home for every case; prove normal first-attempt success performs no fallback or retry.
- [x] 2.2 Prove one and multiple eligible alias HTTP-400 failures fetch and seed every distinct exact path, then invoke one retry without `--repo-update`; prove no test depends on the host or restored `~/.cocoapods` cache.
- [x] 2.3 Prove non-400, resolver, malformed, mixed, wrong-host/prefix/suffix, traversal/query/fragment, invalid JSON, name/version mismatch, fallback-fetch failure, and retry-failure cases remain non-zero, do not write outside the isolated cache, and never invoke a second retry.
- [x] 2.4 Validate the reported `Specs/e/3/b/GoogleAppMeasurement/12.9.0/GoogleAppMeasurement.podspec.json` path against the live CocoaPods alias and official GitHub-backed/raw representations: record the alias's current HTTP result, verify the official payload name/version, and compare the official representations byte-for-byte. Do not require the alias to remain HTTP 400; deterministic fakes own that negative path.

## 3. Make iOS generation and installation fail fast in CI

- [x] 3.1 Update only the iOS job in `.github/workflows/ci-mobile-e2e.yml` to run clean Expo generation with `--no-install`, then invoke the tested helper from generated `mobile/ios`; preserve the CocoaPods cache action as an optimization while ensuring correctness starts from an empty cache.
- [x] 3.2 Preserve and statically assert `APP_VARIANT=development` and `BACKEND_ENVIRONMENT_CAPABILITY=development` across iOS native generation/install/build, plus `EXPO_PUBLIC_API_URL=http://localhost:3005` at the Release bundle/build step; do not infer or weaken these values.
- [x] 3.3 Add an immediate guard requiring exactly one `mobile/ios/*.xcworkspace`, pass that verified workspace/scheme to the existing Release simulator `xcodebuild`, and prove zero or multiple workspaces stop before Xcode, simulator installation, or Maestro.
- [x] 3.4 Extend `mobile/e2e/test_ci_mobile_e2e.sh` (and the focused helper test where behavioral proof belongs) to retain workflow triggers, job dependencies, Release configuration, simulator install, complete Maestro invocation, server lifecycle, and failure artifact uploads while asserting the explicit pod boundary and workspace guard.

## 4. Update the reusable testing contract

- [x] 4.1 Update `docs/mobile/architecture-book/testing.md` with the explicit iOS CNG/pod-install boundary, normal-first and narrow HTTP-400 fallback, cold-cache requirement, single retry, exact workspace guard, and exact-head two-platform proof rule.
- [x] 4.2 Record the Architecture Book rule change in `docs/mobile/architecture-book/CHANGELOG.md`; do not add an ADR because this bounded, reversible CI transport recovery does not meet the costly-to-reverse threshold.
- [x] 4.3 Update `docs/agent-dev-environment.md` with the helper/test commands, live-path diagnostic, hosted-runner proof boundary, and failure interpretation; confirm no credential, console, or physical-device step exists, so no `(HUMAN: …)` inbox note is needed.

## 5. Local-green verification and sensitive-surface audit

- [x] 5.1 Run `bash -n` on every touched shell file, the focused pod-fallback regression, and `./mobile/e2e/test_ci_mobile_e2e.sh`; run ShellCheck if installed and record an explicit N/A if it is unavailable.
- [x] 5.2 Parse/validate `.github/workflows/ci-mobile-e2e.yml` with the repository's established workflow check and run Prettier on touched YAML/Markdown; confirm the three development-backend inputs and all existing native proof/failure-evidence steps remain present.
- [x] 5.3 Run `openspec validate harden-ios-native-e2e-pod-install` and `git diff --check`, then inspect the complete diff for secrets, broad retry behavior, stale/vendor podspecs, dependency/lockfile changes, generated `mobile/ios`, product/API/schema/native-store/deploy/Flutter changes, and unrelated edits.

## 6. CI proof on the exact implementation head

- [ ] 6.1 Push the implementation, add the existing `run-e2e` label to the same draft PR, and confirm the resulting `CI mobile E2E` run tests the exact pushed SHA rather than a merge/default-branch ref.
- [ ] 6.2 Inspect the iOS job log: confirm explicit clean generation and pod installation, either normal CDN success or only the narrowly classified official-spec fallback, exactly one workspace before `xcodebuild`, Release configuration, `APP_VARIANT=development`, `BACKEND_ENVIRONMENT_CAPABILITY=development`, and `EXPO_PUBLIC_API_URL=http://localhost:3005`.
- [ ] 6.3 Record direct `SUCCESS` links for both `Run mobile E2E (Android)` and `Run mobile E2E (iOS)` on that exact SHA before handing onward; a failed/cancelled job is not proof and must be repaired or honestly rerun without weakening or skipping native E2E.
