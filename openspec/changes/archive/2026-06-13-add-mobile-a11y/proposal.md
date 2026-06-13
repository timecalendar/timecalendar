# a11y foundation slice for mobile — screen-reader semantics + CI proof, the live lint rules made honest

## Why

`mobile/` already has the **lint half** of accessibility — four `react-native-a11y` rules (`has-accessibility-props`, `has-valid-accessibility-descriptors`, `has-valid-accessibility-role`, `no-nested-touchables`) and the `i18next/no-literal-string` coverage of `accessibilityLabel`/`accessibilityHint`/`placeholder`/`alt` all run as `error`. They landed early, with `add-mobile-lint-format` (step 4). But the **runtime half** is unproven and partly absent: the skeleton has **no touchables** for those rules to bite on, the screen titles are plain `<Text>` that expose no heading semantics to VoiceOver/TalkBack, and nothing in CI proves the accessibility tree resolves to anything meaningful. Foundation roadmap step 7 (and migration-approach §1's vertical-slice order: UI → data → storage → i18n → **a11y**) makes a11y a wired, CI-green cross-cutting system *before* the first real feature needs it. Per R-1 the rule must be enforced, not just present; this change makes a11y honest the same way `add-mobile-i18n` made the strings rule honest — by giving the rules real semantics to guard and a CI proof that the tree resolves, then recording in the Architecture Book exactly what lint can and cannot enforce.

## What Changes

- **Heading semantics encoded in `ThemedText`** (R-1: encode in the component, not prose): `type="title"` and `type="subtitle"` carry `accessibilityRole="header"`, so screen-reader rotor/heading navigation works and the visual hierarchy is also a semantic one. Lint cannot know which `<Text>` is a heading, so the component is the enforcement point.
- **The skeleton's existing semantics verified/corrected** — the schools screen title and the Home/Profile stub titles render as headers; the schools loading/error states expose an accessible status. No new screens, no invented touchables (R-2: a Pressable wired to nothing would be speculative scaffolding).
- **One CI proof test**: a unit test renders a localized component through the real accessibility tree and asserts a *role/semantic* resolves (e.g. `getByRole('header')` finds the title) — proving a11y semantics resolve at runtime, not merely that the lint rules are configured. Mirrors the i18n proof test.
- **Architecture Book gains an a11y section**: records that the lint half is live (pointer to `mobile-lint-format`), the heading-role component contract, and — per R-1 — the prose rules for everything lint *can't* encode (Dynamic Type / font-scaling posture, touch-target minimums, meaningful-label review, manual screen-reader passes, reduced motion, contrast), each stating why it isn't a lint rule and who owns it. Resolves the step-4 note that says "the strings + a11y rules from steps 6–7 are already live."
- **Roadmap step 7 marked done** in `docs/react-native-migration/01-roadmap/01-foundation.md`.
- **No new lint rules** and **no new a11y infrastructure** (no font-scaling system, touch-target helper, or reduced-motion hook) — those are recorded as deferred debt, earned by the feature/step that first needs them.

## Capabilities

### New Capabilities

- `mobile-a11y`: the mobile app's accessibility system — what the live lint rules enforce and where they bite, the heading-semantics component contract, the CI proof that the accessibility tree resolves, the device/runtime posture (Dynamic Type, touch targets, screen-reader passes, reduced motion, contrast) and which of those are encoded vs. deferred, and how the no-hardcoded-strings rule keeps a11y copy translated.

### Modified Capabilities

<!-- none. mobile-lint-format (add-mobile-lint-format change) already owns the react-native-a11y rules and the i18next a11y-attribute coverage; this change does not alter those rules' spec-level requirements — it adds the runtime-semantics + proof layer that sits above them and points back at them. The mobile-architecture-book gains an a11y section, which is normal book evolution, not a requirement change to that capability. -->

## Impact

- `mobile/src/components/themed-text.tsx`: `type="title"`/`"subtitle"` map to `accessibilityRole="header"` (the encoded heading contract).
- `mobile/src/components/schools-screen.tsx` (+ Home/Profile tab stubs as needed): titles inherit the header role from `ThemedText`; loading/error states expose an accessible status. No structural change.
- `mobile/src/components/themed-text.test.tsx` (or a new colocated test): the a11y proof — asserts the header role resolves in the accessibility tree under the real i18n instance.
- `.claude/rules/mobile/architecture.md`: new a11y section; the lint-section "a11y rules from steps 6–7 are already live" note resolved.
- `docs/react-native-migration/01-roadmap/01-foundation.md`: step 7 marked done.
- No new dependencies, no native config change, no server/web/`app/` code touched. The four `react-native-a11y` lint rules and the `i18next` a11y-attribute coverage are unchanged.
