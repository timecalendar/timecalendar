## Why

The exact-head native proof for the development-backend repair cannot reach an iOS product verdict because CocoaPods' CDN redirects one required `GoogleAppMeasurement` 12.9.0 podspec to a jsDelivr alias that returned HTTP 400 on two clean hosted-runner attempts. Expo reported prebuild completion despite the failed pod install, so the workflow continued without an Xcode workspace and obscured the infrastructure failure behind a later `xcodebuild` exit 66.

## What Changes

- Separate clean iOS native-project generation from dependency installation, then run CocoaPods as an explicit, observable workflow action.
- Attempt normal CocoaPods resolution with repository refresh first. Only if that attempt fails exclusively on CocoaPods Specs URLs redirected to the `cdn.jsdelivr.net/cocoa/Specs/` alias with HTTP 400, obtain those same podspec paths from the official `CocoaPods/Specs` repository, validate them, seed the fresh CocoaPods CDN cache, and retry once without repository refresh.
- Fail immediately for every unclassified pod error, failed fallback fetch or validation, failed retry, or missing generated `.xcworkspace`; never advance to `xcodebuild` without a real workspace.
- Preserve the release-config development build and its explicit `APP_VARIANT=development`, `BACKEND_ENVIRONMENT_CAPABILITY=development`, and `EXPO_PUBLIC_API_URL=http://localhost:3005` inputs.
- Extend the deterministic workflow regression to prove the narrow fallback classifier, cold-cache behavior, one-retry bound, fail-closed paths, workspace guard, and retained development-backend wiring.
- Update current testing and agent-environment guidance with the explicit iOS prebuild/pod-install boundary and its strict fallback contract.
- Require an exact-change-head workflow run in which both native jobs are green before the infrastructure repair is considered complete.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-e2e`: Require the iOS native job to distinguish CNG generation from pod installation, recover narrowly from the diagnosed CocoaPods CDN alias HTTP-400 failure without masking dependency-resolution errors, fail fast when no workspace exists, preserve the development-backend build contract, and record both-platform exact-head proof.

## Impact

- `.github/workflows/ci-mobile-e2e.yml` — sensitive CI surface; iOS generation, CocoaPods resolution, environment propagation, and build guards change. Reviewer must confirm the fallback cannot turn an ordinary pod failure into success and that the resulting native app still targets the development backend.
- `mobile/e2e/test_ci_mobile_e2e.sh` and a narrowly owned helper/test if needed — deterministic workflow and fallback regression proof.
- `docs/mobile/architecture-book/testing.md` and `docs/agent-dev-environment.md` — reusable CI contract and operator guidance.
- No product behavior, package/dependency version, generated `mobile/ios` output, `mobile/app.config.ts`, EAS/Firebase/store configuration, OpenAPI/generated client, server schema/migration, deployment infrastructure, or legacy Flutter code changes are in scope.
- No stale Google pod is pinned or vendored. The fallback retrieves the exact path selected by normal CocoaPods resolution from CocoaPods' official Specs repository and remains terminal if that source or the subsequent install fails.
