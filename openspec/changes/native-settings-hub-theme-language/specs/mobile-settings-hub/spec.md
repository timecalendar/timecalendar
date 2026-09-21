## MODIFIED Requirements

### Requirement: Settings presents a grouped hierarchy of live destinations
Settings SHALL render through the project-owned native settings chrome contract. iOS SHALL use one SwiftUI Form with native Sections and Android SHALL use one Material list with native section and row composition. The hub SHALL preserve the ordered Calendars summary, Events, Preferences, App, Support, and capability-gated Environment groups; the existing Activity, Personal events, Hidden events, Appearance & language, Time zone, Notifications, About, and Feedback destinations; the unread Activity badge; and the Show weekends preference. No destination SHALL become dead, reordered across its established group, or silently converted from navigation to a plain action.

#### Scenario: Hub uses one platform-native scroll owner
- **WHEN** Settings renders on iOS or Android
- **THEN** the native Form or Material list owns scrolling and content insets
- **AND** no React Native ScrollView or nested native list also owns the page scroll

#### Scenario: Existing destinations and live state survive composition
- **WHEN** Settings renders with calendars, an unread activity count, a weekend preference, and a non-production environment capability
- **THEN** the established destinations remain in their established groups
- **AND** the calendar summary, badge, switch state, and environment row reflect their live sources

#### Scenario: Production capability still hides environment controls
- **WHEN** the backend-environment capability is production
- **THEN** the Environment section and control do not render

### Requirement: Settings rows and summary are accessible and resilient to large text
Every Settings row SHALL expose exactly one semantic row target or one noninteractive value. Navigation rows SHALL activate across the full row and alone display a navigation disclosure; action rows SHALL activate without a disclosure; value rows SHALL expose their value without claiming interactivity; switch rows SHALL toggle once from either the row or control activation path; and selection rows SHALL expose selected state. Native geometry SHALL retain platform minimum targets, translated labels and supporting values SHALL grow without clipping, and decorative icons/disclosures SHALL not become separate assistive-technology targets.

#### Scenario: Whole navigation and action rows activate correctly
- **WHEN** the user activates empty space within a navigation or action row
- **THEN** the row performs its route or action exactly once
- **AND** only the navigation row presents a disclosure affordance

#### Scenario: Value and switch rows retain distinct semantics
- **WHEN** assistive technology focuses a value row and a switch row
- **THEN** the value row announces its current value without a link or button action
- **AND** the switch row announces checked state and changes state once per activation

#### Scenario: Large localized content remains operable
- **WHEN** the app uses an accessibility text size and a long translated label
- **THEN** the native row grows without clipping or overlapping trailing content
- **AND** its whole minimum-size target remains operable

### Requirement: Settings behavior is covered by automated and on-device proofs
Automated tests SHALL cover native host/section/row contracts, group order, all hub routes, calendar-summary loading and empty states, unread badge, weekend switch, environment gating, localized normal-case section labels, and compatibility action/value/navigation consumers in About and Environment. Tests SHALL verify both platform branches and one-scroll-owner structure without claiming rendered native fidelity. The project owner SHALL perform device acceptance on iOS and Android for grouped/list geometry, ripple and whole-row activation, both themes, French and English, large text, screen-reader traversal, and phone/tablet sizing.

#### Scenario: Automated gates protect behavior and consumers
- **WHEN** the mobile typecheck, lint, and affected Jest suites run
- **THEN** hub behavior and native chrome contracts pass
- **AND** About and Environment consumers render and act without native-host errors

#### Scenario: Device acceptance owns visual fidelity
- **WHEN** the owner evaluates the implementation build on iOS and Android
- **THEN** platform geometry, scrolling, navigation, themes, localization, large text, and assistive behavior are evaluated on real native hosts
- **AND** host tests are not cited as proof of pixel fidelity

## ADDED Requirements

### Requirement: Native settings chrome is reusable and theme-aware
The mobile chrome boundary SHALL own the only application imports of the Expo UI primitives used for settings composition and SHALL expose stable native host, section, row, switch, checkmarked-choice, and radio-dialog contracts to features. Every native host and dialog SHALL receive the app scheme resolved through `@/hooks/use-color-scheme`, while platform geometry and system typography remain native.

#### Scenario: Feature code stays behind the chrome seam
- **WHEN** a settings feature composes a native row, section, selection list, or dialog
- **THEN** it imports the project-owned contract from `@/components/chrome`
- **AND** it does not import an Expo UI platform subpath directly

#### Scenario: Explicit scheme reaches native controls
- **WHEN** the app preference resolves dark while the device scheme is light
- **THEN** the native settings host, controls, dialogs, and Router navigation render with the resolved dark scheme
- **AND** switching the preference updates the mounted surfaces live
