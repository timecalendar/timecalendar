## ADDED Requirements

### Requirement: About is feature-owned behind a thin deep-linkable route

The mobile app SHALL expose `/about` as a root Stack sibling of `(tabs)` with a visible,
localized native header and the root tab group as its back-stack anchor. The tested
screen and native-version derivation SHALL live under `mobile/src/features/about/`, and
`mobile/src/app/about.tsx` SHALL only re-export the feature UI screen through its UI
barrel.

#### Scenario: Cold deep link reaches About
- **WHEN** the development app opens `timecalendar-dev://about` from a cold state
- **THEN** the localized About screen renders under native Stack chrome
- **AND** back navigation returns to the anchored tab hierarchy

#### Scenario: Route tree preserves feature ownership
- **WHEN** the About route and root layout are inspected
- **THEN** the route is a thin feature UI export
- **AND** the root Stack explicitly registers it with a visible header

### Requirement: About presents concise localized content in native grouped rows

The About screen SHALL render two short product-description paragraphs followed by
grouped sections for privacy, contact, app information, and developers. It SHALL use the
established Settings section/row grammar and a data-driven row model containing privacy
policy, email contact, installed version/build, Samuel Prak, and Eddy Monnot. All visible
copy, section titles, accessibility labels, values, and hints SHALL have typed English
and French catalog parity.

The screen SHALL NOT render Suggestions/feedback, a hidden Debug action, OTA update
identifiers, or a Changelog row until those destinations are implemented.

#### Scenario: English content renders in native groups
- **WHEN** About renders with the English catalog
- **THEN** both concise product paragraphs and all four groups are visible
- **AND** privacy, email, version, Samuel Prak, and Eddy Monnot rows appear in stable order
- **AND** Suggestions, Debug, OTA identifiers, and Changelog are absent

#### Scenario: French catalog preserves the supplied meaning
- **WHEN** About renders with the French catalog
- **THEN** the two paragraphs describe easy access to university schedules and the app's
  purpose in natural French
- **AND** every group and row has a French label with no key fallback

### Requirement: About dispatches web and email rows through native handlers

The privacy row SHALL open `https://timecalendar.app/privacy-policy`, Samuel Prak SHALL
open `https://www.samuelprak.fr/`, and Eddy Monnot SHALL open
`https://www.eddymonnot.com/`, each through `expo-web-browser`'s in-app browser API. The
contact row SHALL open `mailto:hello@timecalendar.app` through `expo-linking`. Each row
SHALL be one full-width accessible link with a localized label and destination hint.

#### Scenario: Privacy opens in app
- **WHEN** the user activates the privacy-policy row
- **THEN** the in-app browser receives exactly `https://timecalendar.app/privacy-policy`

#### Scenario: Contact opens the platform mail handler
- **WHEN** the user activates the contact row
- **THEN** the platform URL handler receives exactly `mailto:hello@timecalendar.app`

#### Scenario: Developer rows open their corresponding sites
- **WHEN** the user activates either developer row
- **THEN** the in-app browser receives the URL associated with that developer
- **AND** no row dispatches the other developer's URL

### Requirement: Installed version and build are truthful when native values are nullable

The mobile project SHALL add the Expo-SDK-compatible `expo-application` dependency and
derive the displayed application information from `nativeApplicationVersion` and
`nativeBuildVersion`. The Expo app configuration version SHALL be `4.0.0`. The screen
SHALL show version plus build when both are non-blank, the available value when only one
is usable, and a localized unavailable value when neither is usable. It SHALL NOT use an
OTA identifier or substitute the configured version for absent installed metadata.

#### Scenario: Version and build are both available
- **WHEN** the native module reports version `4.0.0` and build `135`
- **THEN** the app-information row presents both values in localized form
- **AND** its accessibility value contains both values

#### Scenario: Exactly one native value is available
- **WHEN** exactly one of native version or native build is null, empty, or whitespace
- **THEN** the row presents only the usable value with its correct localized label
- **AND** it does not render empty punctuation or invent the missing value

#### Scenario: Native metadata is unavailable
- **WHEN** native version and build are both null, empty, or whitespace
- **THEN** the row presents a localized unavailable value
- **AND** assistive technology receives no empty or misleading version/build value

### Requirement: About remains operable with assistive technology and large text

Interactive About rows SHALL meet the platform minimum target size, preserve wrapping at
large dynamic-type sizes, expose one `link` target with a localized hint, and hide
decorative icons, separators, and disclosures from assistive technology. The version row
SHALL expose its localized label and actual value but SHALL NOT have a link/button role,
navigation hint, disclosure, or press action. The scroll surface SHALL respect safe areas
and theme tokens in light and dark modes.

#### Scenario: Assistive technology traverses semantic rows
- **WHEN** VoiceOver or TalkBack traverses About
- **THEN** each outbound destination is announced once as a link with its hint
- **AND** the version row is announced as information rather than an action

#### Scenario: Large text remains readable
- **WHEN** the app uses an accessibility text size in either supported language
- **THEN** paragraphs, section labels, row labels, and values wrap without clipping
- **AND** every interactive row retains its full minimum-size touch target

### Requirement: About behavior has automated and device proof

Automated tests SHALL cover all native version/build branches, English and French
rendering, exact web/email dispatch, grouped row order, accessibility semantics, Settings
navigation, and thin route/root Stack structure. The mobile TypeScript, lint, and Jest
coverage gates SHALL pass. A shared Maestro flow SHALL prove cold deep-link rendering and
in-app reachability from Settings. A migration inbox note SHALL record the non-blocking
human light/dark, VoiceOver/TalkBack, large-text, outbound-link, and both-platform pass.

#### Scenario: Machine-verifiable gates pass
- **WHEN** the mobile verification suite runs
- **THEN** typecheck, lint, Jest with coverage, and route-structure proofs pass
- **AND** applicable logic retains the 90% per-file branch threshold and the project
  retains the 70% global floor

#### Scenario: Device-only checks are preserved without blocking code
- **WHEN** the change is ready for review on the no-KVM development host
- **THEN** a stable Maestro flow is committed for simulator-capable `main` CI
- **AND** the remaining human device checks are listed in the migration inbox note
