## ADDED Requirements

### Requirement: Native static splash hands off to a JS overlay with no flash
The app SHALL keep the native static splash (configured via the `expo-splash-screen` config
plugin in `app.config.ts`) visible until the JavaScript layer is ready to render, by calling
`SplashScreen.preventAutoHideAsync()` before first render, and SHALL render a JS splash overlay
that visually continues the native splash so there is no flash of empty or unstyled content
during the native→JS handoff. The JS overlay SHALL live in `src/components/splash-screen.tsx`
(a `@/components` module, not a `src/app/` route), and SHALL be mounted by the existing root
layout (`src/app/_layout.tsx`) above the navigation `Stack`.

#### Scenario: No flash between native splash and first content
- **WHEN** the app launches
- **THEN** the native static splash remains visible until JS is ready
- **AND** the JS splash overlay renders the same branded background before the native splash hides
- **AND** there is no visible flash of empty or unstyled content

#### Scenario: Splash logic is testable outside the route tree
- **WHEN** the splash needs an automated test
- **THEN** its behavior lives in `src/components/splash-screen.tsx` and is tested there
- **AND** no `*.test.tsx` is placed under `src/app/` (the Metro route-bundling constraint)

### Requirement: Splash dismisses only when the app is ready
The app SHALL expose a single readiness gate (`src/hooks/use-app-ready.ts`, `useAppReady()`)
that resolves true once first-paint prerequisites are satisfied — i18n initialized, fonts
loaded (no-op while the app uses system fonts), and the storage migration runner accounted for.
The splash overlay SHALL dismiss (hide the native splash and fade/remove itself) only after the
readiness gate resolves, and the gate SHALL always resolve so the splash can never remain
visible indefinitely.

#### Scenario: Overlay dismisses once ready
- **WHEN** `useAppReady()` resolves true
- **THEN** the splash overlay dismisses (the native splash is hidden and the overlay is removed)
- **AND** the underlying app content is shown

#### Scenario: Readiness gate always terminates
- **WHEN** the app starts
- **THEN** every branch of the readiness gate resolves
- **AND** the splash is guaranteed to dismiss rather than hang the launch

### Requirement: Splash honors reduced motion
Because the splash is the app's first animation, it SHALL honor
`AccessibilityInfo.isReduceMotionEnabled`. When reduced motion is enabled, the overlay SHALL
NOT run its fade-out (or any) animation — it SHALL render the same final visual frame and
dismiss immediately once ready. When reduced motion is disabled, a short fade-out animation MAY
play on dismissal. The final visual content SHALL be identical in both branches, so a
reduced-motion user loses only motion, never content. This behavior SHALL be encoded in the
component (not lint, which cannot statically know which view animates).

#### Scenario: Reduced motion enabled — no animation
- **WHEN** `AccessibilityInfo.isReduceMotionEnabled` is true
- **THEN** the splash overlay does not schedule a fade or any animation
- **AND** it dismisses immediately once the readiness gate resolves
- **AND** the same final frame (brand on themed background) is shown

#### Scenario: Reduced motion disabled — fade allowed
- **WHEN** `AccessibilityInfo.isReduceMotionEnabled` is false
- **THEN** the splash overlay may play a short fade-out on dismissal
- **AND** the final content shown is identical to the reduced-motion branch

### Requirement: Splash brand sourced from theme tokens and i18n
The JS splash overlay SHALL source its colors from the `@/theme` token layer (via `useTheme`),
not from raw color literals or alpha chrome APIs at the call site, and SHALL render any
user-facing brand text through an i18n `t()` key complete in both FR and EN (no hardcoded
string). The overlay SHALL render the scheme-appropriate (light/dark) tokens. The single color
literal in the native static splash configuration (`app.config.ts`) is exempt because a native
launch screen cannot read JS theme tokens or the OS color scheme; that asymmetry is documented.

#### Scenario: Overlay uses themed tokens, not literals
- **WHEN** the overlay renders
- **THEN** its background and text colors come from `@/theme` tokens resolved by `useTheme`
- **AND** it renders the scheme-appropriate token in dark mode

#### Scenario: Brand text is localized
- **WHEN** the overlay shows brand text
- **THEN** the text is produced by a `t()` key present in both `en.json` and `fr.json`
- **AND** no hardcoded user-facing string is introduced (the lint rule passes)

### Requirement: Splash exposes accessible status to assistive technology
The splash overlay SHALL expose an accessible label/status so VoiceOver and TalkBack convey the
loading state rather than reading a silent or meaningless node, and SHALL NOT disable font
scaling (no `allowFontScaling={false}`). Manual VoiceOver and TalkBack passes (focus order,
grouping, announcement quality) are an explicit on-device step, not a CI gate.

#### Scenario: Accessible status resolves in the tree
- **WHEN** the splash overlay renders
- **THEN** an accessibility label/status is present in the rendered accessibility tree
- **AND** the overlay does not set `allowFontScaling={false}`

### Requirement: Splash wiring is verified by an automated test
The unit/component test suite SHALL include a test (`src/components/splash-screen.test.tsx`)
that renders the overlay through the real theme, i18n, and accessibility tree and asserts: the
localized brand string renders (not the raw key); the accessible status/label resolves; the
reduced-motion branch is honored (mocking `AccessibilityInfo` for both true and false); and the
overlay dismisses once the readiness gate resolves. Pixel-perfection, native feel, real-device
reduced-motion, screen-reader quality, contrast-by-eye, and low-end-device jank are explicitly
manual on-device steps, not CI gates.

#### Scenario: Proof asserts resolved semantics, not props
- **WHEN** the proof test renders the splash overlay
- **THEN** it asserts the localized brand text renders and the accessible status resolves
- **AND** it asserts the reduced-motion branch is taken under mocked `AccessibilityInfo`
- **AND** it asserts the overlay dismisses once ready

### Requirement: Splash passes the full Definition of Done on both platforms
As the Phase-0 capstone, the splash SHALL be walked through every axis of the Definition of
Done (`.claude/rules/mobile/definition-of-done.md`) on iOS and Android. Each axis SHALL be
either satisfied in this change (types, lint, tests, i18n, a11y lint + reduced motion, theming/
light-dark, CI proof, observability non-regression), explicitly marked N/A with a one-line
reason (e.g. product analytics — a splash is not a user action), or deferred to a documented
on-device manual step (manual VoiceOver/TalkBack, on-device pixel/native-correctness on both
platforms, real-device reduced-motion, contrast eyeball, low-end-Android performance). No axis
is left in a third "later/mostly" state.

#### Scenario: Every DoD axis is accounted for
- **WHEN** the splash change is reviewed against the DoD checklist
- **THEN** every axis is ✅ done, ➖ N/A with a reason, or deferred to a named on-device step
- **AND** no axis is silently skipped

#### Scenario: Manual on-device axes are handed off, not blocking
- **WHEN** an axis can only be verified on a real device or with a screen reader
- **THEN** it is recorded in the inbox note with what/why/how-to-verify
- **AND** the corresponding task is HUMAN-tagged so the implementer skips-and-continues
