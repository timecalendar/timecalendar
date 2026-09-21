---
kind: ticket
id: T01
epic: E01
status: planned
traces-to: [P01, P04, D01, D04, D05]
depends-on: []
size: L
confidence: medium
---

# T01 — Native settings hub, theme, and language

## Outcome

The hub, theme, and language form complete native journeys on both platforms, with live
preference updates and reusable native row, section, selection, and host contracts.

## Scope

Compose SwiftUI Form/Section and Material list/row controls behind components/chrome. Adapt
the hub without changing destinations, calendar summary, unread badge, weekend switch, or
environment capability. Theme uses inline iOS checkmarks and an Android radio dialog. Language
uses one list: Use device language, Français, English, on an iOS pushed page or Android radio
dialog. Feed native controls the resolved app scheme; retain platform geometry/system fonts.
Preserve About/environment row consumers through compatible composition.

Add a small app-lifetime locale listener through the existing Expo API and resolver. Change
i18next only when system mode resolves differently; explicit choices remain authoritative.
Preserve startup fallback to English. Prove a complete theme journey first, then reuse its
native composition for language within this ticket.

## Non-goals

About redesign, timezone search, permission changes, new navigation framework, OS app-language
integration, new locale dependencies/bridges, or a language lifecycle framework.

## Definition of done
- Whole rows activate correctly; values, action rows, and navigation disclosures are distinct.
- Theme persists and applies live to app surfaces, controls, dialogs, and navigation.
- Native Form has one scroll/inset owner inside the existing Router stack; old routes work.
- Existing About/environment consumers render and act correctly without native-host errors.
- Update native mocks and affected settings/theming specs to the resulting contracts.
- Selection/value/accessibility state reflects the stored preference and active language.
- Changing language translates the current page and native-control labels without losing selection.
- System-mode changes update once; explicit choices ignore device changes; listeners clean up.
- If the existing listener cannot work simply, retain startup/manual resolution and document
  that omission under D04 rather than broadening scope.
- Reconcile conflicting historical i18n/settings specs and document the resulting behavior.

## Acceptance and verification

Exercise hub destinations, summary loading/empty state, badge, weekend switch, all three theme
choices, and Android dialog cancellation through behavior tests. Include app/device scheme
disagreement and old row consumers. The first implementation step should expose a complete theme journey on iOS and Android;
validate real native host/scroll/navigation behavior before extending shared components.

Test every choice, cancel, current-page translation, supported-language fallback, duplicate
locale events, and explicit-override protection. Run affected i18n/preferences/screen tests
after edits and the [mobile gates](../../roadmap.md#verification-convention). Verify the listener
uses the real installed API contract; do not invent events in mocks that native Expo cannot emit.

## Likely work sites and reading

Verified on recorded main: `mobile/src/features/settings/ui/`, `mobile/src/components/chrome/`,
`mobile/src/components/root-page.tsx`, `mobile/src/theme/`, `mobile/src/hooks/use-color-scheme.ts`,
`mobile/src/features/about/ui/about-screen.tsx`, `mobile/src/features/environment/ui/environment-settings-control.tsx`,
and `mobile/jest/setup-expo-ui.ts`. Read [D01](../../decisions/D01-native-presentation.md),
`openspec/specs/mobile-settings-hub/spec.md`, `mobile-settings-screen/spec.md` under the same
spec directory, and `docs/mobile/architecture-book/theming.md`.

`mobile/src/features/settings/ui/appearance-settings-screen.tsx`, `mobile/src/features/settings/prefs/hooks.ts`,
`mobile/src/i18n/`, `mobile/src/app/_layout.tsx`, route exports, and native chrome. Read
[D04](../../decisions/D04-permission-language-boundaries.md), `openspec/specs/mobile-i18n/spec.md`,
and `openspec/specs/mobile-settings-screen/spec.md`. A locale runtime helper/selection route
may be new files. Paths were checked against recorded main.

## Size and confidence drivers

L: one settings composition change with two small, existing preference models. Theme proves
the shared native boundary; language reuses it. Medium confidence: host sizing, scrolling, and
locale events need proof. The approved locale-refresh fallback bounds that uncertainty.

## QA and sensitive surfaces

Owner checks iOS grouped surfaces, Android continuous list/ripple, both themes, large text,
French labels, screen-reader row semantics, and tablet sizing. No separate QA ticket. Preserve
capability-gated environment controls and avoid unrelated global palette changes.

Owner checks back-title translation, autonyms, large text, and app return after locale changes.
Keep preference keys and existing overrides intact. No new permission or OS-setting UI.
