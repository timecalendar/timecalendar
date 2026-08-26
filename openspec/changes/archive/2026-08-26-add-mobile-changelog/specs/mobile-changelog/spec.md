## ADDED Requirements

### Requirement: Changelog releases are bundled, typed, localized, and versioned

The mobile app SHALL own a readonly bundled changelog catalog under the Changelog feature.
It SHALL export `CHANGELOG_VERSION = 4` and exactly one initial release labeled `4.0` whose
item title/subtitle keys and SF Symbols / Material Symbols icon maps are statically typed.
Every visible and assistive string SHALL have English and French catalog parity. The current
integer and release catalog SHALL ship in the JavaScript bundle so a future OTA update can
add a release and bump the gate without a native binary.

#### Scenario: English 4.0 catalog renders
- **WHEN** the Changelog content renders in English
- **THEN** it shows one Version 4.0 section describing the fresh design, faster calendar,
  and native iOS/Android experience
- **AND** each item has a platform symbol and localized title/subtitle

#### Scenario: French catalog has exact parity
- **WHEN** the same content renders in French
- **THEN** every heading, item, control, hint, and accessibility label is translated
- **AND** no raw i18n key or English fallback is shown

#### Scenario: Current version matches bundled content
- **WHEN** the catalog contract is tested
- **THEN** at least one release has numeric version 4
- **AND** no bundled release has a numeric version greater than `CHANGELOG_VERSION`

### Requirement: Seen-version persistence is total and migration-ready

The Changelog feature SHALL persist one MMKV number at the flat key
`changelogSeenVersion` through `@/storage`. Reads SHALL accept only finite non-negative safe
integers and SHALL treat an absent or malformed value as absent without throwing. The feature
SHALL publicly export one typed `setChangelogSeenVersion` setter for Phase 09 to import the
validated Flutter `current_version` value before tabs eligibility runs.

#### Scenario: Valid value round-trips
- **WHEN** the setter stores version 3
- **THEN** the reader returns 3 from `changelogSeenVersion`

#### Scenario: Missing or malformed value is total
- **WHEN** the key is missing or contains a non-finite, negative, fractional, or otherwise
  invalid value
- **THEN** the reader returns absent
- **AND** no error escapes the feature store

#### Scenario: Phase 09 can import Flutter version 3
- **WHEN** Phase 09 validates `flutter.current_version` as 3 and invokes the exported setter
  before the tabs layout mounts
- **THEN** the next Changelog gate evaluation observes 3

### Requirement: Automatic presentation follows once-per-version gating

The app SHALL evaluate the Changelog gate once when the `(tabs)` layout becomes eligible.
An absent/malformed seen value SHALL be synchronously seeded to `CHANGELOG_VERSION` without
navigation. A value lower than `CHANGELOG_VERSION` SHALL navigate exactly once to the sheet
and the sheet SHALL display only releases with a greater numeric version. A value equal to or
greater than `CHANGELOG_VERSION` SHALL not navigate.

#### Scenario: Fresh install seeds silently
- **WHEN** tabs first mount and `changelogSeenVersion` is absent
- **THEN** the app writes 4 to the key
- **AND** it does not open the Changelog sheet

#### Scenario: Migrated user sees only the new release
- **WHEN** tabs first mount with `changelogSeenVersion` equal to 3
- **THEN** the app opens `/changelog-sheet` exactly once
- **AND** the sheet contains the 4.0 release and no release at or below version 3

#### Scenario: Current or future value skips
- **WHEN** tabs first mount with `changelogSeenVersion` equal to or greater than 4
- **THEN** the app does not open the Changelog sheet
- **AND** it does not lower the stored value

#### Scenario: Rerender does not duplicate presentation
- **WHEN** the eligible tabs layout rerenders before the sheet is dismissed
- **THEN** no second navigation to `/changelog-sheet` occurs

### Requirement: Automatic presentation never covers onboarding

The automatic Changelog gate SHALL be owned by the `(tabs)` layout rather than the global
root or onboarding Stack. A cold onboarding route SHALL not mount or evaluate the gate, and
returning to tabs SHALL be the first eligible evaluation point.

#### Scenario: Cold onboarding deep link remains uncovered
- **WHEN** the app opens a route under `/onboarding` from a cold state
- **THEN** the Changelog gate does not navigate
- **AND** no sheet is presented over the onboarding flow

#### Scenario: Tabs become eligible after onboarding navigation
- **WHEN** navigation reaches the `(tabs)` hierarchy after onboarding
- **THEN** the gate evaluates the persisted seen version using the normal rules

### Requirement: History and sheet share one native content presentation

The app SHALL expose `/changelog` as a regular pushed root Stack screen that shows all
bundled releases and `/changelog-sheet` as a root modal with a visible native header. The
sheet SHALL use an iOS form-sheet presentation with a large scrollable detent/grabber and an
Android full-screen native modal presentation. Both surfaces SHALL compose the same grouped
version/item content component with themed, safe-area-aware, wrapping layout and decorative
symbols hidden from assistive technology.

#### Scenario: History shows every release
- **WHEN** a user opens `/changelog` from About
- **THEN** the regular pushed screen shows every bundled version newest-first
- **AND** native back navigation returns to About

#### Scenario: Sheet follows each platform idiom
- **WHEN** `/changelog-sheet` is presented on iOS or Android
- **THEN** iOS uses the configured form sheet and Android uses the configured full-screen
  modal form
- **AND** both have a visible localized native header and scrollable shared content

#### Scenario: Content is accessible at large text
- **WHEN** a screen reader or large accessibility text size is active
- **THEN** version headings are exposed as headings, each item is read in logical order,
  decorative symbols are not separate focus targets, and text/controls remain operable

### Requirement: Every automatic-sheet dismissal acknowledges version 4

The Changelog sheet SHALL persist `CHANGELOG_VERSION` before dismissing from its localized
close action or Continue primary action. Native swipe dismissal, Android back, or parent
removal SHALL also persist the same value through an idempotent lifecycle backstop. After
dismissal, the next gate evaluation SHALL not present version 4 again.

#### Scenario: Continue acknowledges before dismissal
- **WHEN** the user activates Continue
- **THEN** version 4 is written before Expo Router dismisses the sheet

#### Scenario: Close acknowledges before dismissal
- **WHEN** the user activates the localized close action
- **THEN** version 4 is written before Expo Router dismisses the sheet

#### Scenario: Native dismissal acknowledges on unmount
- **WHEN** the sheet leaves through a native gesture, Android back, or parent removal
- **THEN** lifecycle cleanup writes version 4
- **AND** a subsequent tabs eligibility check skips presentation

### Requirement: Changelog behavior has automated and device proof

Pure catalog, selection, store, and gate logic SHALL clear the configured 90% per-file line
and branch thresholds. Presentational tests SHALL cover both surfaces, EN/FR content,
accessibility, and all dismissal paths. A route-structure test SHALL prove thin routes, root
Stack presentation, and tabs-only gate placement. A shared-platform Maestro flow SHALL cover
About to full history. If the existing harness cannot seed MMKV, the automatic sheet flow
SHALL be recorded as not applicable with rationale rather than adding a production/debug
seam, and its state transitions SHALL remain covered by Jest.

#### Scenario: Machine gates verify the feature
- **WHEN** TypeScript, lint, formatting, Jest with coverage, and strict OpenSpec validation run
- **THEN** all gates pass without lowering coverage or architecture constraints

#### Scenario: Maestro reaches history from About
- **WHEN** the shared iOS/Android Maestro flow opens About and activates its Changelog row
- **THEN** the 4.0 history screen and stable localized item copy are visible

#### Scenario: Device-only behavior is preserved for human proof
- **WHEN** implementation is handed off on the no-simulator host
- **THEN** the migration inbox contains a non-blocking iOS/Android checklist for modal
  presentation, all dismissal paths, schemes, screen readers, and large text
