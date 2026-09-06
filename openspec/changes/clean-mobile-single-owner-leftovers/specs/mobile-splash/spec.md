## MODIFIED Requirements

### Requirement: Native static splash hands off to a JS overlay with no flash
The app SHALL keep the native static splash (configured via the `expo-splash-screen` config
plugin in `app.config.ts`) visible until the JavaScript layer is ready to render, by calling
`SplashScreen.preventAutoHideAsync()` before first render, and SHALL render a JS splash overlay
that visually continues the native splash so there is no flash of empty or unstyled content
during the native→JS handoff. The JS overlay SHALL live in
`src/features/splash/ui/splash-screen.tsx` (a feature `ui/` module, not a `src/app/` route), and
SHALL be mounted by the existing root layout (`src/app/_layout.tsx`) above the navigation
`Stack`.

#### Scenario: No flash between native splash and first content
- **WHEN** the app launches
- **THEN** the native static splash remains visible until JS is ready
- **AND** the JS splash overlay renders the same branded background before the native splash hides
- **AND** there is no visible flash of empty or unstyled content

#### Scenario: Splash logic is testable outside the route tree
- **WHEN** the splash needs an automated test
- **THEN** its behavior lives in `src/features/splash/ui/splash-screen.tsx` and is tested there
- **AND** no `*.test.tsx` is placed under `src/app/` (the Metro route-bundling constraint)

### Requirement: Splash dismisses only when the app is ready
The app SHALL expose a single splash-owned readiness gate
(`src/features/splash/ui/use-app-ready.ts`, `useAppReady()`) that resolves true once first-paint
prerequisites are satisfied — i18n initialized, fonts loaded (no-op while the app uses system
fonts), and the storage migration runner accounted for. The splash overlay SHALL dismiss (hide
the native splash and fade/remove itself) only after the readiness gate resolves, and the gate
SHALL always resolve so the splash can never remain visible indefinitely.

#### Scenario: Overlay dismisses once ready
- **WHEN** `useAppReady()` resolves true
- **THEN** the splash overlay dismisses (the native splash is hidden and the overlay is removed)
- **AND** the underlying app content is shown

#### Scenario: Readiness gate always terminates
- **WHEN** the app starts
- **THEN** every branch of the readiness gate resolves
- **AND** the splash is guaranteed to dismiss rather than hang the launch

### Requirement: Splash wiring is verified by an automated test
The unit/component test suite SHALL include a test
(`src/features/splash/ui/splash-screen.test.tsx`) that renders the overlay through the real
theme, i18n, and accessibility tree and asserts: the localized brand string renders (not the raw
key); the accessible status/label resolves; the reduced-motion branch is honored (mocking
`AccessibilityInfo` for both true and false); and the overlay dismisses once the readiness gate
resolves. The splash-owned readiness hook SHALL retain its colocated focused test. Pixel-
perfection, native feel, real-device reduced-motion, screen-reader quality, contrast-by-eye, and
low-end-device jank are explicitly manual on-device steps, not CI gates.

#### Scenario: Proof asserts resolved semantics, not props
- **WHEN** the proof test renders the splash overlay
- **THEN** it asserts the localized brand text renders and the accessible status resolves
- **AND** it asserts the reduced-motion branch is taken under mocked `AccessibilityInfo`
- **AND** it asserts the overlay dismisses once ready

#### Scenario: Readiness logic remains covered after relocation
- **WHEN** the readiness hook is moved under the splash UI sublayer
- **THEN** its focused test moves with it and continues to prove immediate readiness and watchdog release
