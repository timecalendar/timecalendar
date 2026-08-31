## MODIFIED Requirements

### Requirement: Splash dismisses only when the app is ready
The app SHALL expose one asynchronous readiness coordinator (`src/hooks/use-app-ready.ts`) that awaits first-paint prerequisites in order: bundled i18n/system-font readiness, committed database migrations, and the typed future Phase 09 importer slot. After those prerequisites, the first-launch navigator SHALL await the initial public calendar-sources read and compute route eligibility before the navigation tree replaces the splash-only state. The native/JS splash continuation SHALL dismiss only when an eligible protected route graph is mounted. A failure or watchdog deadline SHALL expose accessible recovery and Retry but SHALL NOT mark the app ready or reveal an ineligible route.

#### Scenario: Overlay dismisses after prerequisites and route eligibility
- **WHEN** migrations, the future-importer slot, and the first calendar read resolve and the protected route graph is selected
- **THEN** the splash overlay dismisses
- **AND** the selected onboarding or eligible route is shown without a Home/Calendar flash

#### Scenario: Watchdog cannot bypass readiness
- **WHEN** a prerequisite or eligibility read remains unresolved beyond the watchdog deadline
- **THEN** an accessible recovery/retry state replaces passive loading
- **AND** the navigation tree remains unavailable

#### Scenario: Retry re-runs failed prerequisites
- **WHEN** startup failed and the user activates Retry
- **THEN** the prerequisite sequence runs again from migrations
- **AND** the splash remains until a new successful eligibility decision exists
