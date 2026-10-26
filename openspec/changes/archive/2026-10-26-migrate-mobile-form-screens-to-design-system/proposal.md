# Form screens on the design system (roadmap slice 5.2)

## Why

Roadmap slice 5.2 (`docs/mobile/design-system-audit/migration-roadmap.md`, Phase 5) moves the
institution-name, programme, iCal URL and feedback screens fully onto `@/design`. Slices 3.1 and
3.4 already swapped their buttons and inputs for `Button` and `TextField`. What remains is the
layout rhythm each screen still writes for itself and one deprecated text prop:

- The four screens, the `KeyboardSafeActionLayout` gallery fixture and the personal-event editor
  each restate the same action-region spacing (`paddingTop: Spacing.three`,
  `paddingBottom: Spacing.four`, and `gap: Spacing.two` on three of them), for example
  `institution-name-screen.tsx:106-108`, `programme-screen.tsx:154-156`,
  `ical-url-screen.tsx:217-221` and `feedback-screen.tsx:188`.
- The three centred forms restate the centred-content block (`flexGrow: 1`,
  `justifyContent: "center"`, `gap: Spacing.three`). Onboarding shares it through
  `stepStyles.formContent` (`step-styles.ts:25-29`), and `ical-url-screen.tsx:212-216` copies it
  because a calendar-sources screen cannot import onboarding UI (the audit's
  duplication-and-drift.md flags this copy). A centred form must also turn off
  `scrollsUnderHeader` (navigation.md). Nothing enforces that today: the rule lives in a comment at
  `keyboard-safe-action-layout.tsx:29-31`.
- `RootPage` already fills its parent (`root-page.tsx:85-87`). The screens still pass
  `style={stepStyles.fill}` or `style={styles.fill}`, which does nothing.
- Feedback's sending status uses the deprecated `themeColor="textSecondary"`
  (`feedback-screen.tsx:128`). Slice 4.3 removes that prop once nothing uses it.

The slice is the system's first proof: once these changes land, a screen describes only its
content and behaviour.

## What Changes

- **`KeyboardSafeActionLayout` owns the form rhythm.** Its action region defaults to
  `gap: Spacing.two`, `paddingTop: Spacing.three` and `paddingBottom: Spacing.four`. Its scroll
  content gains `gap: Spacing.three` beside the existing `paddingTop: Spacing.four`. Caller styles
  still apply last, so they win.
- **`contentPlacement: "top" | "center"`** (default `"top"`). `"center"` centres the content in a
  scroll body that fills the viewport. Its type has no `scrollsUnderHeader` (`never`), and the
  layout forces `headerScrollProps(false)`, so the navigation.md rule is enforced by the type.
- **The four screens drop their local layout styles.** Institution name, programme and iCal URL
  remove their whole `StyleSheet` (and the `Spacing` and `stepStyles` imports), pass
  `contentPlacement="center"`, and stop passing `scrollsUnderHeader={false}` and the no-op
  `RootPage` fill. Feedback removes its `actions` style. It keeps its one-off `scrollContent` and
  `content` composition.
- **Feedback's sending status** uses `tone="secondary"`. The color is the same.
- **`step-styles.ts`** loses `formContent`, which no longer has a consumer.
- **The gallery fixture** `keyboard-safe-action-layout.gallery.tsx` shows the defaults and the
  `"center"` placement without its own styles.
- **No ratchet change.** None of the eight files (four routes, four `ui/` screens) is on any
  allowlist in `mobile/tools/eslint-rules/`, so no row is removed and no ceiling moves. The tasks
  verify this rather than assume it.
- **Architecture Book.** theming.md, navigation.md and features.md are updated, ADR 054 gets one
  sentence, and CHANGELOG.md gets an entry dated 2026-10-26.

All `testID`s and labels stay the same, and the Maestro flow `01-fresh-user-import.yaml` does not
change. Routing, validation, submission and Flutter-parity behaviour do not change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-root-page-primitives`: the focused-form requirement adds the layout-owned action and
  content rhythm and the type-enforced centred placement. It also records the keyboard behaviour
  the layout really uses: height avoidance with a measured offset on iOS, a measured
  keyboard-overlap inset on Android.
- `mobile-feedback`: the pending status is secondary-toned text through `tone`, and the action
  region uses the shared form rhythm.

## Impact

- Code (`mobile/src/`): `design/layout/keyboard-safe-action-layout.tsx` (+ `.test.tsx`,
  `.gallery.tsx`), `features/onboarding/ui/{institution-name-screen,programme-screen}.tsx`,
  `features/onboarding/ui/step-styles.ts`, `features/calendar-sources/ui/ical-url-screen.tsx`,
  `features/feedback/ui/feedback-screen.tsx`, and their colocated tests where an assertion moves.
- Routes `src/app/feedback.tsx`, `src/app/onboarding/{ical-url,institution-name,programme}.tsx`
  are already one-line re-exports and do not change.
- Visual: feedback's action region gains `paddingTop: Spacing.three` (12 pt) so it matches the
  other forms. The personal-event editor already matches the defaults and does not change. No
  other screen changes visually.
- No dependency, native, i18n or E2E selector change.
- Out of scope: slice 5.1 screens (welcome, connect, manual import), `PageIntro`'s own deprecated
  props (slice 4.3), the personal-event editor's now-redundant `footer` style (slice 5.3).
