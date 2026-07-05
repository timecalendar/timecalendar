## Context

The "Mes calendriers" management screen merged at `b3104f5` (`add-mobile-user-calendars`).
A `/iterate-screen` native/rn/a11y panel then reviewed it and produced a consolidated
disposition (the authoritative triage). The data layer, the visibility-filter-at-the-seam
(ADR 031), the delete pattern, and the observability posture are all sound and stay. What
this refinement lands is the panel's set of **machine-verifiable** presentation and
accessibility fixes, and it **records** the panel's two deferral buckets so nothing is
silently dropped.

The load-bearing finding: the row's `accessibilityActions` + `onAccessibilityAction` were
declared on the plain row `View`. All three reviewers independently verified against the
installed RN 0.85.3 sources that on iOS `RCTViewComponentView` only becomes an accessibility
element when `accessible` is set, and UIKit does not inherit custom actions from a
non-element ancestor — so the delete action is **dead on iOS**. The screen's own test passed
because it fired the action on that same unreachable node. This refinement is therefore also
a correctness fix, not merely polish.

Constraints (binding, from the task brief + the Architecture Book):

- **No new dependency, no new Drizzle table, no new migration, no native/`app.config.ts`/
  babel change.** This is a screen + a one-line hooks memo + i18n + tests. If any fix turns
  out to need a new dep/schema, the scope was misread — stop and escalate.
- **Hold the gates:** the events.ts / actions.ts 90% branch gate stays green (untouched
  logic); the screen's 70% presentational floor holds, and the new Android-shape render test
  RAISES screen coverage.
- **i18n FR/EN parity** for every new/changed key.
- The delete pattern and the visibility-filter contract are **panel-decided / ADR-settled**
  and are NOT reopened here.

The nearest exemplars are the shipped `school-selection/ui/school-row.tsx` (pressed states,
body-weight row title) and `calendar/ui/event-details-screen.tsx` (the `headerRight` action).

## Goals / Non-Goals

**Goals:**

- Make the row's delete accessibility action reachable on **both** platforms by moving it
  onto a real accessibility element (the merged row-level toggle `Pressable`).
- Bring the screen to the Definition of Done on the machine-verifiable axes it was merged
  short of: a legible checked indicator in both schemes, pressed feedback, a visibility hint,
  a platform-correct add action, a non-flashing/non-false-announcing empty state, a stable
  reactive read, body-weight row typography, and i18n hygiene.
- Correct the tests so they prove the live feature (a11y action on a reachable element, the
  cancel branch, the Android shape) rather than pass against a dead one.
- Record the two deferred buckets (device-pass, token-layer) as inbox handoffs so the
  reviewer and implementer skip-and-continue rather than block, and so nothing is dropped.

**Non-Goals:**

- **The swipe grammar/physics rework and the explicit iOS toggle announce** — deferred to
  the device pass (see Decision 4); jest-expo cannot verify gesture feel or iOS
  announcement.
- **A designed destructive/`danger` token pair + the pink-text contrast fix** — deferred to
  a token-layer follow-up (see Decision 5); it is a design-system decision spanning more than
  this screen and is user/design-owned.
- **Reopening the delete pattern, the visibility-filter contract (ADR 031), the data layer,
  or the route/Profile wiring** — unchanged.
- **Dynamic Type icon scaling** — acceptable as-is (row height grows with text, no clip);
  noted for the device pass, not built.

## Decisions

### Decision 1 — The row-level toggle Pressable carries the a11y action (the crux)

The leading checkbox `Pressable` and the name/school text merge into ONE **row-level toggle
`Pressable`** that spans the row. It keeps `accessibilityRole="checkbox"` +
`accessibilityState={{ checked }}`, takes the merged `accessibilityLabel` (from
`userCalendars.rowLabel`), and now **owns** the `accessibilityActions=[{ name: "delete",
label }]` + `onAccessibilityAction`. Because a `Pressable` is a real accessibility element,
the custom action is reachable by VoiceOver/TalkBack. The delete stays a **sibling**
`Pressable` in the same parent row `View` (no nested touchables — `no-nested-touchables` is
an error rule). The parent row `View` stays plain and MUST NOT get `accessible={true}`:
setting it would flatten the children and destroy the two-target (toggle + delete) design.
The redundant text is hidden from AT (`importantForAccessibility="no-hide-descendants"` on
Android / `accessibilityElementsHidden` on iOS) so the name is not spoken three times per
row. The full-row toggle target also clears Android's 48dp floor (the old 28px box + 8
hitSlop = 44, which missed 48dp).

This is not ADR-worthy: it does not change any system-wide contract; it fixes the encoding of
an existing per-row a11y requirement. ADR 031 (the visibility filter) is untouched.

### Decision 2 — Checked indicator: a checkmark on `primaryStrong`, reusing the existing token pair

The old checked indicator was a 12px dot whose knockout color was `theme.background` → black
on the pink fill in dark mode. Replace it with a checkmark (iOS `SymbolView name="checkmark"`
— already imported; Android a `✓` `ThemedText` glyph, no icon font / no new dep) tinted
`onPrimary` on a `primaryStrong` fill. This reuses the **existing** `onPrimary`-on-
`primaryStrong` pair documented in `tokens.ts` (5.87:1, AA body, scheme-independent) — the
blessed white-text-on-brand pairing. **No new token** (the destructive-red token is a
separate deferred decision, Decision 5). The unchecked box keeps the `primary` border on a
transparent fill.

### Decision 3 — The add affordance is a native header action

Move the add from an in-body 1px-`primary`-bordered top-left text button (off-platform on
both OSes) into `Stack.Screen options.headerRight`, mirroring the shipped event-details
header action: a primary-tinted `smallBold` `Pressable` with `hitSlop`, a pressed-state
affordance, a **short** visible label (`userCalendars.add.short` — "Add"/"Ajouter"), and the
full "Ajouter un calendrier" string kept as `accessibilityLabel` (so the accessible name
stays descriptive while the header stays compact). Routes to `/onboarding/school` unchanged.
Placing the add in the header also makes its tint match the repo's shipped header-action
pattern, so any residual header-tint contrast question is repo-wide, not this screen's
(Decision 5).

### Decision 4 (DEFER — device pass) — Swipe grammar/physics + explicit iOS toggle announce

Two panel findings are correct but **only iOS-device-verifiable**, so shipping a blind guess
would risk regressing confirmed-working behavior:

- **Swipe grammar + physics.** The prescribed improvement (remove `onSwipeableWillOpen`, make
  the revealed panel a tappable `Pressable`→`requestDelete` resting at a partial swipe like
  Mail, drop `friction={2}` for 1:1 tracking, add `overshootRight={false}`, drop the
  `rightThreshold={40}` override, and fix the ":194 full swipe" comment to "an opening
  swipe") is correct per gesture-handler source but changes device feel jest-expo cannot
  verify. The current swipe works and is confirm-safe. Apply + verify together during the
  device pass.
- **Explicit iOS toggle announce.** Fabric likely does not re-announce the checkbox state
  change on iOS (Android does via `TYPE_VIEW_CLICKED`). The sanctioned remedy is
  `announceForAccessibility` on the resolved `setVisible`, **iOS-gated** (else Android
  double-announces). The silence must be confirmed on device first, then the gated fix
  applied — otherwise we risk a double-announce on Android or an unnecessary announce.

Handoff: `docs/react-native-migration/inbox/2026-07-05-user-calendars-device-pass-refine.md`.
The implementer/reviewer skip-and-continue (the tasks entry is `- [ ]` with a `(HUMAN: …)`
suffix); the ship is not blocked on it.

### Decision 5 (DEFER — token layer) — Destructive color + text contrast

Destructive affordances currently render in brand pink, not system red, and pink 14px labels
fail AA in light: the (former) add button `primary` on `#fff` = 4.35:1 (needs 4.5); the
Android trash `primary` on `backgroundElement` `#F0F0F3` = 3.82:1. The correct fix is a
**designed `danger`/`error` token pair** with a separate fill (system red
`#FF3B30`/`#FF453A` for icon/panel — the 3:1 non-text bar) and darker text shades (AA 4.5:1
on each background), per-scheme verified. That is a design-system decision that spans more
than this screen and is user/design-owned (RN reviewer: "flag for the token layer's backlog,
not this ship") — adding a token here speculatively would violate R-2 (earned, not
speculative) and the "no new token" constraint. Moving the add into the header (Decision 3)
already aligns its tint with the shipped event-details pattern, so its contrast is now a
repo-wide question. Dynamic Type icon scaling (fixed 22px SymbolView) rides along as
acceptable-for-now, noted for the device pass.

Handoff: `docs/react-native-migration/inbox/2026-07-05-destructive-token-contrast.md` with
the exact failing ratios. No token is added in this change.

### Decision 6 — Memoize the reactive read (identity stability)

`useUserCalendars()` returns `useMemo(() => data.map(rowToCalendar), [data])`. The unmemoized
`data.map(...)` produced a fresh array every render, which defeats the `useCalendarEvents`
`useMemo` (ADR 031) that lists `calendars` as a dependency — the read exists to feed that
memo, so it must be identity-stable. This is a one-line correctness/perf fix inside the
existing hook; the personal-events read has the same pre-existing issue but is **out of scope**
(flagged, not fixed here).

## Risks / Trade-offs

- **[The a11y-action move changes the accessibility tree]** → The action is now on a
  reachable element on both platforms; the corrected test fires it on that element. Focus
  order / announcement quality on device stays an inbox device-pass item (Decision 4).
- **[Merging the checkbox + text into one wide toggle enlarges the toggle hit area]** → This
  is the intent (48dp Android floor); the delete stays a separate ≥44 sibling target, so the
  two controls remain independently reachable and never nest.
- **[The `loaded` gate leans on `useLiveQuery` `updatedAt` being undefined until first
  resolve]** → Matches the installed drizzle-orm-expo behavior; the empty-state test can
  assert both the pre-load (nothing rendered) and loaded-empty branches, so the gate is
  machine-covered.
- **[Deferred buckets could be forgotten]** → Both are inboxed with what/why/how-to-verify
  and marked `- [ ]` `(HUMAN: …)` in tasks.md, so the reviewer sees them; ADR 031 and the
  delete-pattern contract are unchanged, so nothing structural depends on them.
- **[Android `✓` glyph vs. iOS SF Symbol asymmetry]** → Intentional, mirroring the shipped
  cross-platform trash affordance (Decision 6 of the original change); no icon font is added.
