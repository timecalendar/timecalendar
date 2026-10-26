## 1. Script and behavioral proof (design Decisions 1–3)

Every command runs from the repository root. Do not add retries or timeouts, and do not touch
app code or Maestro flows.

- [x] 1.1 Write `mobile/e2e/test_quiesce_ios_simulator.sh` first (bash, `set -euo pipefail`,
  `chmod +x`). Use `test_run_e2e.sh` as the model: `fail()`, a `mktemp -d` root with an EXIT
  trap, and a fixture `bin/xcrun` heredoc on `PATH`. The fake `xcrun` appends `"$*"` to
  `$CALL_LOG`. It handles `simctl bootstatus <udid> -b` (exit 0) and
  `simctl spawn <udid> launchctl disable|bootout|list`, exiting with `FAKE_DISABLE_STATUS`,
  `FAKE_BOOTOUT_STATUS` and `FAKE_LIST_STATUS` (default 0). `list` prints a few unrelated labels,
  plus `-	0	com.apple.apsd` when `FAKE_APSD_LISTED=1`. Any other argv exits 97. Write one
  function per case:
  - happy path: exit 0; the call log is exactly `simctl bootstatus U -b`,
    `simctl spawn U launchctl disable user/foreground/com.apple.apsd`,
    `simctl spawn U launchctl bootout user/foreground/com.apple.apsd`,
    `simctl spawn U launchctl list`, in that order; stdout contains `apsd disabled in simulator U`.
  - bootout fails (`FAKE_BOOTOUT_STATUS=3`): exit 0.
  - apsd still listed (`FAKE_APSD_LISTED=1`): non-zero; stderr contains
    `apsd is still loaded in simulator U`.
  - disable fails (`FAKE_DISABLE_STATUS=5`): non-zero, and the log has no `bootout` or `list` call.
  - list fails (`FAKE_LIST_STATUS=4`): non-zero.
  - no argument, and an empty argument: exit 2, and the call log is empty.

  End with `echo '[test_quiesce_ios_simulator] PASS'`. Verify: run it and confirm it FAILS
  because `mobile/e2e/quiesce-ios-simulator.sh` does not exist yet.
- [x] 1.2 Write `mobile/e2e/quiesce-ios-simulator.sh` (`chmod +x`, bash, `set -euo pipefail`)
  following design Decision 2. Start with a header comment of 3–5 lines on why: on GitHub's
  virtualized macOS runners the simulator's apsd cannot get a device certificate, reconnects to
  APNs in a hot loop, and its logging starves the runner. That is the only comment. Use
  `readonly SERVICE=user/foreground/com.apple.apsd`. Capture `launchctl list` into a variable
  before grepping, so a failed `list` is fatal. Verify: `./mobile/e2e/test_quiesce_ios_simulator.sh`
  prints PASS. Then make three throwaway edits to the script and revert each one: drop the
  final check, append `|| true` to `disable`, and change the `list` capture to
  `|| true`. Each edit must make the test fail. Name the case that caught each edit in the PR
  description.
- [x] 1.3 If `shellcheck` is installed, run `shellcheck mobile/e2e/quiesce-ios-simulator.sh
  mobile/e2e/test_quiesce_ios_simulator.sh` and get it clean. Otherwise run `bash -n` on both.
  Verify: the command exits 0.

## 2. Workflow wiring and contract (design Decision 2)

- [x] 2.1 Extend `mobile/e2e/test_ci_mobile_e2e.sh` before editing any workflow. Keep its
  structure and every existing assertion. Add:
  - `ios_boot_block="$(step_block e2e-mobile-ios 'Boot a simulator and install the app')"`, which
    must be non-empty and contain exactly one
    `"$GITHUB_WORKSPACE/mobile/e2e/quiesce-ios-simulator.sh" "$DEVICE_UDID"`
    (`assert_block_count 1`).
  - An ordering check on that block: the line numbers from `grep -nF` must satisfy
    `xcrun simctl boot "$DEVICE_UDID"` < the quiesce line < `xcrun simctl install "$DEVICE_UDID"`.
    Report a failure with `fail "iOS simulator must be quiesced after boot and before install"`.
  - `assert_block_present "$(step_block e2e-mobile-ios 'Test mobile E2E harness')"
    './mobile/e2e/test_quiesce_ios_simulator.sh' 'iOS harness step'`.
  - `assert_baseline './mobile/e2e/test_quiesce_ios_simulator.sh'`.
  - Mutations: `ios-quiesce-removed` deletes the quiesce line
    (`s/\n[^\n]*quiesce-ios-simulator\.sh[^\n]*//`), and `ios-quiesce-after-install` moves it
    after the install line (capture the quiesce line and the `APP=`/install lines, then swap them).
    `expect_mutation_failure` already rejects a no-op mutation.

  Verify: `RUN_MUTATIONS=0 ./mobile/e2e/test_ci_mobile_e2e.sh` FAILS against the unchanged
  workflow. Paste the first failure line in the PR description.
- [x] 2.2 Edit `.github/workflows/ci-mobile-e2e.yml`. In the iOS job's "Boot a simulator and install
  the app", insert `"$GITHUB_WORKSPACE/mobile/e2e/quiesce-ios-simulator.sh" "$DEVICE_UDID"` on the
  line right after `xcrun simctl boot "$DEVICE_UDID" || true`. In its "Test mobile E2E harness"
  step, add `./mobile/e2e/test_quiesce_ios_simulator.sh` after the existing two lines. Do not
  touch anything else (and do not add a comment; the script header carries the reason).
- [x] 2.3 Edit `.github/workflows/ci-mobile.yml`. In "Check the native E2E harness and workflow
  contract", add `./mobile/e2e/test_quiesce_ios_simulator.sh` after the existing two lines, and
  extend the step comment so it says the quiesce proof drives a fake `xcrun`. Keep the comment to
  the current state. Verify: `./mobile/e2e/test_ci_mobile_e2e.sh` prints PASS with mutations on,
  `./mobile/e2e/test_run_e2e.sh` still prints PASS, and `actionlint` on both workflows is clean
  if installed (otherwise `npx --yes @action-validator/cli` on each).

## 3. Architecture Book and README

- [x] 3.1 `docs/mobile/architecture-book/testing.md`, `## E2E — Maestro, real round-trip`: add one
  bullet after "Process isolation and recovery stay structural". Title it
  **The CI iOS simulator runs without apsd.** Say: on GitHub's virtualized macOS runners the
  simulator's `apsd` cannot get a device certificate and reconnects to APNs in a hot loop, and
  its logging starves the 3-vCPU runner until any request or assertion can stall.
  `mobile/e2e/quiesce-ios-simulator.sh` disables and boots out
  `user/foreground/com.apple.apsd` after boot and before install, and fails the step if the
  daemon is still loaded. It is enforced by `test_ci_mobile_e2e.sh` (call and order, with
  mutations) and `test_quiesce_ios_simulator.sh` (behavior, with a fake `xcrun`). E2E does not
  cover remote push. Check the label again on each simulator-runtime bump. Retries and longer
  timeouts are not the fix. Current state only. Also add `test_quiesce_ios_simulator.sh` to the
  `ci-mobile.yml` bullet under `### Workflow split + daily/manual E2E`, which lists the harness
  proofs that run on pull requests. Verify: `grep -n "apsd\|test_quiesce_ios_simulator"
  docs/mobile/architecture-book/testing.md` shows both edits.
- [x] 3.2 Add `## 2026-10-26 — CI iOS simulator runs without apsd` as the FIRST `## ` entry of
  `docs/mobile/architecture-book/CHANGELOG.md`, above "iOS DateTimeField alignment and name". Add
  one or two bullets in the current state, each naming its gate: the quiesce script and where it
  runs (`test_ci_mobile_e2e.sh`), and its fail-closed check (`test_quiesce_ios_simulator.sh`).
  Link `testing.md` → E2E. Verify: `head -1 docs/mobile/architecture-book/CHANGELOG.md` shows the
  new heading.
- [x] 3.3 `mobile/e2e/README.md`: in "Prerequisites and local command", add one sentence saying
  that CI disables apsd in the iOS simulator through `quiesce-ios-simulator.sh` (link
  `testing.md`) and that local simulators do not need it. In "Retry and static integrity", add
  `test_quiesce_ios_simulator.sh` to the baseline list with a one-line description. Verify by
  reading both sections.
- [x] 3.4 Run `npx --prefix mobile prettier --check` on every touched Markdown file (README,
  testing.md, CHANGELOG.md) and fix any issues. Verify: the command exits 0.

## 4. Local verification and CI proof

- [x] 4.1 From the repository root, run `./mobile/e2e/test_quiesce_ios_simulator.sh`,
  `./mobile/e2e/test_ci_mobile_e2e.sh` and `./mobile/e2e/test_run_e2e.sh`. All three must print
  PASS. In `mobile/`, run `npx tsc --noEmit`, `npm run lint` and `TZ=UTC npm test -- --coverage`.
  All must be green and unchanged, as a guard that nothing app-side moved. Then run
  `openspec validate fix-ios-e2e-simulator-apsd-storm --strict`, which must pass.
- [x] 4.2 Optional local smoke on this Mac, if Xcode and an iOS 26.x runtime are installed:
  `xcrun simctl create quiesce-probe "iPhone 17"`, boot it, run
  `./mobile/e2e/quiesce-ios-simulator.sh <udid>`, and confirm exit 0 with the evidence line. Run
  it a second time and confirm exit 0 again (bootout tolerated), then delete the probe device.
  Record the runtime in the PR. If no runtime is installed, skip without blocking.
- [x] 4.3 Check the diff: it touches only the two workflows, the three `mobile/e2e/` scripts,
  `mobile/e2e/README.md`, `testing.md`, `CHANGELOG.md` and this change's directory. It adds no
  dependency, and no app, flow, server, native-config or Flutter file. Verify with
  `git diff --stat main...HEAD`.
- [x] 4.4 CI proof on the PR head (conductor-run): `test-mobile` in `ci-mobile.yml` is green, so the
  harness contract including the new quiesce test ran. Report pending checks as pending.
- [x] 4.5 Native proof (conductor-run): run `gh workflow run ci-mobile-e2e.yml --ref
  fix/mobile-e2e-ios-ical-import -f ref=fix/mobile-e2e-ios-ical-import`. Record the run URL, both
  platform conclusions, and the iOS boot step's `apsd disabled in simulator <udid>` line in the PR
  description. If iOS fails, read the log before doing anything else. A failure at the boot step
  means the script's check fired: report it and do not re-run. On Android, a failure at
  `:app:packageRelease` before launch is the known infra flake and gets one re-run.
