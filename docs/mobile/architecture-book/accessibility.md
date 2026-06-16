# Accessibility

The lint half is a set of `react-native-a11y` + `i18next` rules (see [Lint & format](./lint-format.md)); the runtime half is the heading-role contract in `ThemedText` and accessible async status. Each entry below is a live rule plus the caveats tooling can't carry — where a rule is encoded in a component or stays prose, it's because lint *cannot* see the intent (R-1).

## What lint enforces

- Four `react-native-a11y` rules run as **error**: `has-accessibility-props`, `has-valid-accessibility-descriptors`, `has-valid-accessibility-role`, `no-nested-touchables`. Every touchable/pressable must declare a role or a label+hint, and touchables may not nest.
- `i18next/no-literal-string` covers `accessibilityLabel` / `accessibilityHint`, so a11y copy is translated too.

These rules guard real product touchables (interactive controls declare `accessibilityRole` + a translated `accessibilityLabel`).

## The heading-role contract — encoded in `ThemedText`

- `ThemedText` maps `type="title"` and `type="subtitle"` to `accessibilityRole="header"`, so titles are exposed to VoiceOver/TalkBack as headings (rotor/heading navigation) without each call site declaring the role. A caller-supplied `accessibilityRole` **still wins** (the default applies only when unset; `{...rest}` spreads last). Body/default/small/link/code variants carry **no** role.
- Encoded in the **component**, not a lint rule, because lint cannot know which `<Text>` is semantically a heading — that's authorial intent tied to the visual `type`, and the component already owns `type→style`, so it owns `type→role` too.

## Accessible async status

- Loading/error text carries `accessibilityLiveRegion="polite"` (Android announces the change) and a status role (`text` / `alert`), so assistive tech conveys the state rather than reading a silent node.

## Proof in CI

- `src/components/themed-text.test.tsx` renders title/subtitle through the real accessibility tree and asserts `getByRole("header")` finds the node — a *resolved semantic*, not merely that a prop was passed. It also covers the negative path (default variant has no header role) and explicit-role-wins. Gated by the `test-mobile` job (tsc + lint + Jest), R-1.

## What lint can't encode → prose, each with reason + owner

None of these is a sound lint rule; each is recorded so the owning step/feature inherits it:

- **Dynamic Type / font scaling** — RN `Text` scales with the OS font size by default; the posture is **never** pass `allowFontScaling={false}`. A `no-restricted-syntax` guard is deferred debt, added the day someone reaches for it.
- **Touch-target minimums (44pt iOS / 48dp Android)** — a runtime layout property, not statically checkable. Owned by interactive controls and the [Definition of Done](./definition-of-done.md) (Accessibility axis).
- **Meaningful labels** — lint guarantees a label *exists* on a touchable, never that it's *meaningful* or correctly translated; human review + the translated-copy rule cover semantics.
- **Manual screen-reader passes (VoiceOver / TalkBack)** — focus order, grouping, announcement quality: runtime behavior no static tool can assert. Owned by the [Definition of Done](./definition-of-done.md) (Accessibility axis).
- **Reduced motion** — **discharged by Splash** ([features.md → Splash](./features.md#splash)): animations honor `AccessibilityInfo.isReduceMotionEnabled` in the component (lint can't know which view animates). Any *future* animation inherits the same obligation — still prose, for the same reason; a `no-restricted-syntax` guard is the day-an-offender-appears debt.
- **Color contrast** — a theme-token property, not lint-encodable; **discharged by theming**: the AA-verified token pairs are documented in `src/theme/tokens.ts` and the [Theming & native-chrome](./theming.md) file; the DoD's manual contrast review checks rendered screens against them. A runtime/CI checker stays deferred (its trigger is recorded there).

## Deferred (recorded debt — not built)

- **No new lint rules, no a11y infrastructure** — no Dynamic-Type override-guard rule, no touch-target helper, no reduced-motion hook, no contrast check. Each is earned by the step/feature that first needs it.
- **No manual screen-reader DoD checklist** beyond the [Definition of Done](./definition-of-done.md) (Accessibility axis).
