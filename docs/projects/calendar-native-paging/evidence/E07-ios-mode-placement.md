# iOS Calendar mode placement

## Current behavior

Each Day or Week visit owns a distinct pager generation. Layout, scroll, touch, and accessible page callbacks from an older visit cannot place or advance the current one. The iOS horizontal pager remains hidden during initial placement until a native scroll event or a measurement of its content marker confirms the target offset. A measured miss permits at most three nonanimated retries, six frames apart. Missing measurements wait within the same bound without sending a command. Exhaustion reports `initial-placement-miss` and leaves the unverified page hidden.

## Evidence

| Source and runtime | Observation |
| --- | --- |
| JS `5201ef6d`, compatible iOS Debug binary | The pinned Week Sep 28 header was blank on entry and on the first Day → Week return. The page control still named Sep 28. A later four-switch repeat was visible, so the failure was intermittent. |
| Diagnostic JS `bffc26c8`, compatible iOS Debug binary | The successful Week generation reached measured native offset 91520 by frame 6 and remained there through frame 90. A blank Day generation had matching viewport and content callbacks, a ready animated ref, and an issued placement command, but measured offset 0 at frames 1, 6, 30, and 90 against requested offset 91520. No scroll event followed. This supports a lost initial native placement command for that failure. |
| JS `2ece8fdf17e89648611234a2550fe72fe77b0005`, native SHA-256 `3ab43cd4d156503f7c7588f3318baf72e992d2a8c982c99be3ff32d3d447c88e` | On the iOS Simulator, an explicit Week Sep 28–Oct 2 baseline and 12 Day/Week returns matched the expected visible date anchors in both stable reads at approximately 2 and 3 seconds: **13/13 comparisons**. Fresh cold Day Oct 2 and cold Week Sep 28–Oct 2 each passed both reads. Screenshots show the date grid; no `initial-placement-miss` appeared in the sanitized paging log. |

The final Simulator run used the compatible `ff5841b4` Debug native source, accessibility extra extra extra large text, and weekends hidden. The first scripted sequence used an incorrect Day Oct 2 expectation after Week normalized the controller anchor to Monday Sep 28, so its strict oracle verdict is excluded. A cold probe made before Home finished loading is also excluded. The corrected sequence and cold ready probes provide the results above. Raw captures remain outside Git.

## Limits

This is a bounded iOS Simulator functional result for mode switching. Physical iOS behavior is unmeasured. Android P01 remains failed, and the separate E07 release gates and owner verdict remain in force; this evidence authorizes no preview, store, or OTA release.
