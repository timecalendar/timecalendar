## MODIFIED Requirements

### Requirement: Settings presents a grouped hierarchy of live destinations
Settings SHALL render through the project-owned native settings chrome contract. iOS SHALL use one SwiftUI Form with native Sections and Android SHALL use one Material list with native section and row composition. The hub SHALL preserve the ordered Calendars summary, Events, Preferences, App, Support, and capability-gated Developer groups; the existing Activity, Personal events, Hidden events, Appearance & language, Time zone, Notifications, About, and Feedback destinations; the unread Activity badge; and the Show weekends preference. The Developer group SHALL contain exactly one navigation row, which opens `/developer`; Settings SHALL NOT host the environment control, the settings gallery row, or any other developer tool directly. No destination SHALL become dead, reordered across its established group, or silently converted from navigation to a plain action.

#### Scenario: Hub uses one platform-native scroll owner
- **WHEN** Settings renders on iOS or Android
- **THEN** the native Form or Material list owns scrolling and content insets
- **AND** no React Native ScrollView or nested native list also owns the page scroll

#### Scenario: Existing destinations and live state survive composition
- **WHEN** Settings renders with calendars, an unread activity count, a weekend preference, and a non-production environment capability
- **THEN** the established destinations remain in their established groups
- **AND** the calendar summary, badge, and switch state reflect their live sources
- **AND** the final Developer group shows one row that opens `/developer`

#### Scenario: Developer tools do not render in Settings
- **WHEN** Settings renders with a development or preview capability
- **THEN** no environment entry and no settings gallery row render in the hub

#### Scenario: Production capability still hides environment controls
- **WHEN** the backend-environment capability is production
- **THEN** the Developer section and its row do not render
- **AND** no environment control renders in Settings

### Requirement: Settings behavior is covered by automated and on-device proofs
Automated tests SHALL cover native host/section/row contracts, group order, all hub routes, calendar-summary loading and empty states, unread badge, weekend switch, Developer-row gating and its `/developer` route, the absence of the environment and gallery rows, localized normal-case section labels, and compatibility action/value/navigation consumers in About and Environment. Tests SHALL verify both platform branches and one-scroll-owner structure without claiming rendered native fidelity. The project owner SHALL perform device acceptance on iOS and Android for grouped/list geometry, ripple and whole-row activation, both themes, French and English, large text, screen-reader traversal, and phone/tablet sizing.

#### Scenario: Automated gates protect behavior and consumers
- **WHEN** the mobile typecheck, lint, and affected Jest suites run
- **THEN** hub behavior and native chrome contracts pass
- **AND** About and Environment consumers render and act without native-host errors

#### Scenario: Device acceptance owns visual fidelity
- **WHEN** the owner evaluates the implementation build on iOS and Android
- **THEN** platform geometry, scrolling, navigation, themes, localization, large text, and assistive behavior are evaluated on real native hosts
- **AND** host tests are not cited as proof of pixel fidelity
