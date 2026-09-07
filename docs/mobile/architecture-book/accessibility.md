# Accessibility

The lint half is a set of `react-native-a11y` + `i18next` rules (see [Lint & format](./lint-format.md)); the runtime half is the heading-role contract in `ThemedText` and accessible async status. Each entry below is a live rule plus the caveats tooling can't carry — where a rule is encoded in a component or stays prose, it's because lint _cannot_ see the intent (R-1).

## What lint enforces

- Four `react-native-a11y` rules run as **error**: `has-accessibility-props`, `has-valid-accessibility-descriptors`, `has-valid-accessibility-role`, `no-nested-touchables`. Every touchable/pressable must declare a role or a label+hint, and touchables may not nest.
- `i18next/no-literal-string` covers `accessibilityLabel` / `accessibilityHint`, so a11y copy is translated too.

These rules guard real product touchables (interactive controls declare `accessibilityRole` + a translated `accessibilityLabel`).

## The heading-role contract — encoded in `ThemedText`

- `ThemedText` maps `type="title"` and `type="subtitle"` to `accessibilityRole="header"`, so titles are exposed to VoiceOver/TalkBack as headings (rotor/heading navigation) without each call site declaring the role. A caller-supplied `accessibilityRole` **still wins** (the default applies only when unset; `{...rest}` spreads last). Body/default/small/link/code variants carry **no** role.
- Encoded in the **component**, not a lint rule, because lint cannot know which `<Text>` is semantically a heading — that's authorial intent tied to the visual `type`, and the component already owns `type→style`, so it owns `type→role` too.

## Accessible async status

- Loading/error text carries `accessibilityLiveRegion="polite"` (Android announces the change) and a status role (`text` / `alert`), so assistive tech conveys the state rather than reading a silent node.
- Shared empty states expose localized title then caption as the complete meaning and hide optional
  artwork from the accessibility tree. They add no motion. `PrimaryAction` keeps one translated
  button label, reports disabled/busy state on that button, blocks repeat activation, and hides its
  progress indicator from focus. See ADR [054](./decisions/054-shared-root-page-semantics.md).
- Home's section empty states keep title-before-caption source order and left alignment. Feedback,
  Programme, and personal-event focused forms keep fields and errors in one scroll body followed by
  a sibling primary-action region, so keyboard avoidance does not reorder or cover the action.
- Ordinary pushed routes expose their localized name once through native compact chrome. Caption-
  only `PageIntro` content follows that navigation heading before fields, actions, status, or rows;
  content headings remain only when they identify domain content such as an event or release.
- Controlled native text-entry dialogs isolate the background accessibility tree, keep native input
  and Cancel/Save actions present while pending, announce inline validation/write failure and
  persistence-gated success, and expose stable native identifiers on both platforms. Back is an
  explicit cancel on Android; outside taps are inert on both platforms. Jest proves callbacks,
  identifiers, and structure; VoiceOver/TalkBack focus and announcement quality remain device proof.

## Proof in CI

- `src/components/themed-text.test.tsx` renders title/subtitle through the real accessibility tree and asserts `getByRole("header")` finds the node — a _resolved semantic_, not merely that a prop was passed. It also covers the negative path (default variant has no header role) and explicit-role-wins. Gated by the `test-mobile` job (tsc + lint + Jest), R-1.

## What lint can't encode → prose, each with reason + owner

None of these is a sound lint rule; each is recorded so the owning step/feature inherits it:

- **Dynamic Type / font scaling** — RN `Text` scales with the OS font size by default; the posture is **never** pass `allowFontScaling={false}`. A `no-restricted-syntax` guard is deferred debt, added the day someone reaches for it.
- **Touch-target minimums (44pt iOS / 48dp Android)** — a runtime layout property, not statically checkable. Owned by interactive controls and the [Definition of Done](./definition-of-done.md) (Accessibility axis).
- **Meaningful labels** — lint guarantees a label _exists_ on a touchable, never that it's _meaningful_ or correctly translated; human review + the translated-copy rule cover semantics.
- **Manual screen-reader passes (VoiceOver / TalkBack)** — focus order, grouping, announcement quality: runtime behavior no static tool can assert. Owned by the [Definition of Done](./definition-of-done.md) (Accessibility axis).
- **Reduced motion** — **discharged by each animation owner**: Splash handles its own `AccessibilityInfo.isReduceMotionEnabled` branch ([features.md → Splash](./features.md#splash)), while onboarding owns a live read/subscription through `useReducedMotion` and snaps its pager plus decorative entrance/indicator transitions. Lint cannot know which motion is decorative or whether a runtime preference reaches every animation, so any future animation inherits the same feature-level obligation; a `no-restricted-syntax` guard remains day-an-offender-appears debt.
- **Color contrast** — a theme-token property, not lint-encodable; **discharged by theming**: the AA-verified token pairs are documented in `src/theme/tokens.ts` and the [Theming & native-chrome](./theming.md) file; the DoD's manual contrast review checks rendered screens against them. A runtime/CI checker stays deferred (its trigger is recorded there).

## Deferred (recorded debt — not built)

- **No new lint rules or cross-feature a11y infrastructure** — no Dynamic-Type override-guard rule, no touch-target helper, and no contrast check. Onboarding's feature-local `useReducedMotion` hook exists for its live preference ownership; broader shared abstraction remains deferred until another owner proves the need.
- **No manual screen-reader DoD checklist** beyond the [Definition of Done](./definition-of-done.md) (Accessibility axis).
