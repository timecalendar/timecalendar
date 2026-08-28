## 1. Restore the native E2E build contract

- [ ] 1.1 Update the Android `Prebuild Android (dev variant)` and `Build release APK` environment blocks in `.github/workflows/ci-mobile-e2e.yml` so each explicitly sets `APP_VARIANT=development`, `BACKEND_ENVIRONMENT_CAPABILITY=development`, and `EXPO_PUBLIC_API_URL=http://10.0.2.2:3005`; retain the current Gradle bounds, release target, install path, and artifacts.
- [ ] 1.2 Update the iOS `Prebuild iOS (dev variant)` and `Build Release simulator app` environment blocks so each explicitly sets `APP_VARIANT=development`, `BACKEND_ENVIRONMENT_CAPABILITY=development`, and `EXPO_PUBLIC_API_URL=http://localhost:3005`; retain the current Xcode Release simulator build, install path, server lifecycle, retry boundary, and artifacts.
- [ ] 1.3 Review the complete workflow diff and confirm it does not change `mobile/app.config.ts`, the production fail-closed default, backend endpoint allowlist, native/store identities, API/generated clients, server/schema, deploy/infrastructure, or Flutter surfaces.

## 2. Add focused workflow structure proof

- [ ] 2.1 Extend `mobile/e2e/test_ci_mobile_e2e.sh` with a step-scoped helper that isolates each of the four named prebuild/release-build blocks and requires exactly one development variant, exactly one development capability, and exactly one platform-correct local URL in each block.
- [ ] 2.2 Make the proof reject a missing/duplicate value and the opposite platform URL without weakening the existing Maestro pin, Gradle-bound, retry, failure-artifact, or server-log assertions; keep the proof invoked by both native jobs before device execution.
- [ ] 2.3 Run `bash -n mobile/e2e/test_ci_mobile_e2e.sh`, execute `./mobile/e2e/test_ci_mobile_e2e.sh`, and run ShellCheck when installed (record an explicit N/A otherwise).

## 3. Update binding and operator documentation

- [ ] 3.1 Update `docs/mobile/architecture-book/testing.md` so release-config native E2E builds require the explicit development backend capability with the development variant and platform URL, and add the rule change to `docs/mobile/architecture-book/CHANGELOG.md`; preserve ADR 038 unchanged because this correction introduces no new costly-to-reverse decision.
- [ ] 3.2 Update `mobile/e2e/README.md` and `docs/agent-dev-environment.md` build examples and CI contract to include `BACKEND_ENVIRONMENT_CAPABILITY=development` for Android and iOS.
- [ ] 3.3 Confirm the documentation adds no credential, device-install, or console-registration action; therefore no `(HUMAN: …)` migration inbox note is required.

## 4. Local-green verification

- [ ] 4.1 Resolve Expo config for Android and iOS with the complete three-input contract and assert `extra.appVariant=development`, `extra.backendEnvironmentCapability=development`, the development native identity, and each platform URL; separately confirm an omitted or malformed capability still resolves production.
- [ ] 4.2 Run the focused `mobile/app.config.test.ts` Jest suite, applicable YAML/Markdown/shell formatting checks, and `openspec validate restore-mobile-e2e-local-backend-capability`.
- [ ] 4.3 Run `git diff --check` and inspect the complete diff for only the workflow, focused proof, named documentation/Architecture Book updates, and this OpenSpec change; confirm no secrets or unrelated generated/native files are present.

## 5. Exact-head CI proof and handoff

- [ ] 5.1 Push the implementation head, apply the existing `run-e2e` PR label, and require the baseline check plus `Run mobile E2E (Android)` and `Run mobile E2E (iOS)` to succeed on that exact SHA; do not rerun an unchanged terminal failure, and let any later push retrigger the labeled workflow.
- [ ] 5.2 Inspect the successful Android and iOS logs far enough to confirm the unchanged seeded calendar import traverses the real platform-local server path before later B10 flows; retain ADR 038 terminal-failure semantics.
- [ ] 5.3 Record the exact commit SHA and direct workflow/job links in the issue handoff. No separate QA gate applies; the Reviewer performs fresh exact-head preflight and autonomously merges after green CI.
