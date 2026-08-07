## Why

The third mobile tab is named Profile even though TimeCalendar has no account,
avatar, or user identity, and its route currently renders an unstructured stack of
secondary links directly from `src/app/`. Rename it Settings and give calendar
management, event utilities, preferences, and application information a
discoverable native hierarchy that can grow without becoming a junk drawer.

## What Changes

- **BREAKING navigation label/route:** replace the Profile tab with a Settings /
  Réglages tab and gear icon, changing the canonical tab route from `/profile` to
  `/settings`; retain `/profile` only as a temporary compatibility redirect.
- Introduce a first-class `mobile/src/features/settings/` module whose tested UI is
  re-exported by a thin `(tabs)/settings.tsx` route, following the Home and Calendar
  module pattern.
- Replace the flat link stack with a scrollable, platform-appropriate grouped
  navigation surface for Calendars, Events, Preferences, and Application.
- Add a tappable calendar-collection summary at the top. It derives from the
  persisted `useUserCalendars()` collection, never from list position or the
  single-school onboarding selection: one unambiguous school may be named,
  multiple schools are summarized by count, and missing metadata falls back to
  calendar counts.
- Link only destinations that exist at ship time. Calendars, personal events,
  hidden events, appearance and language, and notifications ship in the initial
  hub; Activity, About, and Feedback rows land with their corresponding RN
  features rather than appearing as dead controls.
- Keep existing preference controls on the dedicated `/appearance-settings` route, presented
  from Settings as Appearance & language; do not introduce a second preference store
  or fold controls into the hub in this change.
- Use native navigation chrome and platform conventions behind existing chrome
  seams, with a controlled RN grouped-list fallback if Expo UI cannot satisfy
  navigation-row, badge, test-selector, or accessibility requirements on both
  platforms.
- Update the accepted three-tab IA decision and Architecture Book from Home ·
  Calendar · Profile to Home · Calendar · Settings, plus i18n, accessibility,
  component, route, and on-device navigation proofs.

## Capabilities

### New Capabilities

- `mobile-settings-hub`: the Settings tab, grouped destination hierarchy, calendar-derived
  summary rules, native interaction/accessibility behavior, and feature-module
  ownership.

### Modified Capabilities

- `mobile-settings-screen`: the preference screen is reached from Settings as
  Appearance & language instead of from Profile as generic Settings.
- `mobile-user-calendars`: calendar management is reached through the Settings
  calendar summary instead of a Profile link, while its existing management
  behavior remains unchanged.

## Impact

- Mobile routing and chrome: `src/app/(tabs)`, `src/components/app-tabs.tsx`, root
  compatibility routing, and native header configuration.
- New `src/features/settings/ui/` presentation and a small tested derivation selector
  over the existing calendar-source read; no database or API change.
- Existing settings and calendar-source UI entry points, EN/FR catalogs, tests,
  and Maestro anchors.
- Architecture Book: ADR 025 is superseded in part (tab identity), and
  `navigation.md`, `features.md`, the decisions index, and changelog describe the
  resulting system.
- No new production destination is implied for Activity, About, or Feedback; each
  remains separately scoped until implemented.
