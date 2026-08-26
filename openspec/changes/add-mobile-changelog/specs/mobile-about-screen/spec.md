## MODIFIED Requirements

### Requirement: About presents concise localized content in native grouped rows

The About screen SHALL render two short product-description paragraphs followed by grouped
sections for privacy, contact, app information, and developers. It SHALL use the established
Settings section/row grammar and a data-driven row model containing privacy policy, email
contact, installed version/build, a Changelog router destination, Samuel Prak, and Eddy
Monnot. The Changelog row SHALL target the working `/changelog` history route and use the
same per-platform SF Symbols / Material Symbols mapping as other rows. All visible copy,
section titles, accessibility labels, values, and hints SHALL have typed English and French
catalog parity.

The screen SHALL NOT render Suggestions/feedback, a hidden Debug action, or OTA update
identifiers until those destinations are implemented.

#### Scenario: English content renders in native groups
- **WHEN** About renders with the English locale
- **THEN** Privacy, Contact, App, and Developers sections appear in that order
- **AND** the expected product copy, privacy action, email action, installed version/build,
  Changelog destination, and developer actions are present
- **AND** Suggestions, Debug, and OTA identifiers are absent

#### Scenario: French content has exact parity
- **WHEN** About renders with the French locale
- **THEN** both product paragraphs, all section titles, every row including Changelog, all
  hints, version/build cases, recoverable errors, and accessibility copy resolve in French
- **AND** no raw key or English fallback is displayed

#### Scenario: Changelog row opens full history
- **WHEN** the user activates the full-width Changelog row
- **THEN** Expo Router pushes `/changelog`
- **AND** the row is exposed as one localized link target with a navigation hint

#### Scenario: Dynamic type preserves content and actions
- **WHEN** labels wrap at a large accessibility text size
- **THEN** rows grow rather than clip or overlap
- **AND** every interactive row remains one full-width target

### Requirement: About behavior is covered by automated and on-device proofs

The pure application-info derivation SHALL clear the configured 90% logic threshold for all
native version/build combinations. The About screen SHALL have component coverage for EN/FR
content, grouped ordering, exact browser/mail dispatch, recoverable action failures,
installed-version fallbacks, Changelog route dispatch, accessibility, safe areas, and both
platform row branches. A route-structure proof SHALL cover the thin About and Changelog
routes plus root Stack registration. A stable Maestro flow SHALL prove About deep-link and
Settings reachability followed by About-to-Changelog history navigation. A migration inbox
checklist SHALL retain device-only iOS/Android evidence without blocking automated delivery.

#### Scenario: Automated gates verify About and Changelog navigation
- **WHEN** mobile TypeScript, lint, and Jest coverage run
- **THEN** About passes all gates
- **AND** the Changelog row is proven to navigate to a registered thin history route

#### Scenario: Maestro verifies history reachability
- **WHEN** the shared-platform About Maestro flow runs against the development app
- **THEN** About is reachable by deep link and from Settings
- **AND** activating Changelog displays the full 4.0 history screen

#### Scenario: Device-only behavior remains explicit
- **WHEN** the change is ready for review on the no-KVM development host
- **THEN** a stable Maestro flow is committed for simulator-capable `main` CI
- **AND** the remaining human device checks are listed in the migration inbox note
