# iOS Simulator SpringBoard startup crash

The iPhone 17 Pro simulator running iOS 26.5 produced six SpringBoard crashes between
10:28:38 and 10:32:03 CEST on 2026-10-02 during the Calendar test session. Each trapped in
`FBSDisplayMonitor` initialization, reached through `FBDisplayManager` and
`FBSystemShellInitialize`. No Calendar app code appears on the faulting stacks. The original
reports remain in `~/Library/Logs/DiagnosticReports/SpringBoard-2026-10-02-*.ips`.

The first two reports do not list `libArgentInjectionBootstrap.dylib`; the later four do.
Argent 0.26.0's running tool server watched booted simulators and installed a simulator-wide
`DYLD_INSERT_LIBRARIES` value. That is a confounding factor, not proof of the original cause:
the same crash occurred in the two earlier reports without the library listed.

The bounded recovery stopped that identified Argent server, booted the same simulator once
with direct `simctl`, and observed it for 60 seconds. Its live launchd injection value was
empty, and no new SpringBoard report appeared. The check then shut down the simulator without
erasing data or uninstalling apps. The later [E06 smoke](../../projects/calendar-native-paging/evidence/E06-accessibility.md)
rebuilt and launched the development app using direct `simctl` and Metro.

Argent remains excluded from this test path. A successful boot and app smoke establish a
working test route, not a root-cause fix. The failed display invariant and the first two
uninjected-image crashes remain unexplained. A separate intermittent host
`Too many open files (os error 24)` symptom was observed, but no evidence links it to this trap.
