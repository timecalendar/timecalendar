# (HUMAN: physical iOS, iPad portrait, and Android Activity release-candidate passes)

This checklist is explicit follow-up evidence and does **not** block PR #333 or its repository
merge. Record the device/OS/build and attach the evidence link in each slot.

| Platform                      | Scenario                                                                          | Expected result                                                                            | Evidence |
| ----------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------- |
| Supported iPhone              | Scroll cached history and a large change group; pull to refresh; load older pages | Stable 60 Hz-class interaction, wrapped content, no duplicate rows, visible progress/retry | Pending  |
| Supported iPad, portrait      | Repeat cached scrolling, large group, pull refresh, and pagination                | No clipping or unusable width; ordering and accessibility remain correct                   | Pending  |
| Representative Android device | Repeat cached scrolling, large group, pull refresh, and pagination                | No sustained jank or memory termination; TalkBack labels and 48dp targets hold             | Pending  |
| iOS and Android               | Exercise screen-open, foreground, calendar-sync, and relevant-push triggers       | Overlaps collapse to one request; silent triggers never surface an unrelated failure       | Pending  |
| iOS and Android, offline      | Open cached Activity, restart, navigate, then remove a held calendar              | Cache remains readable; details/navigation are honest; removed history disappears          | Pending  |
| Android development app       | Bound Firebase DebugView/Crashlytics to the fixture window                        | No Activity analytics event; only static Crashlytics contexts and no payload identity      | Pending  |
| Previous store release        | Send its valid unversioned calendar-log request to the candidate server           | HTTP 200 legacy array response with unchanged behavior                                     | Pending  |
