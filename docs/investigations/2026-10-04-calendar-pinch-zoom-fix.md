# Calendar pinch zoom implementation verification

The renderer keeps visible geometry on fixed native layout baselines. Hour lines and labels
translate from `top: 0`. Committed event surfaces translate from `top: 0` and retain minimum-zoom
slice dimensions: rounded caps stay fixed, the middle and clip scale with live height, and inverse
text scaling keeps type readable. All five event animation callbacks capture `pixelsPerHour`
directly, including the four height-dependent styles.

Event press/focus targets and the current-time semantic cue have separate plain native layout
bounds calculated from settled scale. The visible siblings have no pointer or accessibility
ownership. React settlement updates those target bounds and content-density choices without
changing any visible layout baseline or resetting a visible transform. The single vertical content
extent remains driven by the existing live zoom hook. The iOS vertical ScrollView enables
`scrollToOverflowEnabled`: a pinch's bounded focal scroll can precede Fabric's new native content
height without being clamped against the old height. Focus reveal, initial/external positioning,
background restoration and cancellation clamp their offsets against live height and automatic
insets. Initial offsets are preserved before viewport measurement; negative inset offsets remain
valid. Paging, conflict planning and native focus observers retain their existing owners.

## Reproducible host verification

Run commands in `mobile/`, the standalone npm project:

```sh
TZ=UTC npm test -- --runInBand calendar-pinch-worklets.contract.test.ts
node --test scripts/test-support/calendar-pinch-worklets.test.cjs
TZ=UTC npm test -- --runInBand src/features/calendar/renderer src/features/calendar/data/time-grid.test.ts src/features/calendar/data/timeline-geometry.test.ts src/features/calendar/ui/calendar-screen.test.tsx calendar-owned-shell.contract.test.ts calendar-pinch-worklets.contract.test.ts
npx tsc --noEmit
npm run react-compiler:check
npx eslint src/features/calendar/renderer/owned-calendar-{zoom,focus,coordinator,geometry}.ts src/features/calendar/renderer/owned-calendar-{canvas,page,shell}.tsx src/features/calendar/renderer/owned-calendar-shell.test.tsx src/features/calendar/renderer/owned-calendar-zoom.test.ts src/features/calendar/ui/calendar-screen.test.tsx calendar-owned-shell.contract.test.ts calendar-pinch-worklets.contract.test.ts scripts/test-support/*.cjs --max-warnings 0
TZ=UTC npm test -- --runInBand
```

The worklet contract runs a fresh Node process so Jest's Reanimated mock and Babel test environment
cannot hide missing subscriptions. It compiles whole production renderer files using the repository's
Expo Babel configuration with native iOS/Hermes caller settings and exports private component seams
only in the evaluated test module. It uses the installed Reanimated `createMapperRegistry`, with
its normal closure-input extraction, and a shared-value protocol test double that records listeners.
Host primitives, React hook plumbing and native scheduling are controlled by the harness; this is
not a replacement for Fabric/UIKit or hardware execution.

Eleven Node cases cover:

- Subscription and repeated shared-value changes without a component rerender for hour-long,
  two-minute, one-minute and point events; zoom in/out, bounds and returning to the cancellation
  baseline; constant cap height, live clip height and unit composite text scale.
- Five zoom transitions with both independently delivered native states: new React layout with
  old animated props, and old layout with new animated props. Full event surfaces, short/point
  surfaces, grid boundaries, labels and the current-time cue have invariant painted geometry.
- Consecutive settled zoom targets on iOS and Android, including day boundaries, minimum target
  sizes, ordinary native geometry and focus-observer/semantic-button ownership.

The shell component suite additionally exercises actual production press routing and focus delivery
through consecutive settled zooms, unique semantic buttons, hidden visual siblings, conflict
selection and the existing gesture/paging lifecycle. Existing zoom tests exercise real gesture
handler callbacks for focal preservation and cancellation. The stale-height test runs the actual
pinch handlers and scroll reaction against a deterministic adapter for RN iOS's `scrollTo` clamp,
keeping native content height stale through the final pinch frame. Separate tests cover live
zoom-dependent focus/restoration bounds, negative automatic-inset offsets, unmeasured initial
positioning and cancelling a pinch that started during overscroll.

To prove the regression detection without modifying the working tree:

```sh
mkdir -p /tmp/timecalendar-pinch-baseline
for file in owned-calendar-page.tsx owned-calendar-geometry.ts owned-calendar-canvas.tsx; do
  git show b1a4d02bd0f46b75abbf7ad138454d4f68a046e5:mobile/src/features/calendar/renderer/$file > /tmp/timecalendar-pinch-baseline/$file
done
CALENDAR_WORKLET_SOURCE_ROOT=/tmp/timecalendar-pinch-baseline node --test scripts/test-support/calendar-pinch-worklets.test.cjs
```

The original renderer fails all eleven cases. The dependency tests observe one listener instead
of five: only the event anchor subscribes, leaving all four height styles unsubscribed. The mixed
60-to-80 settlement test reports event top 1000 instead of 800, exactly the independently observed
200-point native transient. These failures derive from executed compiled worklets and composed
geometry, rather than source-text matching or final-style snapshots alone.

## Results and limits

- Compiled worklet harness: 11/11 passing; original source: 11/11 failing as expected.
- Renderer, zoom, pager, calendar screen, grid/interval geometry and repository contracts: 11
  suites, 243 tests pass.
- Full clean-source mobile suite: 231 suites, 2286 tests pass in 48.7 seconds.
- Targeted ESLint: passes with zero warnings; `git diff --check` passes.
- Clean-source TypeScript: passes; React Compiler self-test passes and all 24 renderer functions
  compile without bailout.

Some component tests emit React overlapping `act()` warnings despite passing. The compiled harness
models two delivery orders and style composition, not actual native paint timing, text rasterization,
scroll momentum, physical multitouch or assistive technology. Its private Reanimated mapper seam
must be reviewed when that dependency changes.

The coordinator independently verified the final source on iPhone 17 Pro Simulator, iOS 26.5:

- XCTest `testPinchInAndOut` passes three accepted native pinches (in/out/in), checks native event
  height and 10:00/11:00 alignment, and successfully taps the event after each gesture. Settled
  scales are approximately 104.9064, 78.7064 and 96.4287 pixels/hour.
- All 169 gesture-video frames from the first scale change keep event start and end within one
  physical pixel of the corresponding hour lines. Two warm-up scroll frames precede the first
  pinch and obscure grid lines under the native scroll indicator.
- The deterministic 60-to-80 recording has 19 frames with at most one physical pixel of grid
  error. The compared calendar rectangle is pixel-identical held versus released, zoom-out held
  versus released, and cancelled versus baseline. Settled native accessibility frames track
  60/80-point event heights.
- The bottom-boundary case moves raw offset 732.3333 to 1176.4444, beyond the previous native
  maximum of approximately 732.6667. Its held/released, zoom-out and cancellation comparisons
  are also pixel-identical.
- Temporary routes and instrumentation are removed. All seven changed production renderer
  source hashes match both the clean host-tested manifest and the native-tested frozen source.

`native-verification.json` records the simulator, measured rectangles, source manifest and video
names. The evidence directory preserves the Swift XCTest source, its result bundle, videos and
screenshots. This is simulator verification, not physical-device, Android native or VoiceOver
acceptance; those remain unclaimed.

Baseline evidence lives in
`~/.local/share/timecalendar-evidence/2026-10-04/pinch-zoom-investigation/`.
Coordinator native evidence lives in
`~/.local/share/timecalendar-evidence/2026-10-04/pinch-zoom-fixed/`.
Host test logs and the SHA-256 manifest of the tested production sources live in
`~/.local/share/timecalendar-evidence/2026-10-04/pinch-zoom-fix-host/`.

Future programmatic vertical scroll paths must use the shared live bounds because iOS command
clamping is bypassed. The private mapper test seam needs review on Reanimated upgrades.
Physical-device, Android native and assistive-technology QA remain separate acceptance gates.
