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
