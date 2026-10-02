**For:** the Calendar paging owner before the E07 release decision.

# Android chained swipes still miss the release gate

The OnePlus 6 `55574e46` perf APK commits all ten forward/back chains in five harness passes,
with one settle at each chain end. Forward chains land +15–16 of 20 pages and backward chains
land −16 of 20. One of five `reversal-10` runs ends one page behind its start. Diagonals land
20/20 and flings 5/5 in every pass. P01 requires exact 20/20 chained swipes, so the Calendar
is not ready for release. The 45-frame UI-thread rest check has focused held-touch, pinch,
ignored-command and delayed-command tests; it did not need to intervene in these ten device
chains. These runs cannot establish the required 25/25 settle rate for a native replacement.

The current React Native Android snap chooses a page from the finger's lift offset. The
horizontal scroll view does not receive the `ACTION_DOWN` that cancels its previous post-touch
snap when RNGH owns the touch. Removing the horizontal `GestureDetector` leaves chained landing
unchanged and loses most diagonal starts. `shouldActivateOnStart(true)` produces unsettled
chains. Making page content `pointerEvents="box-none"` retains diagonals but does not improve
chained landing. RNGH's own ScrollView wraps the same React Native ScrollView with a native
gesture handler, so it offers no separate cancellation path.

P01 remains a release blocker. The recommended next decision is a bounded native pager prototype
on the PC or the owned-pager fallback from R08. A native intervention would revise D08's
no-native-module boundary and needs owner scope approval and a new perf APK. Proposed prototype
evaluation criteria are at least 19/20 chained landing, 25/25 chain settlements, 20/20 diagonals,
exact reversals, and an iOS Simulator smoke pass. These are investigation criteria, not approval
to publish: exact 20/20 chained landing remains P01's release target. D08 continues to permit
unfinished work on `main`.

Evidence and five committed summary pairs:
`docs/projects/calendar-native-paging/evidence/E04-android-chained-swipes.md` and
`mobile/perf/samples/t08b-55574e46-{1,2,3,4,5}/`.
