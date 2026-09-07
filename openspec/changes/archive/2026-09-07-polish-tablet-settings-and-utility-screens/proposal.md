## Why

Settings, management, history, and informational screens preserve their phone behavior on portrait tablets, but most still use one generic 800-point cap. Forms and prose become unnecessarily wide, while list states and grouped content do not consistently share the measured responsive lanes introduced by the tablet foundation.

## What Changes

- Apply the shared measured standard lane to the Settings hub, hidden-events management, and Activity so rows, sections, refresh/pagination content, and empty/error states align consistently without changing their behavior.
- Apply the shared measured readable lane to appearance, timezone, and notification settings; changelog history and sheet content; and the feedback form.
- Keep About's grouped sections in a standard lane while constraining its introductory and error copy to readable inner bounds.
- Retain a single ordered column on every owned screen. Do not introduce optional tablet columns in this bounded pass because none of the current screens proves enough scanability benefit to justify large-text and focus-order complexity.
- Preserve the existing native Stack headers, safe-area and keyboard owners, native controls, changelog form-sheet/full-screen-modal presentation, refresh/pagination actions, destructive behavior, links, localization, accessibility semantics, and phone layouts.
- Treat the user-calendar screen as integration-only because TIM-501 owns its responsive files; verify the Settings entry and management route without editing the shared screen.
- Keep Splash and dev-import visually unchanged and add responsive regression coverage for their centered, non-stretched transient states. Keep `/profile` and `/more` as renderless redirects and verify that width changes do not invent UI.
- Update the portrait-tablet matrix with the implemented dispositions, add focused responsive component/static tests, and record the reusable current-state guidance in the Architecture Book without changing its responsive policy.

## Capabilities

### New Capabilities

- `mobile-tablet-utility-layout`: responsive composition and regression requirements for Settings, management, Activity, About, changelog, feedback, transient, and redirect-only surfaces on phone and full-screen portrait tablets.

### Modified Capabilities

<!-- none; existing feature semantics remain unchanged -->

## Impact

- **Code:** existing UI modules and colocated tests under `mobile/src/features/settings/ui/`, `notifications/ui/`, `hidden-events/ui/`, `activity/ui/`, `about/ui/`, `changelog/ui/`, `feedback/ui/`, `splash/ui/`, plus the dev-import screen test and static route-structure coverage. Shared responsive primitives and user-calendar UI remain unchanged.
- **Documentation:** `docs/mobile/tablet-quick-wins.md` and the current responsive-layout guidance in `docs/mobile/architecture-book/theming.md` or its changelog entry, only as needed to describe adopted screen ownership.
- **Contracts and dependencies:** no API or generated-client change, database migration, dependency, native/store/EAS/Firebase configuration, deployment/CI workflow, or legacy Flutter change.
- **Risk:** moving padding from local containers into measured lanes can double safe-area/gutter ownership or disturb virtualized-list refresh, pagination, keyboard, and presentation behavior unless each owner is adapted at its existing scroll/list boundary and covered at phone and tablet widths.
