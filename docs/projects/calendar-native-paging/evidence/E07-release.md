# E07 release evidence

Status: **release blocked**. The Android long-session measurements below are diagnostics for source `151ace57f7e2b1b9803d7d45ede1794718167d7f`; they do not certify the later PR #453 mode-switch source merged as `16b899a900bcc72f2187739f534ef119f6199678`. No preview, store or OTA artifact has been published, and the owner has not given an exact-revision go verdict.

## Exact Android build

| Identity | Observed value |
| --- | --- |
| Source commit | `151ace57f7e2b1b9803d7d45ede1794718167d7f` on `calendar-paging-e07-cleanup` |
| Source tree | `6c7014b122b70f3f29a1e2f2f0334c21540ea176`, identical to squash merge `d692d20228a5f4c8b6656459e830c8b95d3e3999` (PR #452) |
| CI and host gates | PR #452: eight checks green; T14 host verification: 229 suites / 2,274 tests, TypeScript, ESLint and 24 React Compiler renderer functions passed |
| Build host and command | Windows PC WSL clone `timecalendar-e07-soak`; `mobile/perf/build-apk.sh` with `PERF_REPO` set to that clone, `APP_VARIANT=perf`, Android arm64 release, Node 24.13.0, JDK 17, Gradle 9.3.1, NDK 27.1.12297006 |
| Build recovery | The first app CMake invocation ended in a Clang optimizer segmentation fault compiling generated `autolinking.cpp` for arm64-v8a. The same generated source completed with incremental `assembleRelease --max-workers=2`; no source, native optimization or profiling flag changed. The successful invocation did not use the contemplated in-process Kotlin override. |
| APK SHA-256 | `7845f89a6fd0d67b7bc8c9e5a0722361671baceb066ed49565cce8d44baf3b43` on PC and Mac; installed `base.apk` hash matched |
| App identity | `fr.samuelprak.timecalendar.perf`, version `4.0.0`, code `1` |
| Device | OnePlus 6 (ONEPLUS A6003), Android 15, LineageOS build `BP1A.250505.005 5a3c5bc8b4`, 60 Hz |

The device reported AC power while its existing stay-awake mask covered USB only. The existing mask was left unchanged during these measured runs. The first attempted run encountered the keyguard; the owner unlocked the phone before the separate measured runs.

## Android sessions

| Session | Process and result | Evidence |
| --- | --- | --- |
| Initial 500-crossing attempt | **Invalid environment.** Dozing/keyguard covered the app; no Calendar baseline or observed crossings in at least 28 captured attempts, three samples of eight views and zero frames. The attempt was interrupted without a final sample. | [Sanitized summary](../../../../mobile/perf/samples/e07-151ace57-locked/summary.md); raw `/tmp/calendar-paging-e07-151ace57/soak-500/` |
| Unlocked 500-crossing soak | **Fail.** 500 observed adjacent crossings in 507 attempts over 2,266,291 ms of measured loop time; the run's wall-clock setup and finish spanned 2026-10-02 10:30:26–11:08:34 UTC. One PID `9232` / process start tick `6418045`, baseline and final page both 2962. Six attempts produced no crossing; no crash, app restart, non-adjacent settle or unexpected direction. | [Sanitized summary](../../../../mobile/perf/samples/e07-151ace57-soak-500/summary.md); raw `/tmp/calendar-paging-e07-151ace57/soak-500-unlocked/` |
| 30-minute mixed stress | **Fail.** 235 observed adjacent crossings in 358 mixed gestures over 1,805,172 ms of measured loop time; wall-clock setup and finish spanned 2026-10-02 11:09:05–11:39:32 UTC. One PID `21993` / start tick `6649995`, baseline page 2962 and final page 2963. Three paging attempts produced no crossing; no crash, restart, non-adjacent settle, unexpected direction or page change during vertical scroll/pinch. | [Sanitized summary](../../../../mobile/perf/samples/e07-151ace57-stress-30m/summary.md); raw `/tmp/calendar-paging-e07-151ace57/stress-30m/` |

The unlocked soak's 38 native-view samples ranged from 397 to 855 against a starting count of 803, so its maximum deviation of 406 **fails** the ±50 requirement. Calendar focus-observer and text views appear in dense samples and disappear in sparse ones; this explains some variation without establishing a leak. Native allocated heap rose from 232,403 to 320,440 KiB with a 323,351 KiB sampled peak. Peak and end growth exceeded the runner's provisional 47.6 MB diagnostic budget, while its sustained-tail flag was false. That diagnostic budget is not product acceptance. Dalvik allocated heap was 14,057 → 13,530 KiB; total PSS was 433,371 → 587,914 KiB and is not allocated heap. Hermes JavaScript heap and product heap stability remain unknown. After the initialization sample, mixed frame windows reached 8.9% platform-reported jank and 77 ms histogram p99; the preserved initialization sample recorded 9.68% and 200 ms. These windows do not prove the named P02 pinch/fling, UI-thread mount, JS work or iOS hitch gates.

The mixed stress's 29 view samples ranged from 585 to 803 against a starting count of 803, so its maximum deviation of 218 also **fails** the ±50 requirement. Native allocated heap was 230,820 → 276,567 KiB with a 292,041 KiB sampled peak. Peak growth exceeded the runner's provisional 47.3 MB diagnostic budget; end growth was below it and sustained-tail growth was false. Dalvik allocated heap was 13,593 → 14,091 KiB and total PSS was 420,121 → 544,383 KiB. Hermes JavaScript heap remains unknown. After initialization, mixed frame windows reached 6.22% reported jank and 61 ms histogram p99; the initialization sample recorded 11.83% and 200 ms. These windows also cannot establish the named P02 gates. The automated sequence does not switch Calendar modes.

The original summaries, app logs, view hierarchies, memory and frame samples for all three sessions are preserved outside Git in the private local archive `e07-151ace57.tar.gz` (SHA-256 `5bdb15d169dd9636f9fcf073edd68927bb5276556b5d3c3051518112a43bfb06`). Its local storage path is recorded in the uncommitted session handover. The raw `/tmp` paths above refer to the source files captured before archiving.

## Release gates

| Gate | Current result |
| --- | --- |
| P01 rapid paging | **Fail.** [E04 Android chains](E04-android-chained-swipes.md) land 15–16 of 20 forward swipes and 16 of 20 backward swipes on the exact T08b candidate; one of five reversals misses its origin. The E07 soak also recorded six missed attempts. |
| P02 frame budget and E05 pinch | **Unknown for this source.** The mixed samples cannot establish the named release gesture thresholds. Physical iPhone and OnePlus 6 pinch feel, seams, text sharpness and focal stability remain open. |
| P03 long-session views and heap | **View budget failed** on both long-session runs. Native allocation is diagnostic; Hermes JavaScript heap and product stability remain unknown. The automated mixed stress does not exercise mode switching from design §13. |
| E06 accessibility and iOS | Physical VoiceOver/TalkBack, reduced-motion and large-text device verdicts remain open. Prior Simulator functional evidence belongs to native `ff5841b4` / JavaScript `9d246fbf`, not this Android APK. |
| P05 renderer checks | T14 cleanup, React Compiler, coverage, TypeScript and lint host checks passed for the diagnostic source. |
| P06 publication | **Hold.** No owner go verdict, preview artifact, store submission or OTA publication. Any source change after `151ace57` requires affected exact-revision checks before release. |

The [release checklist](../../../mobile/releases/06-calendar-paging-gate.md) applies to preview, production and OTA distribution; code merges remain permitted while device gates fail.
