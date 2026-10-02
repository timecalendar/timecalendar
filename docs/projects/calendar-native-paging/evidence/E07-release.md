# E07 release evidence

Status: **pending**. No E07 soak, preview publication, or owner go verdict is recorded here.

| Required record                                                               | Current result |
| ----------------------------------------------------------------------------- | -------------- |
| Exact tested full git SHA and CI result                                       | Unknown        |
| Android release perf APK SHA-256, installed APK hash, package version/build   | Unknown        |
| OnePlus 6 device/OS/refresh rate, 500 observed crossing soak raw output       | Unknown        |
| 30-minute mixed paging/scroll/pinch raw output                                | Unknown        |
| Heap/native memory trend, view range (±50), frame windows, process continuity | Unknown        |
| iOS release-mode rapid swipes, accessibility, dense week, hitch observations  | Unknown        |
| E05/E06 device checks and full Calendar regression                            | Unknown        |
| T14 cleanup and compiler/lint/tsc/coverage checks                             | Pending        |
| Owner verdict for this exact revision                                         | Pending        |
| Preview artifact identity and installation                                    | Not published  |

`mobile/perf/soak.mjs` writes `summary.json` and raw meminfo, activity, gfxinfo and Calendar logcat evidence. Attach or link both run directories here, with the build and device identities and threshold verdict. The first observed settlement establishes the baseline; 500 further adjacent settlements are required. Native/Dalvik PSS is not allocated heap, Hermes JS heap is unavailable from `dumpsys meminfo`, and mixed frame windows do not prove the product's named gesture thresholds. Missing measures are unknown and cannot satisfy a gate. The [release checklist](../../../mobile/releases/06-calendar-paging-gate.md) applies to preview, production and OTA distribution; code merges remain permitted.
