## MODIFIED Requirements

### Requirement: Onboarding is reachable and owns the fresh-user no-intent launch

The onboarding flow SHALL remain reachable from Settings/calendar management and via its development deep links. After database migrations and the designated future Phase 09 importer insertion point, the launch coordinator SHALL derive first-launch identity from the held `user_calendars` collection. A cold launch with no explicit deep-link or notification intent and a resolved empty collection SHALL replace the default tabs route with the welcome surface (`/onboarding`) before splash dismissal, regardless of the stored Home/Calendar preference. A non-empty collection SHALL not auto-open onboarding. Explicit deep links and killed-state notification targets SHALL retain priority over the startup-tab fallback.

#### Scenario: Fresh no-intent launch enters onboarding

- **WHEN** the app cold-launches without an explicit intent and the post-prerequisite held-calendar read resolves empty
- **THEN** `/onboarding` is committed before the splash dismisses
- **AND** the startup-tab preference is not applied

#### Scenario: Resolved user does not auto-enter onboarding

- **WHEN** the app cold-launches without an explicit intent and at least one held calendar exists
- **THEN** onboarding is not selected by first-launch resolution
- **AND** the Home/Calendar startup preference determines the fallback destination

#### Scenario: Explicit onboarding deep link remains authoritative

- **WHEN** the app cold-launches through `timecalendar-dev://onboarding` or one of its registered child routes
- **THEN** the requested onboarding route is preserved
- **AND** the launch fallback does not replace it
