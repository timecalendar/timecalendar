## Context

The failing `main` run at `750a3eb588d1de4cae3c0e0bae8069e130f4b120` contains the
onboarding merge but never reaches a valid cross-platform product verdict. Android fails in
`:expo:lintVitalAnalyzeRelease` / `:app:mergeExtDexRelease` with
`OutOfMemoryError: Metaspace`; its Gradle process then survives until the 60-minute job
timeout. iOS runs on `macos-26` / Xcode 26 with an iOS 26.4.1 simulator: initial XCTest
driver launches intermittently never bind, and a bound driver can die before a later flow,
leaving the directory suite attached to an unreachable port during `setPermissions`.

The workflow currently installs floating latest Maestro (2.8.0 in the diagnosed run), logs
neither that version nor the complete Apple toolchain choice, and retries the entire iOS
suite four times for every non-zero result. That whole-suite retry can hide a genuine flow
assertion failure. The shared `ci/e2e-server.sh` lifecycle is healthy and remains the sole
owner of server boot, seed, logs, and teardown.

Relevant upstream evidence:

- `mobile-dev-inc/Maestro#3137` reproduces an iOS 26.x driver process that never listens.
- `mobile-dev-inc/Maestro#3318` documents directory-batch port reuse after driver death and
  confirms that individual CLI invocations pass because each receives a fresh driver.

## Goals / Non-Goals

**Goals:**

- Make the Android release-config development APK build fit predictably on the hosted Linux
  runner and ensure Gradle exits after success or failure.
- Execute the complete existing YAML set on iOS and Android without sharing one Maestro
  process across top-level files.
- Retry only a positively identified first-`launchApp` XCTest startup failure, within a
  small fixed bound; preserve the first real flow/assertion failure as the job result.
- Pin and print the Maestro version and print the actual Xcode, simulator model, UDID, and
  runtime selected by CI.
- Preserve failure artifacts, server logs, release configuration, development identity, and
  the single shared server lifecycle.

**Non-Goals:**

- Change, remove, tag, or weaken any Maestro flow or assertion.
- Change product code, onboarding behavior, the API/schema contracts, Expo/native identity,
  EAS/store configuration, deploy workflows, infrastructure, or legacy Flutter.
- Implement the separately recorded AVD, DerivedData, or broader build-cache speedups.
- Claim definitive native proof from this non-virtualized development host; the proof is the
  post-merge `main` workflow on GitHub-hosted runners.

## Decision 1 — Pin the diagnosed Maestro release and print every selected toolchain

Both jobs install Maestro with `MAESTRO_VERSION=2.8.0`, put its binary on `PATH`, and execute
`maestro --version` in the install step. Pinning the version used by the diagnostic run
separates harness recovery from an unreviewed tool upgrade; the lifecycle workaround is
needed independently of a downgrade because the same iOS 26 failure family is reported
across 2.0.10 through 2.6.0.

The iOS job also prints `xcode-select -p`, `xcodebuild -version`, available runtimes, and the
chosen simulator's name, UDID, and runtime before boot. Simulator selection must be
deterministic from the available-device JSON (rather than relying on object iteration) and
must fail clearly if no iPhone is available. The workflow remains on `macos-26` because SDK
56's native dependencies require the Xcode 26 / Swift 6.2 toolchain already documented in
the job.

Alternatives rejected:

- Floating latest Maestro: makes failures non-reproducible and silently changes both jobs.
- Downgrading to an older Maestro alone: upstream reports the driver family on older releases
  and it does not address directory-suite lifecycle reuse.
- Pinning an undocumented runner image/runtime that GitHub does not guarantee: brittle; log
  the exact selected rolling-image components instead.

## Decision 2 — Bound Android Gradle memory and process concurrency at invocation

The Android release assembly receives explicit Gradle JVM limits of 3072 MiB heap and
1024 MiB Metaspace, `--max-workers=2`, and `--no-daemon`. These values are large enough to
raise the generated SDK 56 project's observed Metaspace ceiling while remaining bounded on
the standard hosted runner and leaving headroom for Node, Docker image handling, and the OS.
They are applied by the workflow at the `./gradlew :app:assembleRelease` invocation; no
generated `mobile/android/` file is committed.

`--no-daemon` still permits Gradle's required single-use process when JVM settings differ,
but guarantees it is stopped after the build instead of surviving an OOM until job timeout.
The workflow logs the effective invocation limits. A task-level static assertion protects
the exact bounds from accidental removal.

Alternatives rejected:

- Raising only the job timeout: leaves the OOM and live Gradle process unchanged.
- Unbounded heap/Metaspace or maximum worker parallelism: competes with the hosted runner and
  turns one resource failure into another.
- Editing generated `android/gradle.properties`: CNG deletes that tree on every clean prebuild.

## Decision 3 — One server lifecycle, one Maestro process per top-level YAML

`mobile/e2e/run_e2e.sh` continues to call `ci/e2e-server.sh up` once and tears it down once.
Between those calls it enumerates every top-level `mobile/.maestro/*.yaml` in deterministic
lexical order and invokes `maestro test <file>` separately for each file. This intentionally
includes the shared `import-seed.yaml`, preserving the complete set that directory mode
currently discovers; nested files, if introduced later, are not silently added.

The wrapper stops at the first terminal failure and returns that exact non-zero status. A
fresh CLI process gives each flow a new XCTest driver and port on iOS and harmlessly provides
the same isolation on Android. Backend state is still re-seeded once per wrapper run; flow
state isolation remains each YAML's `clearState` contract.

Alternatives rejected:

- Keep `maestro test <directory>` and retry the suite: reuses the dead driver port and may
  turn a real assertion failure into a later pass.
- Start/seed/stop the backend per flow: duplicates expensive lifecycle work and violates the
  single-sourced server contract.
- Maintain a second flow manifest: can drift from the YAML directory and accidentally omit a
  new flow.

## Decision 4 — Retry only proven startup transport failures

The harness accepts an explicit bounded startup-attempt option used only by iOS CI; normal
local and Android invocations remain one attempt. After a failed Maestro process, a retry is
eligible only when captured output identifies the first `launchApp` permission/setup call
failing because the XCTest driver did not listen or refused its local connection, and the
captured output contains no completed assertion or assertion-failure evidence. All other
failures—including missing elements, timeouts waiting for app content, and failed
assertions—return immediately without retry.

iOS CI uses at most four startup attempts per flow and keeps
`MAESTRO_DRIVER_STARTUP_TIMEOUT` bounded. Each attempt gets a separate log file retained in
Maestro debug output; the harness prints the flow name, attempt number, retry classification,
and terminal result. Focused shell tests use a fake `maestro` executable to prove a startup
signature retries within the bound and an assertion failure runs exactly once.

Alternatives rejected:

- Retry every non-zero exit: masks product regressions.
- Retry the full suite: repeats already-passing flows, resets the server, and masks failures.
- No startup retry: the diagnosed run needed multiple attempts before any driver listened.

## Decision 5 — Record the harness rule as ADR 038 and require `main` proof

The process-per-flow and startup-only retry boundary changes the binding testing rule, so the
Applier writes ADR 038, indexes it, and updates `testing.md`, the E2E README, and the agent
handbook. The ADR is explicitly revisitable when Maestro documents a fixed iOS 26 driver
lifecycle and a pinned upgrade passes repeated directory-suite proof.

Local verification covers workflow parsing/static assertions, `bash -n`, ShellCheck when
available, and fake-Maestro classification tests. Definitive verification is a post-merge
`main` run whose SHA contains onboarding merge `482f134f`; both named native jobs must be
`SUCCESS`, and their job links are recorded before the issue closes.

## Risks / Trade-offs

- **Per-flow startup adds time** → keep the server single-lived, stop on first failure, and
  revisit after an upstream lifecycle fix is proven.
- **Text signature classification can drift with Maestro output** → pin 2.8.0, test the known
  signatures, default unknown output to non-retryable, and print the classification.
- **Four startup attempts can consume job time during a broad outage** → use a bounded driver
  timeout and fail the current flow immediately after its last startup attempt.
- **The Android limits may still be insufficient as native dependencies grow** → CI is the
  proof; keep the numbers explicit and adjust only from measured hosted-runner evidence.
- **A rolling `macos-26` image can change Xcode/runtime** → log all selected versions so a
  regression is attributable and reproducible on an equivalent image.

## Migration Plan

1. Land the harness, workflow, tests, ADR, and docs together on the existing draft PR.
2. Run static/local shell verification in the apply stage; do not add `run-e2e` solely to
   compensate for this host's lack of KVM.
3. Merge after normal review and green non-native checks; the workflow itself is non-deploying.
4. Observe the path-triggered `main` native workflow and record both job URLs and the tested
   SHA. If either job fails, keep the issue open and repair on the same recovery scope.
5. Rollback is a normal revert of the workflow/harness/docs commit; no data or user migration
   exists.

## Open Questions

None. Exact runtime behavior remains CI-measured, but the implementation choices and proof
gate are fully specified.
