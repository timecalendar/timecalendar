## Why

The shared root-page, empty-state, primary-action, and keyboard-safe contracts are now established, but Settings, About, Home, Feedback, and the programme step still carry page-local styling or layout choices that visibly diverge from them. Harmonizing these remaining surfaces makes hierarchy, contrast, and focused-form actions consistent while preserving the product flows and platform-native placements users already rely on.

## What Changes

- Render Settings section labels in their normal localized casing while preserving grouped-list hierarchy on iOS and Android.
- Give About's introductory prose one readable responsive gutter inside the standard grouped-action lane, removing compounded horizontal padding without widening the action groups.
- Render Home's two empty section title/caption pairs with the same shared section-state typography and spacing while retaining their left alignment and the Upcoming section action.
- Adopt the shared `PrimaryAction` and `KeyboardSafeActionLayout` in Feedback and the onboarding programme step; retain the already-conforming personal-event create/edit form and strengthen its regression coverage where needed.
- Keep each form's content scrollable and its primary action in a sibling region pinned immediately above the keyboard, with semantic colors, platform minimum targets, localized labels, disabled/busy state, and accessibility state.
- Preserve Feedback submission outcomes and context, personal-event CRUD/delete confirmation, programme Skip/Continue behavior, navigation parameters, validation, selectors, localization, analytics, and observability.
- Add focused per-platform component proofs, update the binding Architecture Book guidance and changelog, and record device-only keyboard/layout verification in a non-blocking migration-inbox note.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-settings-hub`: Settings group headings use normal localized casing without weakening the grouped hierarchy.
- `mobile-about-screen`: Introductory prose has one readable gutter nested within the unchanged standard grouped-action lane.
- `mobile-home`: Both empty Home sections share the section-state title/caption rhythm and hierarchy.
- `mobile-feedback`: The form uses the shared semantic primary action and keyboard-safe body/action ownership while retaining submission behavior.
- `mobile-onboarding-flow`: The programme form uses the shared semantic primary action and keyboard-safe body/action ownership while preserving native Skip placement and draft navigation.

## Impact

- `mobile/src/features/settings/ui/`, `about/ui/`, `home/ui/`, `feedback/ui/`, `onboarding/ui/`, and their focused component tests.
- `mobile/src/features/personal-events/ui/` tests only if the existing shared-action and keyboard-safe contract needs an explicit regression assertion; no personal-event behavior change is planned.
- `mobile/src/components/` only if a narrow composability adjustment to the existing shared primitives is required; no new dependency or styling runtime.
- `docs/mobile/architecture-book/` current-state guidance, changelog, and a non-blocking `docs/react-native-migration/inbox/` device-pass note. This documentation is the only sensitive surface expected.
- No API or generated-client changes, server/database changes, routes, native/store/EAS configuration, dependency changes, deployment/CI configuration, secrets, or legacy Flutter work.
