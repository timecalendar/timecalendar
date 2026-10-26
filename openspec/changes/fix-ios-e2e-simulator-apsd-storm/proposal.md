## Why

The iOS native E2E lane (`e2e-mobile-ios` in `.github/workflows/ci-mobile-e2e.yml`) fails
intermittently while Android passes. In runs 40325255868 and 40310861972 the fresh-user import
flow stopped on the iCal URL form with "The import could not be completed": the simulator sent
`POST /calendars`, received zero bytes, and the app cancelled at its 15 s request timeout. The
server logged no error. A diagnostic run (40334470221) showed the whole runner starved, not the
server: load average 130–570 on 3 vCPUs, a host sampler loop frozen for up to 28 s, Node timer
gaps of 10–12 s with almost no CPU used, and server cron jobs starting 8–12 s late.

The load comes from the simulator's push daemon. On GitHub's virtualized macOS host, `apsd`
inside the iOS 26.5 simulator cannot get a device certificate (`MobileActivation` error -25,
"Client is not supported"). It drops each courier connection and reconnects at once, because
system daemons (triald, storekitd, remindd, parsecd) keep push topics registered. One flow sees
about 5,750 TLS connections in 6 minutes. Each attempt logs, so the simulator's and the host's
`diagnosticd` and Maestro's unconditional `log stream` capture (220–250 MB per flow, 662k `apsd`
lines) take most of the CPU. Any step can stall: the diagnostic run failed at the Welcome
assertion. Retries or longer timeouts would hide the starvation, not remove it.

## What Changes

- A new script, `mobile/e2e/quiesce-ios-simulator.sh <udid>`, waits for the simulator to finish
  booting, disables and boots out `com.apple.apsd` in the simulator's `user/foreground` launchd
  domain, then checks that the simulator's `launchctl list` no longer contains `com.apple.apsd`.
  The script exits non-zero if the daemon is still loaded.
- The iOS "Boot a simulator and install the app" step calls the script right after
  `xcrun simctl boot` and before `xcrun simctl install`, so apsd is gone before the app or
  Maestro run.
- `mobile/e2e/test_ci_mobile_e2e.sh` asserts the step calls the script between boot and install,
  with mutations for a removed call and a call moved after install. It also checks that
  `ci-mobile.yml` runs the new behavioral test.
- A new device-free test, `mobile/e2e/test_quiesce_ios_simulator.sh`, runs the script against a
  fake `xcrun` on `PATH`. It covers the call order, a tolerated bootout failure, a fatal disable
  failure, a missing UDID, and apsd still being loaded, which must fail the script. Both
  `ci-mobile.yml` (pull requests) and the iOS lane's harness step run it.
- No retries, timeouts, app code or Maestro flows change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-e2e`: the CI iOS simulator runs without the APNs daemon, and a baseline gate pins that.

## Impact

- CI: `.github/workflows/ci-mobile-e2e.yml` (iOS boot step and harness step) and
  `.github/workflows/ci-mobile.yml` (harness-contract step).
- Harness: a new `mobile/e2e/quiesce-ios-simulator.sh`, a new
  `mobile/e2e/test_quiesce_ios_simulator.sh`, and an extended `mobile/e2e/test_ci_mobile_e2e.sh`.
- Docs: `docs/mobile/architecture-book/testing.md` (E2E section), a dated
  `docs/mobile/architecture-book/CHANGELOG.md` entry, and `mobile/e2e/README.md`.
- No app, flow, server, dependency, native-config or Flutter change. Remote push is not covered
  by any E2E flow, and on this host apsd never had a certificate, so no push token was ever
  issued there.
