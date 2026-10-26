# Design

## Context

Roadmap slice 5.2 covers four routes and their screens:

| Route (thin re-export) | Screen |
| --- | --- |
| `mobile/src/app/onboarding/institution-name.tsx:5` | `mobile/src/features/onboarding/ui/institution-name-screen.tsx` |
| `mobile/src/app/onboarding/programme.tsx:3` | `mobile/src/features/onboarding/ui/programme-screen.tsx` |
| `mobile/src/app/onboarding/ical-url.tsx:7` | `mobile/src/features/calendar-sources/ui/ical-url-screen.tsx` |
| `mobile/src/app/feedback.tsx:1` | `mobile/src/features/feedback/ui/feedback-screen.tsx` |

Slices 3.1 (`Button`, ADR 067) and 3.4 (`TextField`, ADR 070) already moved these screens to
`Button variant="filled"` and `TextField`. The screen-inventory and component-inventory entries
that mention `PrimaryAction`, `FieldError` and raw `TextInput` describe the tree before those
slices. The audit greps from `duplication-and-drift.md` → Method, run on the eight files at
`989bbd70`, match only:

| Grep | Hits |
| --- | --- |
| `StyleSheet\.create\(` | `institution-name-screen.tsx:106`, `programme-screen.tsx:154`, `ical-url-screen.tsx:208`, `feedback-screen.tsx:183` |
| `Spacing\.` (a reference count, not drift) | `institution-name-screen.tsx:107`, `programme-screen.tsx:155`, `ical-url-screen.tsx:215,218-220`, `feedback-screen.tsx:185,187,188` |
| deprecated `ThemedText` prop | `feedback-screen.tsx:128` `themeColor="textSecondary"` |

Every color, typography, shadow, spacing-literal, radius, hairline, opacity, border-width,
`hitSlop`, `ActivityIndicator`, `SymbolView`, `Link`/`asChild`, 44/48 min-size and `Platform`
grep returns nothing. No `Pressable`, touchable, raw `Text`, raw `TextInput` or `useTheme` remains
in these files.

**Ratchet status.** None of the eight paths is listed in any allowlist under
`mobile/tools/eslint-rules/` (`style-literal`, `raw-primitive`, `raw-button`, `raw-text-input`,
`ad-hoc-status`, `ad-hoc-separator`, `header-action`, `raw-event-color`). `eslint.config.js`
names none of them, and no script under `mobile/scripts/` or `scripts/` lists them. The current
ceilings, which this change does not touch:

| Allowlist test | Ceiling |
| --- | --- |
| `style-literal-allowlist.test.js` | `colorLiteral 1, typographyLiteral 7, legacyShadow 0, spacingLiteral 6, radiusLiteral 3` |
| `raw-primitive-allowlist.test.js` | `rawText 1, rawModal 0` |
| `raw-button-allowlist.test.js` | 5 |
| `ad-hoc-status-allowlist.test.js` | 2 |
| `raw-text-input-allowlist.test.js`, `ad-hoc-separator-allowlist.test.js`, `header-action-allowlist.test.js`, `raw-event-color-allowlist.test.js` | 1 each |

What remains is layout rhythm that every keyboard-safe form restates:

| Consumer | Action region | Content |
| --- | --- | --- |
| `institution-name-screen.tsx:107` | `paddingTop three, paddingBottom four` | `stepStyles.formContent` |
| `programme-screen.tsx:155` | `paddingTop three, paddingBottom four` | `stepStyles.formContent` |
| `ical-url-screen.tsx:217-221` | `gap two, paddingTop three, paddingBottom four` | own copy of `formContent` (`:212-216`) |
| `feedback-screen.tsx:188` | `gap two, paddingBottom four` | `scrollContent` `paddingBottom four` + inner `View` `gap four` |
| `keyboard-safe-action-layout.gallery.tsx:103-107` | `gap two, paddingTop three, paddingBottom four` | `gap three` (+ centred) |
| `personal-event-editor.tsx:126-129` (slice 5.3) | `paddingTop three, paddingBottom four` | `paddingBottom five, gap three` |

`stepStyles.formContent` (`step-styles.ts:25-29`) is `flexGrow 1, justifyContent center, gap
three`. It is used only by institution name and programme. Connect and manual import (slice 5.1)
use `fill` and `safeArea`. Every centred consumer also passes `scrollsUnderHeader={false}`, which
navigation.md requires for content that fills the viewport. Today only a comment states that rule
(`keyboard-safe-action-layout.tsx:29-31`). `RootPage` already sets `flex: 1` on its own root
(`root-page.tsx:85-87`), so `style={stepStyles.fill}` (`institution-name-screen.tsx:64`,
`programme-screen.tsx:111`) and `style={styles.fill}` (`ical-url-screen.tsx:144`) do nothing.

Maestro `01-fresh-user-import.yaml:24-69` uses `onboarding-programme-input`, `ical-url-input` and
`ical-url-submit`. `e2e/maestro-selectors.test.ts:307-324` pins those and asserts that
`ical-url-content` is absent from the flow.

## Goals / Non-Goals

**Goals:**

- The four screens contain only content, behaviour and `@/design` composition. Institution name,
  programme and iCal URL have no `StyleSheet`. Feedback keeps only its one-off composition.
- The layout primitive owns the repeated form rhythm, and the type enforces the centred-form
  header rule (Principle 1).
- No deprecated `ThemedText` prop remains in the four files.
- Every `testID`, accessibility label, route, validation and submission behaviour is unchanged.

**Non-Goals:**

- Slice 5.1 files: `welcome-screen`, `connect-screen`, `manual-import-screen`. `step-styles.ts`
  changes only by losing `formContent`.
- `PageIntro`'s internal `type="subtitle"` / `themeColor` (`root-page.tsx:75,78`). That is a
  design-layer call site, and slice 4.3 removes the aliases repo-wide.
- The personal-event editor's `footer` style, now equal to the defaults. Slice 5.3 deletes it.
- Any new primitive, token, string or route. `ButtonRow`, `Icon` and `StatusView` have no new use
  here: each screen has one action, no glyph, and its loading state is already `StatusView`
  through `ImportProgressView` (`import-progress-view.tsx:14`).
- Updating the audit snapshot documents (`screen-inventory.md`, `duplication-and-drift.md`).
  They are dated exploration and become history in Phase 6.

## Decisions

### D1. `KeyboardSafeActionLayout` owns the action-region and content rhythm

The action region defaults to `{ gap: Spacing.two, paddingTop: Spacing.three, paddingBottom:
Spacing.four }`, applied as `[laneStyle, styles.actions, actionContainerStyle]`. The content
defaults to `{ paddingTop: Spacing.four, gap: Spacing.three }`, applied as
`[laneStyle, styles.content, placement, contentContainerStyle]`.

Why: six consumers write the same action block, and four of them the same content gap. ADR 054
already gives this layout "the standard top spacing inside its scroll body". The rest of the rhythm
belongs to the same owner. Defaults keep caller styles last, so the personal-event editor
(single-child footer, same values) and feedback (single-child scroll body, so the content `gap`
has no effect) render identically, apart from D4.

Alternatives: a shared `formStyles` export in `@/design`. Rejected: it is still a style every
screen must remember to pass, and it adds a style-object API to a barrel that exports components.
A per-feature shared file: rejected, because calendar-sources cannot import onboarding UI (B-2),
which is why the iCal copy exists.

### D2. `contentPlacement: "top" | "center"`, with `scrollsUnderHeader` excluded by type

```ts
type KeyboardSafeActionLayoutProps = {
  children: ReactNode
  actions: ReactNode
  lane?: ResponsiveLane
  testID?: string
  contentTestID?: string
  actionsTestID?: string
  contentContainerStyle?: StyleProp<ViewStyle>
  actionContainerStyle?: StyleProp<ViewStyle>
} & (
  | { contentPlacement?: "top"; scrollsUnderHeader?: boolean }
  | { contentPlacement: "center"; scrollsUnderHeader?: never }
)
```

`"center"` adds `{ flexGrow: 1, justifyContent: "center" }` to the content and resolves the
scroller's header posture to `headerScrollProps(false)`. `"top"` keeps
`scrollsUnderHeader ?? true`. The comment at `:29-31` is replaced by the type. Its why moves to
navigation.md, which already states it.

Why: this encodes the navigation.md rule ("a centred form never scrolls under the bar") instead of
relying on each caller to pair two props (R-1). The value names the visual intent, not the
implementation.

Alternatives: a boolean `centered`. Rejected: a two-member union reads better at the call site and
leaves room for no third case without a rename. Inferring centring from
`scrollsUnderHeader={false}`: rejected as implicit coupling.

### D3. Screens drop the no-op `RootPage` fill and their local styles

Institution name, programme and iCal URL lose `StyleSheet`, `Spacing`, `stepStyles` and the
`style` prop on `RootPage`, and pass `contentPlacement="center"`. Feedback keeps
`scrollContent` (`paddingBottom: Spacing.four`) and `content` (`gap: Spacing.four` on
`feedback-responsive-content`). Both are composition that only this screen uses, in tokens, and
the lint ratchet allows tokens. Moving them into the primitive would change the other forms'
spacing.

`stepStyles.formContent` is deleted, and the `step-styles.ts` header comment then names the two
remaining consumers. If slice 5.1 lands first and has already rewritten or removed that file, keep
its version and delete `formContent` only if it still exists.

### D4. Feedback adopts the full action rhythm (+12 pt above Send)

Feedback's action region currently has no `paddingTop`. Taking the default gives it
`Spacing.three` above the error/Send stack, like every other keyboard-safe form. Feedback
explicitly overriding to `paddingTop: 0` was rejected: the slice's point is one rhythm, and the
iOS reference (a form's bottom action bar) has a consistent inset. The device pass checks the
result.

### D5. Feedback's sending status uses `tone="secondary"`

`themeColor="textSecondary"` → `tone="secondary"` (`themed-text.tsx:41-47` maps it to the same
token). `accessibilityLiveRegion="polite"` and `accessibilityRole="text"` stay, as the
`mobile-feedback` pending-status requirement needs them. A `StatusView` is not used: the status is
a one-line live caption under the busy button, not a status surface.

### D6. No new grep gate; the lint ratchet is the encoded audit

The audit greps are already encoded where it matters. `local/no-style-literals` covers color,
typography, shadow, spacing and radius. `local/no-raw-primitive`, `local/no-raw-button`,
`local/no-raw-text-input`, `local/no-ad-hoc-status`, `local/no-ad-hoc-separator` and L9 cover
the rest, and these files sit on no allowlist, so lint already fails on any regression. The one
pattern that is not yet a gate (`themeColor` and the legacy type aliases) is slice 4.3's
type-level removal. A Phase 5 grep test would duplicate ADR 077's gates and conflict with the
parallel slice 5.1. The scoped greps run as a verification task with recorded output.

### D7. Comments state the current why only

The touched screens carry history-narrating comments, for example
`institution-name-screen.tsx:23-25` ("which used to jump straight to the iCal-URL route") and
`ical-url-screen.tsx:36-55` ("Phase-3 ship 4, rewired by ship 5", restated B-rules). They are cut
to the non-obvious current why: the required institution name and the stale-selection clear, the
two failure classes, and the draft-not-selection attribution. The behaviour comments in
`programme-screen.tsx:30-36` stay as they are.

No decision here is costly to reverse, so no new ADR. D1/D2 extend ADR 054's existing
layout-owns-spacing decision by one sentence.

## Risks / Trade-offs

- [Feedback shifts by 12 pt] → intended (D4); checked in the iOS device pass and the Android
  inbox pass.
- [A future form wants a different action rhythm] → `actionContainerStyle` still wins; a
  different rhythm is a visible, reviewed override.
- [Merge conflict with slice 5.1 on `step-styles.ts`] → the change there is one key deletion plus
  a comment line; D3 gives the resolution rule.
- [The union type breaks a caller that passes both props] → only the three screens and the
  gallery fixture pass `scrollsUnderHeader={false}`, and all four switch to `contentPlacement`
  in this change. `tsc` catches any other caller.
- [The content `gap` default changes a multi-child consumer] → every current consumer has
  either a single child (feedback) or the same `gap` (editor, gallery, centred forms). A new
  consumer gets the family gap, which is the intent.

## Migration Plan

One PR, two commits: (1) the primitive, its tests and gallery fixture, the four screens and their
tests, `step-styles.ts`; (2) the Architecture Book and CHANGELOG. To roll back, revert the PR. No
data, native or store impact.
