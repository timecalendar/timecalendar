# E07 P01 Android deceleration-rate 0.5 trial

Status: **P01 fails.** An Android-only ScrollView `decelerationRate={0.5}` trial did not land the required 20 rapid swipes in either direction. This experimental renderer commit is not a release candidate; the source and trace remain on `calendar-paging-p01-rate05`, separate from this evidence-only branch. No native dependency or paging-policy change is approved by this measurement.

## Identity and method

- Exact source revision: `f26ea08dccf4476d2a38d76f7631dede4c58dbeb`, branched from the bounded diagnostic trace `90a88268e35b0d891db00b795dd52f465b1c7633` and changing only the Android ScrollView rate from React Native `fast` (0.9) to 0.5. The measured revision includes the merged Week/Day placement fix.
- Android arm64 release perf APK: built on the PC under WSL from that full source SHA with the in-process Kotlin compiler and two Gradle workers. SHA-256 of the PC artifact, copied APK, and installed `base.apk` matched: `985f74b0e314d6e368cbba45bd58a50b0b03f4bef8d5c827eab2094155e9de8c`. The perf package was installed with `adb install -r`; no uninstall or data reset occurred.
- OnePlus 6, Android 15, 60 Hz; perf package `fr.samuelprak.timecalendar.perf`, version 4.0.0. The unmodified `mobile/perf/run.mjs` launched the app once and then ran `swipe-forward-20,swipe-back-20,reversal-10,diagonal-20` with `--logcat CALENDAR_PAGING --probe owned-calendar-page-control`. The private raw archive is outside Git, SHA-256 `ccfef8d636e5ac86ffad2477080ceaed7f909537cfc713f32323c2e299891bc2`.
- Host checks on the exact source commit: TypeScript, ESLint, React Compiler (24 compiled functions), and the focused pager/shell Jest suites (83 tests) passed. No test or perf harness source changed in this trial.

## Observed result

| Scenario | Native begin/end drag pairs | Observed center crossings and commits | Final aligned movement and page-control witness | Result |
| --- | ---: | ---: | --- | --- |
| 20 rapid forward swipes | 20/20 | 15/15 | +15 weeks; Monday 5 October 2026 to Monday 18 January 2027 | **Fail: five short** |
| 20 rapid backward swipes | 20/20 | 16/16 | −16 weeks; Monday 18 January to Monday 28 September 2026 | **Fail: four short** |
| Ten forward/back reversal pairs | 20/20 | 20/20 | Native offset returned to the origin; page control read Monday 28 September before and after | Directional return observed; full P01 presentation agreement unproved |
| 20 diagonal swipes, 1,200 ms configured gaps | 20/20 | 20/20 | +20 weeks; Monday 28 September 2026 to Monday 15 February 2027 | This scenario landed; it does not repair the rapid-chain failure |

The rapid drag median was about 269 px against a roughly 334 px page width. Between lift and the next drag, the median extra native motion was 8.9 px in 144 ms forward and 9.3 px in 145 ms backward; the prior 0.9 trace recorded 9.6 px in 140 ms and 8.8 px in 146 ms respectively. Those comparable partial offsets explain why the faster-decay prop did not complete a page before the next touch. The diagonal lift-to-momentum-end median was 668 ms in this run versus 267 ms in the prior 0.9 trace; differing run conditions and the single sample prevent attributing the entire interval change to the prop. A still lower prop value has no evidence of improving chain landing, so the bounded prop trial stopped here.

The page-control descriptions above came from the scenario probes. An additional final UI hierarchy dump showed the February 2027 title describing Monday 15 February, the page control describing the same day, and nonzero visible bounds for date-header slot `week:20864`, `owned-calendar-canvas`, and page `week:20864`. That is a final-screen header/date/canvas witness only; the harness did not capture matching header, title, event, and canvas state after every scenario. The reversal returned to its origin offset and page-control date, but the final index was already recorded as settled, so there was no new settlement log at the last origin position.

The diagnostic frame histogram p99 values were 46 ms forward, 44 ms backward, 40 ms reversal, and 65 ms diagonal. These are not the named P02 UI-thread mount and JavaScript-work measures and cannot pass P02. This run did not perform repeated chain passes, short/slow drag and fling checks, physical accessibility checks, or a long-session heap/view gate because the first rapid-chain acceptance step already failed. The [product P01 contract](../product.md) remains failed. [P02](../product.md), the [release gates](E07-release.md), and the owner's exact-revision release verdict remain independently open or failed as recorded; no release or preview is approved.

The earlier [Android snap-timing diagnosis](E07-P01-Android-snap-timing.md) records the 0.9 and 0.95 measurements and the native-policy proposal. This result rejects the 0.5 prop setting as a sufficient repair. The owner authorized a bounded native paging prototype after this trial; [D01](../decisions/D01-native-scrollview-paging-owner.md) and [D08](../decisions/D08-delivery-gate-and-rollout.md) still govern architecture and release. Prototype authorization is not P01 acceptance and does not establish an exact-revision release verdict.
