# User calendars — iOS device pass (swipe grammar + toggle announce)

Date: 2026-07-05
Change: `refine-mobile-user-calendars-a11y-native`
Screen: `mobile/src/features/calendar-sources/ui/user-calendars-screen.tsx`

Two `/iterate-screen` panel findings are correct but **only verifiable on a real iOS
device** — shipping a blind guess would risk regressing confirmed-working behavior, so they
are deferred to a device pass rather than dropped.

## 1. Swipe grammar + physics (native#2, native#3 MAJOR; rn#6 NIT)

The current iOS swipe-to-delete works and is confirm-safe (a full swipe/open opens the
`Alert`, never an instant commit). The prescribed improvement:

- Remove `onSwipeableWillOpen`; make the revealed right panel a tappable
  `Pressable` → `requestDelete` that **rests at a partial swipe** (Mail-style), rather than
  auto-triggering on open.
- Drop `friction={2}` (→ 1:1 finger tracking).
- Add `overshootRight={false}`.
- Drop the `rightThreshold={40}` override (use the default).
- Fix the code comment near `:194` ("full swipe" → "an opening swipe").

**Why deferred:** these change device feel (tracking, overshoot, rest position) that
jest-expo cannot simulate or assert. Apply and verify together on device.

**How to verify:** on an iOS device, swipe a row: the red trash panel tracks 1:1, does not
overshoot, and rests partially open; tapping the revealed panel opens the confirm (no instant
delete); composes with vertical scroll and the leading toggle; VoiceOver still reaches delete
via the toggle's accessibility action.

## 2. Explicit iOS toggle announce (a11y#4 MAJOR, device-gated)

Fabric likely does not re-announce the checkbox state change on iOS when `visible` toggles
(Android announces via `TYPE_VIEW_CLICKED`). Sanctioned remedy:
`AccessibilityInfo.announceForAccessibility(...)` on the **resolved** `setVisible`,
**`Platform.OS === "ios"`-gated** (else Android double-announces).

**Why deferred:** the silence must be confirmed on device first — applying it blind risks a
double-announce on Android or an unnecessary announce on iOS.

**How to verify:** with VoiceOver on, toggle a row and listen for the state change. If iOS is
silent, add the iOS-gated announce on the resolved write and re-verify both platforms
(Android must not double-announce).

## 3. Fold into the device-pass ship — panel re-review nits (all MINOR/NIT)

The Phase-5 disposition re-review passed every fix and accepted both defers above. It raised
these lower-severity items; apply them in the SAME ship as §1/§2 (a device-pass ship already
edits the screen, so batching avoids a disproportionate standalone cycle). None block anything.

Device-visual (verify on screen, both schemes / font scales):
- **Checked-box two-tone ring (native N1, MINOR).** The checked box keeps `borderColor:
  theme.primary` around a `primaryStrong` fill → a visible ring (esp. dark: #FF4081 on
  #C2185B). M3 selected checkboxes are a solid container, no separate outline. Fix: set the
  border to `theme.primaryStrong` when checked (keep `primary` for the unchecked outline).
- **Delete button doesn't fill row height (native N2, NIT).** `styles.delete` is a 44pt band
  centered in a ~70pt row → the ripple/pressed patch floats mid-row and leaves dead strips.
  Fix: `alignSelf: "stretch"` on `styles.delete` (drop `minHeight`, keep `minWidth: 44`).
- **Empty-state title uses the 32pt `subtitle` token (native N3, NIT).** Reads page-hero; the
  type scale has no step between 16 and 32. Least-bad today (no-new-token ship) — revisit if
  the scale grows a mid step.
- **Android checkmark can clip at large font scales (a11y N1, NIT).** The Android "✓" is
  `smallBold` text that scales with OS font size inside a fixed 28×28 box. Check at ~2×
  Dynamic Type; if it clips, a `maxFontSizeMultiplier` on that one decorative glyph is
  legitimate (it's a mark, not copy — same reasoning as the CHECKMARK comment).

Machine-verifiable code cleanup (no device needed; fold in for free):
- **`jest.replaceProperty(Platform, "OS", "android")` leaks past its test (rn N1, MINOR).**
  `jest.config.js` sets neither `restoreMocks` nor `resetMocks`, and `clearAllMocks()` does
  not restore replaced properties, so every test after the Android render test runs with
  `Platform.OS === "android"`. Harmless today (only the write-failure test follows, passes on
  either platform) but a real theater trap for any test appended below it. Fix: capture the
  handle — `const os = jest.replaceProperty(...)` + `os.restore()` — or add
  `afterEach(() => jest.restoreAllMocks())` in that file.
- **Loaded-gate hook-ordering assumption (rn, comment-level).** `loaded` comes from a second
  `useLiveQuery` instance while `calendars` comes from the first; correctness relies on
  `useUserCalendars()` being called before `useUserCalendarsLoaded()` (drizzle dispatches
  first reads in hook-order on one serialized connection). Add a one-line comment in
  `hooks.ts` stating the ordering assumption, or (cleaner, purely additive) expose a combined
  `useUserCalendarsState(): { calendars, loaded }` derived from one query instance and have
  the screen use it — eliminates the race class. Not worth a standalone re-spin.
