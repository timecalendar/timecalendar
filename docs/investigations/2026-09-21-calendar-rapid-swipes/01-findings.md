# Rapid calendar swipes on iPhone

## Findings

The owned React Native calendar renders exactly three pages: previous, current,
and next. `useOwnedCalendarCoordinator` records `onPageSelected`, but commits the
new date only when `onPageScrollStateChanged` reports `idle`. On iOS, the installed
`react-native-pager-view` 8.0.1 emits that state after deceleration or programmatic
scroll animation ends (or a drag ends without deceleration).

Until that commit, there is no second page in the same direction beyond the
destination edge. `overdrag={false}` also disables bouncing at the boundary.
Interrupting the first animation cannot continue into another week that is not
in the current three-page window.

Every accepted transition increments `generation`. The pager's React key is
`${generation}:${geometryRevision}`, so accepting a week replaces the native
pager and its children. A touch overlapping this replacement may be interrupted.
The coordinator also ignores callbacks from consumed or replaced generations.
The header freezes on the accepted destination until the new context arrives.

The owner's iPhone trace confirms the three-page boundary prevents a second
forward swipe from advancing another week. The iOS pager uses SwiftUI's paged
`TabView` and an underlying collection view; its inspected delegate does not
explicitly disable scrolling while settling, and the trace shows it accepting
another drag before settlement.

The shell tests explicitly verify settlement only after `idle`, suppression of
pending accessibility requests, and stale-generation rejection. Their native
pager mock cannot establish whether UIKit accepts a second physical gesture.

## Owner trace

The provided development-build log contains this sequence (JavaScript `atMs`):

| Time | Observation |
| --- | --- |
| 201420425 | First swipe begins settling in generation 3. |
| 201420465 | Destination page 2 is selected; generation remains 3. |
| 201420706 | Second touch begins before settlement. |
| 201420709 | Native pager accepts `dragging`, at position 1 + offset 0.99716. |
| 201420762 | Second drag ends at page 2; pager reports `idle`. |
| 201420763 | Only one forward transition is committed, revision 4. |
| 201420908 | Generation 4 resets to the center. |
| 201420975 | React effect reports the replacement pager key mounted. |

Both swipes occur in the same generation with matching geometry,
`callbacksBlocked: false`, `pinchActive: false`, and `consumed: false`. The second
gesture is recognized but has no destination beyond page 2. This sequence does
not show a touch interrupted by pager replacement: replacement happens after
the second touch ends.

Across the four commits in the supplied trace, settlement-to-generation-reset
intervals are 145, 145, 145, and 174 ms. Settlement-to-mount-effect intervals are
212, 192, 186, and 215 ms. These development-build timings include logging and
React scheduling; they do not measure native frame readiness or isolate render
cost. They show additional work between committing a page and reporting its
replacement, on top of the boundary limitation.

The zoom hook's pinch baseline initializes from the resolved input scale. Reading
`pixelsPerHour.get()` as a hook initializer executes during every component
render and violates Reanimated's shared-value rules. The live baseline is still
captured inside the pinch-start worklet. The render-time read explains a source
of the reported warnings; those warnings do not explain the missing page.

## Diagnostic status

The application has no temporary `[calendar-paging]` logger, debug environment
flag handling, touch listeners, lifecycle logging effects, or diagnostic pager
state ref. The capture mechanism and its interpretation are preserved in
[the investigation trail](02-investigation-trail.md). The old
`EXPO_PUBLIC_CALENDAR_PAGING_DEBUG=1` flag has no effect with the current source.

The decisive owner trace is preserved as a
[JSONL excerpt](evidence/iphone-generation-3.jsonl). The excerpt contains the
first two swipes and the following generation reset; it is not the full console
transcript. Later transitions are recorded in the timing table in the
investigation trail. No new device capture is needed to establish the boundary
failure.

## Fix direction

Continuous rapid navigation needs adjacent destinations available during motion
and a native scrolling surface that survives ordinary page acceptance. Removing
the `idle` check alone risks committing a cancelled swipe or replacing the pager
under the finger. A stable pager with a wider/recycled page window needs explicit
handling of interrupted motion, reversal, date/header agreement, and stale
callbacks. The supplied trace supports this structural fix; more logging is not
needed to establish the same-direction boundary failure.
