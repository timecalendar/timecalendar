## Why

Settings currently mixes custom React Native rows with universal menu pickers, so it does not feel like a platform settings surface and does not expose theme and language as complete native journeys. This change establishes the reusable iOS and Android settings composition needed by later native-settings work while preserving every existing destination and preference contract.

## What Changes

- Replace the settings hub's custom visual composition with platform-native grouped settings surfaces: SwiftUI form/section composition on iOS and Material list/row composition on Android.
- Introduce reusable chrome contracts for native settings hosts, sections, navigation/action/value rows, switches, selection rows, and Android single-choice dialogs; keep feature meaning, routing, persistence, and localization outside the chrome boundary.
- Preserve the hub's calendar summary loading/empty states, activity badge, weekend switch, route destinations, capability-gated environment control, and existing About row consumers while making whole-row activation and row semantics native.
- Split Appearance & language into a native theme journey and a native language journey: inline checkmarked theme choices and a pushed language page on iOS; cancellable single-choice radio dialogs on Android.
- Feed native controls the resolved app color scheme so explicit light/dark choices update the current screen, dialogs, and navigation immediately without replacing platform typography or geometry.
- Add one app-lifetime system-locale observer using the installed `expo-localization` reactive API. It updates i18next only when the stored preference is `system` and the newly resolved supported locale differs; explicit French or English choices ignore device changes.
- Reconcile the historical settings and i18n requirements that still mandate universal pickers or claim that no in-app language override exists.
- Update native mocks, affected behavior tests, the Architecture Book, and a focused CI proof for the resulting contracts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-settings-hub`: require platform-native hub composition while preserving summary, badge, switch, routing, environment, accessibility, and old row-consumer behavior.
- `mobile-settings-screen`: replace universal theme/language pickers with the platform-specific native journeys and their live selected-state behavior.
- `mobile-i18n`: make the persisted in-app language preference authoritative and add bounded runtime refresh for system mode, superseding the historical no-switcher requirement.

## Impact

- Primary code: `mobile/src/features/settings/ui/`, `mobile/src/components/chrome/`, `mobile/src/components/root-page.tsx`, `mobile/src/features/settings/prefs/`, `mobile/src/i18n/`, `mobile/src/app/`, and root navigation/theme composition.
- Compatibility consumers: `mobile/src/features/about/ui/about-screen.tsx` and `mobile/src/features/environment/ui/environment-settings-control.tsx`.
- Tests and mocks: settings, theming, i18n, About/environment consumer tests, and `mobile/jest/setup-expo-ui.ts`.
- Documentation: the theming, navigation, i18n, testing, and Architecture Book change-log contracts.
- No API contract, generated client, database migration, native/store configuration, deployment/CI workflow, or legacy Flutter change is expected. Device visual acceptance remains owner-led and is not claimed by automated tests.
