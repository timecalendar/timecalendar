## 1. Establish the zoom domain and persistence

- [x] 1.1 Add named 40/60/120 px/hour bounds, the 10 px/hour command step, total scale validation, dynamic full-day height, inset-aware raw-offset bounds, and focal-preserving offset helpers to the pure Calendar data layer; verify every introduced statement/branch plus focal-invariance, finite-recovery, repeated-command, and clamp properties in `time-grid.test.ts`.
- [x] 1.2 Add `settings.calendarZoomPixelsPerHour` to the Settings types/store/hooks and `@/storage` inventory as an environment-independent numeric key; verify valid intermediates/bounds, missing/corrupt/non-finite/out-of-range recovery, reactive Day/Week sharing, restart reads, classification coverage, and backend-reset preservation in the focused preference/storage suites.

## 2. Prove native gesture arbitration before feature expansion

- [ ] 2.1 Build the smallest real-route Gesture Handler/Reanimated pinch integration around the existing automatic-inset `ScrollView` and three-page `PagerView`, keeping one native vertical owner and one pager; add focused lifecycle/component proof for pointer-count changes, cancellation, generation replacement, backgrounding, unmount, and no stale page commit.
- [ ] 2.2 Run the bounded content-free iOS/Android experiment: add a second finger during vertical drag, vertical momentum, horizontal drag, and horizontal settle around a marked reference hour; record the exact revision/build, platform/device, focal drift/release result, header/page result, and low-end timing when available before continuing. If any arbitration case fails, repair it in this slice and repeat this task rather than replacing native motion or deferring the defect.

## 3. Implement live focal-preserving zoom

- [ ] 3.1 Add a feature-private zoom coordinator with Reanimated shared values for live raw offset, scale, viewport height, native insets, focal position, pinch baseline, and active state; use supported native scroll/gesture handlers so frame updates never write React state, MMKV, formatted labels, event data, navigation, or a `runOnJS` bridge.
- [ ] 3.2 Drive the gutter labels, major/minor lines, 24:00 closing boundary, day columns, all three pager pages, and scroll content extent from the same dynamic scale while retaining the extra closing hairline, automatic insets, synchronized dated header, and coherent clamp behavior.
- [ ] 3.3 Settle a pinch through one clamped scale/offset result, persist it once, restore it across Day/Week switches and fresh opens, leave Agenda independent, and verify no release jump or obsolete callback can overwrite newer geometry.

## 4. Add accessible non-pinch controls

- [ ] 4.1 Extend the existing iOS and Android Calendar platform menus with localized Zoom in, Zoom out, and Reset actions for Day/Week, preserving the measured usable viewport-center clock coordinate through the same zoom coordinator.
- [ ] 4.2 Expose correct disabled state at 40/120/default, retain 44 pt iOS and 48 dp Android target posture, announce one settled rounded percentage per successful command, communicate limit state, and add French/English typed-key parity plus focused menu/screen accessibility tests.

## 5. Preserve repository and architecture contracts

- [ ] 5.1 Evolve `mobile/calendar-owned-shell.contract.test.ts` to inventory the bounded zoom modules and assert one renderer, one automatic-inset vertical owner, one native pager, three pages, installed gesture/Reanimated ownership, environment-independent preference classification, and absence of per-frame React-state, alternate motion, fallback, or compatibility paths.
- [ ] 5.2 Extend renderer and Calendar screen tests for focal settlement, repeated commands, limit disabling/announcements, day/week sharing, restart/reset recovery, interrupted horizontal/vertical motion, weekend preferences, Agenda/details access, and the previously accepted paging/header/offset behavior; run every edited suite.
- [ ] 5.3 Update `docs/mobile/architecture-book/calendar.md`, `storage.md`, `testing.md`, and `CHANGELOG.md` to describe the current T06 contract and device-evidence boundary; add no ADR unless implementation evidence forces a costly-to-reverse change.

## 6. Verify and prepare acceptance evidence

- [ ] 6.1 From `mobile/`, run the focused edited suites plus renderer/screen/settings/storage/repository-contract checks, applicable 100% pure-zoom coverage, `npx tsc --noEmit`, `npm run lint`, scoped Prettier checks, and `npm run react-doctor:changed`; record exact commands, results, and any justified N/A DoD axes.
- [ ] 6.2 Confirm the preserved three Maestro journeys/Agenda helper and run the applicable device-free harness/selector proof without adding a fourth top-level journey; record that this host cannot claim native execution and attach available content-free iOS/Android evidence to the exact tested revision.
- [ ] 6.3 Prepare the testable build handoff with fabricated fixture/reference-hour setup, 40/60/120 initial values, exact revision/runtime fingerprint, all agent results, limitations, and every canonical owner QA item (pinch focal stability, centered commands, both limits, second-finger precedence, shared restart/reset, momentum/partial-page repetition, and touched prior interactions); pause on this ticket for explicit owner acceptance and address feedback here before Reviewer merge.
