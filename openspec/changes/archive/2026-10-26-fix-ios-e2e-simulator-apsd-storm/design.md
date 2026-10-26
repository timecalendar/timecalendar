## Context

The iOS lane boots the newest available iPhone simulator in "Boot a simulator and install the
app" (`xcrun simctl boot "$DEVICE_UDID" || true`, then `xcrun simctl install`), installs
Maestro 2.8.0, runs the device-free harness tests, then runs `run_e2e.sh --native
--startup-attempts 4`. The root cause is established (proposal): on the virtualized macOS host,
the simulator's `apsd` cannot obtain a certificate and reconnects to the APNs courier in a hot
loop. The logging that loop produces, collected by `diagnosticd` and by Maestro's per-flow
`xcrun simctl spawn <udid> log stream` capture, starves a 3-vCPU runner. Maestro 2.8.0 starts
that capture unconditionally (`LocalSimulatorUtils.startDeviceLogStream` from
`DeviceArtifactCapturer`), and no CLI flag turns it off.

`test_ci_mobile_e2e.sh` checks the workflow by grepping job and step blocks, and it reruns
itself against perl-mutated copies of the workflow (`expect_mutation_failure`). It runs on pull
requests from `ci-mobile.yml` and in the iOS lane's harness step. `test_run_e2e.sh` is the
example of a harness test that puts fake binaries on `PATH`.

## Goals / Non-Goals

**Goals:**

- Remove the APNs reconnect loop from the CI simulator before the app or Maestro starts.
- Fail the boot step loudly if the daemon is still loaded, so the lane never runs flows on a
  silently starved host.
- Pin the workflow call and the script's behavior with device-free gates that run on pull
  requests.

**Non-Goals:**

- Retries, longer request or Maestro timeouts, or changes to app code or flows.
- Changing Maestro's log capture or the runner size.
- Exercising remote push in E2E. Push stays human-directed release acceptance.
- Changing local developer simulators. The script is called only from CI. Locally `apsd` gets a
  certificate and stays quiet.

## Decisions

### Decision 1: Disable `apsd` in the CI simulator

`xcrun simctl bootstatus "$UDID" -b` waits for boot completion (and boots the device if needed).
Then `xcrun simctl spawn "$UDID" launchctl disable user/foreground/com.apple.apsd` stops launchd
from relaunching the daemon on demand, and `xcrun simctl spawn "$UDID" launchctl bootout
user/foreground/com.apple.apsd` stops the running instance. Both are needed. `disable` alone
leaves the current process looping, and `bootout` alone lets launchd restart it the next time a
system daemon looks up its Mach service. Running both on a fresh iOS 26.5 simulator was verified
locally: apsd stays gone.

Alternatives considered:

- **Retries or longer timeouts.** Rejected. Starvation hits any step, including the Welcome
  assertion in run 40334470221, so a longer wait only moves the failure. ADR 038 also keeps
  retries structural, for startup failures only.
- **Muting the logs** (`log config` in the simulator, or filtering Maestro's capture). Rejected.
  Maestro has no flag to filter its capture. Muting would also leave about 16 TLS handshakes per
  second running, and the certificate lookups and `notifyd` traffic would still cost CPU. Removing
  the source is cheaper and covers all of it.
- **A larger runner** (`macos-26-xlarge`). Rejected. It costs money on a public repo, and the
  loop scales with whatever CPU it is given.
- **Killing `diagnosticd`.** Rejected. It treats a symptom, and launchd respawns it.

This is safe for the app: on this host apsd never obtains a certificate, so no APNs or FCM token
was ever issued in CI, and no flow exercises remote push.

### Decision 2: A standalone script, called by absolute path from the boot step

The logic lives in `mobile/e2e/quiesce-ios-simulator.sh <udid>` (bash, `set -euo pipefail`),
next to the harness it serves, so the behavior can be tested without parsing YAML. The boot step
calls `"$GITHUB_WORKSPACE/mobile/e2e/quiesce-ios-simulator.sh" "$DEVICE_UDID"` on the line after
`xcrun simctl boot`. The absolute path is used because the step runs in `./mobile/ios`. Script
contract:

- No argument, or an empty one: print usage to stderr and exit 2.
- `bootstatus -b` failure or `disable` failure: exit non-zero (`set -e`).
- `bootout` failure is tolerated (`|| true`) because the service may already be gone. The check
  that follows is what decides success.
- Check: capture `xcrun simctl spawn "$UDID" launchctl list` first, then `grep -Fq
  com.apple.apsd` on the captured text. A failed `list` is fatal; the script does not grep a
  stream it never read. If the label is present, print `apsd is still loaded in simulator
  <udid>` to stderr and exit 1. If it is absent, print `apsd disabled in simulator <udid>` to
  stdout, which is the evidence line in the job log.
- The header comment is a few lines on why (the virtualized host, the certificate failure, the
  hot loop, the starved runner). It is the only comment.

### Decision 3: The behavioral proof is its own test file

`mobile/e2e/test_quiesce_ios_simulator.sh` puts a fake `xcrun` on `PATH`. The fake appends each
argument vector to `$CALL_LOG`. It answers `simctl bootstatus`, `simctl spawn <udid> launchctl
disable|bootout|list`, and fails on anything else. Its behavior comes from env: `FAKE_DISABLE_STATUS`,
`FAKE_BOOTOUT_STATUS`, `FAKE_APSD_LISTED` (when 1, `list` prints a line containing
`com.apple.apsd`) and `FAKE_LIST_STATUS`. The test is separate from `test_ci_mobile_e2e.sh` for
two reasons. That file reruns itself once per mutation, so a behavioral suite inside it would run
about 12 times. Mixing script behavior into a YAML-contract file would also blur what each file
proves. `ci-mobile.yml` and the iOS lane's harness step run it next to the other two harness tests,
and `test_ci_mobile_e2e.sh` asserts both invocations, as it does for the existing two.

### Decision 4: No ADR

This is a harness fix inside the lane that ADRs 038, 055 and 071 already define. It adds no
cadence, retry or gating policy. The rule goes in `testing.md` with a link to its gates, plus a
dated CHANGELOG entry (Principle 1: the gates come first, the prose links to them).

## Risks / Trade-offs

- **A future runtime renames the label** → the check passes even though nothing was disabled, and
  the loop comes back. Mitigation: the testing.md rule names the label and asks for it to be
  checked again on each simulator-runtime bump. The script's evidence line in the job log shows
  which label was disabled.
- **A simulator image ships with apsd healthy** → disabling it has no cost, because E2E never
  uses remote push.
- **Other system daemons loop the same way** → out of scope. The diagnostic evidence names apsd
  as the source, and the other top CPU users are its log consumers. If the lane stalls again, the
  next diagnosis starts from the same host sampler.
- **The fix cannot be proven locally** → the local Mac has no virtualized host. The proof is a
  manual dispatch of `ci-mobile-e2e.yml` on this branch (tasks group 4), read alongside the boot
  step's evidence line.
