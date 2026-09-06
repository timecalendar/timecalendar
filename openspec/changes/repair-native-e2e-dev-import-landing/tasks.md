## 1. Restore the e2e build's local backend

- [x] 1.1 Add `BACKEND_ENVIRONMENT_CAPABILITY: development` beside `APP_VARIANT: development` on the Android prebuild, Android release-APK, iOS prebuild, and iOS release-simulator steps of `.github/workflows/ci-mobile-e2e.yml`; change no job, trigger, runner, permission, secret, or step.
- [x] 1.2 Comment the Android build step with why the pairing is load-bearing — an unset capability parses to `production` and discards the baked URL — and cross-reference it from the iOS step.

## 2. Cover the diagnosed cause

- [x] 2.1 Add `mobile/ci-e2e-build-env.test.ts`, driving each workflow step that bakes `EXPO_PUBLIC_API_URL` through the real `parseBackendEnvironmentCapability` → `parseBackendEnvironment` → `resolveBackendApiUrl` chain and asserting the resolved URL is the baked local URL.
- [x] 2.2 Pin the extracted step **name and** URL list, so a workflow edit that matches no steps — or that shifts a step boundary and lets a release step inherit a prebuild step's capability — fails instead of passing vacuously.
- [x] 2.3 Confirm the test fails against the pre-fix workflow and passes after, so it is proven to discriminate rather than merely to pass. Run as a five-mutation matrix (drop Android capability; wrong lane; boundary drift; drop capability *and* drift; drop iOS capability), each expected red, with a green baseline either side. The fourth mutation initially stayed **green** — the URL-only guard of 2.2 let the absorbed release step borrow the prebuild step's capability, hiding the precise regression this change exists for — which is what forced the name pinning above.

## 3. Keep the migration hardening on its own merits

- [x] 3.1 Retain the single-flight `runMigrations()` and the import seam's readiness wait, with their existing focused tests.
- [x] 3.2 Remove every claim that they repair the native E2E failure, in the proposal, the design, and the change name.

## 4. Local-green verification

- [ ] 4.1 Run `cd mobile && npm run lint`, `npx tsc --noEmit`, and the focused Jest suites for the new test plus the migration/import-seam suites.
- [ ] 4.2 Run `openspec validate repair-native-e2e-dev-import-landing --strict` and `git diff --check`; inspect the diff for secrets, generated native output, and unrelated changes.

## 5. Exact-head native proof

- [ ] 5.1 Push one commit carrying the workflow variables, the test, and the corrected OpenSpec artifacts, then trigger the native path on that exact head.
- [ ] 5.2 Read the result at **flow level on both jobs** — not at job level. `activity/import-baseline.yaml` reaching Calendar on Android *and* iOS is this change's acceptance; a later flow failing for a pre-existing reason is separate work to attribute and route, not to absorb.
- [ ] 5.3 Record the direct job links and exact SHA in the issue/PR evidence before Reviewer handoff.
