# 4 — Caching and performance

## 4.1 Objective

The Mac earns its keep only if it makes trusted native verification materially faster without
creating cache-only failures. The target is **warm iOS E2E p50 at least 30% faster** than the hosted
baseline, with no material reliability regression.

Do not promise a ten-minute job before measuring the actual hardware. The investigation could see
the Tailscale peer online but could not authenticate to inventory CPU, RAM, disk, macOS or Xcode.

## 4.2 Baseline to capture

Before changing runners, retain at least ten hosted runs and record per platform:

- dependency install;
- Expo prebuild;
- CocoaPods install;
- native compile;
- simulator boot and app install;
- backend seed/start;
- Maestro flow time;
- total queue and execution time;
- failure classification.

The sampled 2026-08-26 run is useful but not sufficient: iOS compiled in 741 seconds and Android in
1,287 seconds, while both later failed in the flow step.

## 4.3 Cache layers

| Layer                                     | Persist on Mac?               | Invalidation key                                                                  | Notes                                                            |
| ----------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| npm download cache (`~/.npm`)             | yes                           | npm/Node major + lockfile naturally                                               | Continue using `npm ci`; do not persist `node_modules` as truth  |
| CocoaPods downloads/spec metadata         | yes                           | CocoaPods version + package lock/fingerprint inputs                               | Downloads persist outside generated `ios/`                       |
| Xcode DerivedData                         | **yes**                       | Xcode build + macOS + architecture + lockfile + Expo/native fingerprint + variant | Store outside `mobile/ios/`, which `prebuild --clean` deletes    |
| Gradle dependency cache                   | yes if Android pilot proceeds | JDK + Gradle wrapper + lockfile/native fingerprint                                | Let Gradle own it                                                |
| Gradle task-output build cache            | yes if verified               | same inputs plus build variant                                                    | Enable/measure; never assume dependency cache equals build cache |
| Android SDK/system images                 | yes                           | exact SDK/API/image revision                                                      | Toolchain, not per-commit cache                                  |
| Xcode runtimes/simulators                 | yes                           | pinned supported runtime                                                          | Keep a named base simulator; reset app/device state per job      |
| Maestro binary                            | yes                           | exact pinned version (currently 2.8.0)                                            | Install once, verify version every job                           |
| generated `ios/` and `android/` source    | no                            | regenerated                                                                       | Continuous Native Generation remains source of truth             |
| build/store artifacts                     | no long-term local retention  | SHA + EAS build ID                                                                | Upload artifacts; apply retention policy                         |
| secrets, keychains, provisioning profiles | **never as cache**            | n/a                                                                               | Store builds stay on EAS                                         |

Gradle's build cache reuses task outputs when inputs match; it is distinct from downloaded dependency
caches. See the [Gradle Build Cache guide](https://docs.gradle.org/current/userguide/build_cache.html).

## 4.4 DerivedData strategy

The current hosted iOS workflow passes `-derivedDataPath build` from `mobile/ios`, so `expo prebuild
--clean` removes the parent native tree on the next run. The persistent runner should point
DerivedData at a runner-owned path outside the repository, partitioned by a stable cache key.

Conceptual key:

```text
ios-deriveddata-v1 /
  macos-build /
  xcode-build /
  arm64 /
  hash(package-lock.json + app.config.ts + eas.json + native build inputs) /
  app-variant
```

The path is an optimization, not correctness state. A job must still succeed after it is deleted.
Changing Xcode, Expo SDK, React Native, native dependencies, plugins, deployment target or build
variant starts a fresh partition.

## 4.5 GitHub cache versus local disk

GitHub documents that `actions/cache` data from self-hosted runners is stored in GitHub-owned cloud
storage. Downloading and uploading a large DerivedData archive on every job can erase the benefit of
a local persistent disk.

Therefore:

- use the Mac's local tool caches for Mac-to-Mac reuse;
- use `actions/cache` only for a cache that genuinely must be shared with hosted fallback jobs;
- never put credentials in either cache;
- treat restored GitHub caches as untrusted input;
- keep every job able to regenerate from source after a miss.

Source: [GitHub dependency caching](https://docs.github.com/en/actions/concepts/workflows-and-actions/dependency-caching).

## 4.6 Device state

Warm toolchains are desirable; warm test data is not.

- pin one supported iOS simulator runtime and device model;
- boot it once when practical, but erase/reset it on a defined cadence;
- uninstall the app or rely on the harness's `clearState` boundary before every top-level flow;
- keep the existing process-per-flow Maestro isolation;
- never let a pass depend on an account, token, calendar or permission left by an earlier job;
- capture simulator logs on failure before cleanup.

If reusing a booted simulator causes unexplained flakes, prefer deterministic erase/recreate over a
few seconds of boot savings.

## 4.7 Cleanup and disk budget

Set quotas before the first job:

- keep the newest two cache partitions per active Xcode version;
- delete partitions unused for 14 days;
- prune DerivedData when its budget is exceeded, oldest first;
- retain GitHub artifacts for 7 days on failure and shorter on success unless release evidence needs
  longer;
- alert before the startup disk reaches 80% usage;
- never run broad deletion against an unresolved path.

The exact size budget depends on the Mac's disk inventory. A dedicated runner should keep at least
100 GB free before enabling both Xcode and Android caches.

## 4.8 Measurement dashboard

Every run writes machine-readable timing JSON as an artifact and a short GitHub summary. Review p50,
p90 and failure rate weekly for the first month.

Go/no-go after the iOS pilot:

| Metric                     | Go                                                       |
| -------------------------- | -------------------------------------------------------- |
| Warm iOS total p50         | at least 30% faster than hosted                          |
| Warm native compile p50    | at least 40% faster than hosted cold compile             |
| Runner-caused failure rate | below 5% and not worse than hosted by more than 2 points |
| Fallback exercise          | same SHA succeeds on hosted macOS                        |
| Cache-clean proof          | one scheduled clean run per week remains green           |

Only after these hold should Android move into an experiment on the Mac.
