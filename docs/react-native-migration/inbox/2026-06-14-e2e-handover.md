# Handover — drive mobile Maestro E2E to green (loop mode)

> For a loop-mode agent on a host that **has iOS simulators + an Android emulator**.
> This agent has **carte blanche**: it may run any command, push, and **merge PRs**.
> Paste the block below into `/loop`, or run the agent directly with it.

---

## Loop prompt

```
Drive the mobile Maestro E2E failures to green on this host (which HAS iOS simulators + an Android emulator — use them; CI couldn't). Loop until both the iOS and Android E2E legs pass in CI, then merge the fix(es) and STOP with a final report. You have CARTE BLANCHE: run any command, build/install on the simulators+emulator, push, rebase, and merge PRs as you see fit.

## Mission
Two open PRs fix the mobile E2E pipeline, both still red:
- PR #156 (branch `fix/ios-e2e-driver-startup-timeout`) — CI-config only: sets `MAESTRO_DRIVER_STARTUP_TIMEOUT=300000` on the iOS E2E job in `.github/workflows/ci-mobile-e2e.yml`. iOS driver cold-start on the macos-26 runner takes ~3min and exceeds Maestro's default startup window, so iOS dies before any flow runs.
- PR #157 (branch `wt/android-e2e-flow-fix`, labeled `run-e2e`) — app code: wraps each `@expo/ui` `<Picker>` in `settings-screen.tsx` in an RN-core `<View testID=...>` (Android Picker drops testID), and passes `presentation="inline"` to both `DateTimePicker`s in `personal-event-form-screen.tsx` (Android defaults to a mount-time modal dialog that hides the form). iOS already passed these flows; the fixes only bring Android up to the iOS path.

Latest state (verify it's still current — re-check at the start of each loop):
- #157 run 27504810797: BOTH "Run mobile E2E (iOS)" and "Run mobile E2E (Android)" FAILED.
- KEY INSIGHT to confirm: #157's branch does NOT contain #156's iOS-timeout fix, so the iOS leg of #157 is expected to fail for #156's reason (driver cold-start), independent of the Android app fix. The two fixes likely need to BOTH be present for a fully-green E2E run. You decide how to combine them — rebase/cherry-pick #156's one-line env change into #157, merge #156 first then rebase #157, or whatever lands a single fully-green E2E. Pick the cleanest path and execute it.

## What only this host can do
CI verified nothing locally (no KVM). This host can actually build+install the dev-variant binary and run the flows on a real simulator/emulator. The Android flow fix (#157) is fully locally verifiable — that's the highest-value action. The iOS driver-timeout (#156) is a CI-cold-start phenomenon that may NOT reproduce locally (simulator already booted), so for #156 the real proof is CI on macos-26 — but at minimum confirm locally that the iOS flows still pass and #156 breaks nothing.

## Ground truth first (before changing code)
1. Re-pull fresh failure artifacts to confirm the iOS failure is the driver-startup race (not a flow assertion) and the Android failure is a flow assertion:
   `gh run view 27504810797 --json jobs` then download artifacts:
   `gh run download 27504810797 -n maestro-debug-android -D /tmp/e2e-android` (and `-n maestro-debug-ios`). Read the view-hierarchy dumps + screenshots.
2. If artifact names differ, list them: `gh run view 27504810797 --log` / check the workflow's upload step names.

## Local verification loop (Android — the verifiable one)
Toolchain gotchas on this host (from prior sessions — set these or builds fail):
- `export JAVA_HOME=<JDK 17>` (SDKMAN default is 25, which breaks Gradle), `export ANDROID_HOME=...` exported.
- Maestro on PATH (`curl -fsSL https://get.maestro.mobile.dev | bash`); it's JVM-based.
- Use `pgrep`, not `ps`, under the rtk shell hook.

Steps:
1. `cd mobile && git checkout wt/android-e2e-flow-fix` (worktree branch — handle accordingly; check `git worktree list`).
2. Boot ONE Android emulator (Maestro auto-detects a single running device).
3. Build+install the release-config dev-variant with the emulator host baked in:
   `APP_VARIANT=development EXPO_PUBLIC_API_URL=http://10.0.2.2:3005 npx expo run:android --variant release`
4. Run the harness: `./e2e/run_e2e.sh` (boots+seeds the NestJS server via ci/e2e-server.sh, runs `.maestro/`, tears down). It does NOT build/install — the binary must already be on the device.
5. Confirm `personal-events`, `settings`, and `schools` flows all pass. If a flow still fails, read the Maestro hierarchy dump, fix minimally (match the working iOS path; NO per-platform selectors; do NOT edit the `.maestro/*.yaml`), re-run.

Repeat for iOS to confirm no regression:
   `APP_VARIANT=development EXPO_PUBLIC_API_URL=http://localhost:3005 npx expo run:ios --configuration Release`, then `./e2e/run_e2e.sh`.

## After local green
- Run `npx tsc --noEmit`, `npm run lint`, `npm test -- --coverage` in `mobile/` — all must stay green.
- Commit any new fix to the right branch, push, and let the labeled CI E2E run. Poll the run; the real macos-26 / KVM proof is CI.
- Once CI shows BOTH E2E legs green, MERGE the fix(es) (you have carte blanche). Combine #156 + #157 however lands a single green pipeline; clean up branches/labels as needed.

## Guardrails (quality, not permission — you may merge)
- Keep changes minimal and cross-platform: only bring Android in line with the already-passing iOS behavior. No per-platform selectors, no touching the Maestro YAMLs unless an assertion is genuinely wrong.
- The app stays iOS+Android only; respect the chrome-wrapper seam (@expo/ui only through src/components/chrome/).
- Follow the repo's commit/PR conventions (Co-Authored-By trailer; conventional commit messages).

## Loop exit
Stop the loop and write a final summary when EITHER: both E2E legs are green in CI and the fix(es) are merged, OR you're genuinely blocked (e.g. a real @expo/ui upstream bug with no minimal cross-platform fix, or a host/toolchain failure you can't resolve). In the blocked case, state exactly what's wrong and what you tried.
```

---

## Reference snapshot (as of 2026-06-14, verify before acting)

| PR | Branch | Scope | Latest E2E |
|----|--------|-------|-----------|
| #156 | `fix/ios-e2e-driver-startup-timeout` | CI: `MAESTRO_DRIVER_STARTUP_TIMEOUT=300000` on iOS job | run 27504221074 — failed |
| #157 | `wt/android-e2e-flow-fix` (label `run-e2e`) | App: Picker `testID` View-wrap + `DateTimePicker presentation="inline"` | run 27504810797 — iOS + Android both failed |

Android failures from run 27501204669 (on `main`):
```
[Failed] personal-events  (id: personal-event-title-input not visible — DateTimePicker modal covers form)
[Failed] settings         (id: settings-theme-picker not visible — @expo/ui Picker drops testID on Android)
```
iOS passed those flows; iOS fails earlier on the XCTest driver cold-start race (#156's target).

Key files:
- `mobile/.maestro/{schools,settings,personal-events}.yaml` — shared cross-platform flows (don't edit unless an assertion is wrong).
- `mobile/e2e/run_e2e.sh` — local harness (server up → maestro → down); does **not** build/install.
- `mobile/e2e/README.md` — build/install commands + prerequisites.
- `ci/e2e-server.sh` — shared server lifecycle.
- `.github/workflows/ci-mobile-e2e.yml` — the two CI E2E jobs (on-demand via `run-e2e` label; always on `main`/`production` when `mobile/**` or `openapi/**` changed).
- `mobile/src/components/settings-screen.tsx`, `mobile/src/components/personal-event-form-screen.tsx` — the #157 fix sites.
