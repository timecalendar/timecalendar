## ADDED Requirements

### Requirement: Resolved cold launches use one ordered routing decision

The mobile app SHALL resolve a cold launch through one process-lifetime coordinator after backend-environment recovery. The coordinator SHALL await the database migration attempt, the designated Phase 09 importer insertion point when that importer exists, killed-state notification resolution, and the first held-calendar identity read before applying any no-intent fallback. It SHALL choose exactly one initial destination and SHALL NOT rerun the fallback during the same app process.

#### Scenario: Calendar identity is read after prerequisites

- **WHEN** the app cold-launches
- **THEN** migrations complete before held calendars or the startup preference determine a destination
- **AND** the documented Phase 09 importer insertion point is after migrations and before those reads

#### Scenario: The fallback runs once per process

- **WHEN** launch resolution has committed a destination
- **AND** the startup preference changes or later explicit navigation occurs
- **THEN** the coordinator does not navigate again during that app process

### Requirement: Onboarding and explicit intents outrank the stored tab fallback

The launch resolver SHALL use the following precedence: a valid explicit deep link or killed-state notification target is preserved; otherwise a resolved empty held-calendar identity opens `/onboarding`; otherwise `home` opens `/` and `calendar` opens `/calendar`. Missing, invalid, or unknown preference values SHALL resolve as Home. The root `unstable_settings.initialRouteName` SHALL remain `(tabs)` as a deep-link back-stack anchor and SHALL NOT be changed dynamically to implement the preference.

#### Scenario: Resolved user defaults to Home

- **WHEN** a cold launch has no explicit intent, at least one held calendar, and the stored value is `home`, missing, or invalid
- **THEN** Home is the committed launch destination

#### Scenario: Resolved user defaults to Calendar

- **WHEN** a cold launch has no explicit intent, at least one held calendar, and the stored value is `calendar`
- **THEN** `/calendar` is the committed launch destination

#### Scenario: Fresh no-intent user enters onboarding

- **WHEN** a cold launch has no explicit intent and the post-migration/post-import held-calendar read resolves empty
- **THEN** `/onboarding` is committed regardless of the stored startup-tab value

#### Scenario: Explicit deep link wins

- **WHEN** Expo Router resolves a cold-start deep link to a non-default destination
- **THEN** the launch coordinator preserves that destination
- **AND** it does not replace it with Home, Calendar, or onboarding

#### Scenario: Notification target wins

- **WHEN** a killed-state notification resolves to an event or Calendar target
- **THEN** that notification target is committed before the startup fallback becomes eligible

#### Scenario: Later explicit navigation remains authoritative

- **WHEN** onboarding/import completion or any explicit `push` or `replace` occurs after launch commitment
- **THEN** the startup coordinator does not overwrite it

### Requirement: Startup choice is configurable through localized Settings UI

Settings SHALL expose a working `/startup-settings` destination in its Preferences group. The thin root route SHALL re-export a Settings feature UI screen containing one native single-select control reached through the owned chrome seam. The control SHALL show localized Home and Calendar options, reflect the validated persisted value, and persist selection immediately without navigating the current session. The row, screen, options, hints, accessibility labels, and selected state SHALL be complete in French and English and meet the platform touch-target and large-text contracts.

#### Scenario: Settings opens the startup choice

- **WHEN** the user activates the localized Startup screen row in Settings
- **THEN** `/startup-settings` opens with Home and Calendar options
- **AND** the current validated choice is selected

#### Scenario: Selecting Calendar affects only a future launch

- **WHEN** the user selects Calendar while another route is visible
- **THEN** `calendar` is persisted immediately
- **AND** no navigation occurs in the current app process

#### Scenario: Selecting Home survives relaunch

- **WHEN** the user selects Home and later cold-relaunches as a resolved user without an explicit intent
- **THEN** Home is the committed destination

### Requirement: Launch readiness prevents a wrong-tab first paint

Normal app content SHALL remain covered by the native-to-JS splash handoff until the launch coordinator observes that the winning route is committed. A Calendar or onboarding launch SHALL NOT dismiss the overlay while Home is still the observed route. Tabs-only secondary effects that can navigate or present UI SHALL remain ineligible until launch commitment. A migration or identity-read failure SHALL be recorded and SHALL resolve to a localized accessible blocking Retry surface rather than exposing tabs or leaving the splash indefinitely unresolved.

#### Scenario: Calendar is committed before splash dismissal

- **WHEN** Calendar wins but the router still reports Home
- **THEN** the splash overlay remains present
- **AND** it may dismiss only after `/calendar` is observed

#### Scenario: Onboarding is committed before splash dismissal

- **WHEN** a no-intent fresh-user launch resolves empty identity
- **THEN** the splash remains present until `/onboarding` is observed

#### Scenario: Failed prerequisite fails closed

- **WHEN** migration or first identity read fails
- **THEN** the failure is recorded and tabs remain unavailable
- **AND** splash handoff settles to an accessible Retry surface

### Requirement: Automated and native tests prove the launch matrix

Jest SHALL cover startup parsing, persistence, Flutter mapping, setter behavior, every precedence branch, one-shot lifecycle behavior, Settings row/picker behavior, root route wiring, and splash dismissal only after route commitment. A shared Maestro flow SHALL seed a resolved calendar identity, choose Home and Calendar through Settings, and prove each choice after a stop/cold relaunch on both iOS and Android. The implementation pull request SHALL run both native E2E jobs at the exact reviewed head.

#### Scenario: Focused first-paint test rejects an early hide

- **WHEN** the automated launch test holds the observed path on Home while Calendar is the winner
- **THEN** native/JS splash dismissal is not requested
- **AND** dismissal becomes eligible after the observed path changes to Calendar

#### Scenario: Maestro proves both choices on both platforms

- **WHEN** the startup-tab Maestro flow runs in the iOS and Android CI jobs
- **THEN** a Home selection cold-relaunches to Home
- **AND** a Calendar selection cold-relaunches to Calendar
