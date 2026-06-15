# mobile-onboarding-flow Specification

## Purpose
TBD - created by archiving change add-mobile-onboarding-flow. Update Purpose after archive.
## Requirements
### Requirement: A native-default brand/welcome surface is the onboarding entry, in its own presentation-only feature folder
The app SHALL provide a first-run brand/welcome surface as the entry of the onboarding flow,
implemented as a presentational screen in a new onboarding feature folder
`mobile/src/features/onboarding/` with a single `ui/` sublayer (no `data/`/`store/`/`form/`),
mirroring the splash feature's presentation-only shape. The welcome screen SHALL render the app
brand (the app name as a heading, a tagline, and the value-proposition messages) using `@/theme`
tokens and the brand `primary` accent — with no raw color literals, no Material-style widget port,
and no copied Flutter illustrations (the platform is the design reference). The screen SHALL
consume only shared `@/components/*`, `@/theme`, `expo-router`, and i18n — it SHALL NOT import the
school-selection seams or its own feature barrel.

#### Scenario: The welcome surface is the onboarding entry
- **WHEN** the onboarding flow is entered (`timecalendar-dev://onboarding` or the Profile entry link)
- **THEN** the brand/welcome surface is shown
- **AND** it renders the app name as a heading and the value-proposition copy from translation keys

#### Scenario: The welcome surface is a presentation-only feature folder
- **WHEN** the onboarding feature folder is located
- **THEN** it is `mobile/src/features/onboarding/` with only a `ui/` sublayer (screen + colocated test + barrels)
- **AND** it has no `data/`, `store/`, or `form/` sublayer

#### Scenario: The welcome screen respects feature boundaries
- **WHEN** the welcome screen's imports are inspected
- **THEN** it imports only `@/components/*`, `@/theme`, `expo-router`, and i18n
- **AND** it does not import the school-selection seams (`@/features/school-selection/*` internals) or its own feature barrel

### Requirement: The brand surface uses brand color with verified contrast
The welcome surface SHALL use the brand `primary` token as an accent and SHALL respect the
documented WCAG-AA brand contrast rule in `mobile/src/theme/tokens.ts`: white text SHALL NOT be
placed on the bright identity-pink brand fill (`#E91E63`, below the body contrast floor). A
white-on-brand surface, if used, SHALL ride the darker brand tone (`#C2185B`); otherwise the brand
SHALL be used as a foreground accent / large/UI element on a token background. The chosen
foreground/background pairing SHALL be one of the documented verified pairs.

#### Scenario: The brand CTA meets the contrast rule
- **WHEN** the welcome call-to-action renders with a brand color
- **THEN** its text/background pairing is a documented WCAG-AA-verified pair
- **AND** white text is not placed on the bright `#E91E63` brand fill

### Requirement: The onboarding Stack is welcome-first, with the school step at its own route
The nested onboarding Stack SHALL be ordered so the welcome surface is its entry: the entry route
(`mobile/src/app/onboarding/index.tsx`) SHALL re-export the welcome screen, the school-picker step
SHALL move to its own route (`mobile/src/app/onboarding/school.tsx`), and the group-picker step
(`mobile/src/app/onboarding/groups.tsx`) SHALL be unchanged. Each route SHALL remain a thin
entrypoint that only re-exports a feature `ui/` sub-barrel (the route-structure rule). The
`onboarding` group SHALL remain a `Stack` sibling of the `(tabs)` group in the root layout. The
development deep links SHALL be: `timecalendar-dev://onboarding` (welcome),
`timecalendar-dev://onboarding/school` (school step), and
`timecalendar-dev://onboarding/groups?schoolId=<id>` (group step).

#### Scenario: The welcome surface is the entry route
- **WHEN** `mobile/src/app/onboarding/index.tsx` is located
- **THEN** it re-exports the welcome screen from `@/features/onboarding/ui`
- **AND** it is a one-line thin route entrypoint

#### Scenario: The school step has its own route
- **WHEN** `mobile/src/app/onboarding/school.tsx` is located
- **THEN** it re-exports `SchoolPickerScreen` from `@/features/school-selection/ui`
- **AND** the school-picker screen implementation itself is unchanged

#### Scenario: The onboarding group remains a Stack sibling of the tabs
- **WHEN** the root layout declares its routes
- **THEN** `onboarding` is a `Stack` screen sibling of the `(tabs)` group
- **AND** its nested stack layout is unchanged

### Requirement: The welcome call-to-action navigates into the existing school step
The welcome surface SHALL provide a single primary call-to-action that navigates to the school
step (`/onboarding/school`) using Expo Router. Selecting a school in that step SHALL continue to
push the group step for that school (unchanged from the existing read flow).

#### Scenario: The call-to-action opens the school step
- **WHEN** the user activates the welcome call-to-action
- **THEN** the school step (`/onboarding/school`) is pushed onto the onboarding stack

#### Scenario: The downstream school→group navigation is unchanged
- **WHEN** the user selects a school in the school step
- **THEN** the group step for that school's id is pushed (the existing behavior)

### Requirement: Onboarding is reachable but not a hard startup gate
The onboarding flow SHALL be reachable from the Profile tab via an accessible entry control whose
target is the welcome surface (`/onboarding`), and via the development deep link. The app SHALL
NOT auto-route a first-run user into onboarding by gating first paint; the school-selection store's
derived onboarding-complete signal SHALL be left unchanged and available for the later step that
owns the startup gate.

#### Scenario: Onboarding is reachable from Profile
- **WHEN** the user activates the onboarding entry control on the Profile tab
- **THEN** the welcome surface is shown

#### Scenario: First launch is not force-gated into onboarding
- **WHEN** the app cold-launches with no school selected
- **THEN** the app does not auto-redirect first paint into the onboarding flow
- **AND** the onboarding-complete derivation in the school-selection store is unchanged

### Requirement: The welcome surface is accessible
The welcome title SHALL be exposed as a heading (via the `ThemedText` heading-role contract). The
call-to-action SHALL declare an accessibility role and a meaningful translated accessibility label
and provide a touch target of at least 44pt (iOS) / 48dp (Android). No text SHALL disable font
scaling. Any entrance motion SHALL honor the reduced-motion setting; a static surface (no motion)
trivially satisfies this.

#### Scenario: The welcome title is a heading
- **WHEN** the welcome surface renders its title
- **THEN** the title is exposed with a heading accessibility role

#### Scenario: The call-to-action is accessible
- **WHEN** the call-to-action renders
- **THEN** it declares an accessibility role and a translated accessibility label
- **AND** it provides a ≥44pt/48dp touch target

#### Scenario: Reduced motion is honored
- **WHEN** the surface ships static, or any entrance animation is added
- **THEN** no motion plays under the reduced-motion setting and the final visual frame is identical

### Requirement: The welcome surface strings are fully localized (FR + EN)
Every user-facing string on the welcome surface SHALL be a translation key with complete FR and EN
catalog entries — the title, the tagline, the value-proposition messages, the call-to-action
label, and the call-to-action accessibility label. Localization SHALL be enforced by the
no-hardcoded-strings lint rule and by `tsc`-typed bidirectional FR/EN parity.

#### Scenario: No hardcoded user-facing string on the welcome surface
- **WHEN** the welcome surface renders text or an accessibility label
- **THEN** that string comes from a translation key
- **AND** the no-hardcoded-strings lint rule passes

#### Scenario: FR and EN catalogs stay in parity
- **WHEN** a welcome key is added to one catalog
- **THEN** the same key exists in the other catalog
- **AND** `tsc` fails if a key is missing or extra in either direction

### Requirement: The welcome surface is verified by an automated component test under the coverage gates
The unit-test suite SHALL include a colocated test for the welcome screen (under the 70% floor —
it is a `ui/` sublayer) that renders the screen through the real theme + i18n trees and asserts:
the localized brand title and value-proposition copy render (not raw keys), and activating the
call-to-action navigates to the school step (asserted via a mocked router). The configured
coverage thresholds SHALL stay green without changing `jest.config.js`; no new 90%-logic glob is
introduced (the welcome surface adds no logic sublayer).

#### Scenario: The welcome screen test asserts localized render and navigation
- **WHEN** the welcome screen test runs
- **THEN** it asserts the localized title and value-proposition strings render
- **AND** it asserts the call-to-action navigates to `/onboarding/school`

#### Scenario: The coverage gate stays green without config changes
- **WHEN** the suite runs with coverage
- **THEN** all configured thresholds still pass
- **AND** `jest.config.js` `coverageThreshold` is unchanged

### Requirement: The Maestro onboarding flow proves welcome → call-to-action → live school read
The e2e suite's `mobile/.maestro/onboarding.yaml` SHALL be extended (not replaced) to cold-launch
the development-variant app, deep-link to the welcome surface (`timecalendar-dev://onboarding`),
assert the brand title renders, activate the call-to-action, then assert a seeded school renders
from the live `GET /schools` round-trip (app → generated client → `customFetch` → NestJS →
Postgres, nothing mocked) using the existing stable ASCII seeded fixture name. The flow SHALL stay
shared across iOS and Android (stable localized text / testIDs, no per-platform selectors).

#### Scenario: The flow proves the welcome surface and the live read
- **WHEN** the onboarding Maestro flow runs on iOS or Android
- **THEN** it deep-links to the welcome surface and asserts the brand title renders
- **AND** after activating the call-to-action it asserts the seeded school name renders from the live endpoint

