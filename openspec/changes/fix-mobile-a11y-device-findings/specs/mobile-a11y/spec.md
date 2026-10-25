## ADDED Requirements

### Requirement: Icons follow an explicit text-scaling contract

Every symbol icon in the app SHALL declare whether it scales with text. An icon beside or inside a text control SHALL grow with the OS text size (optionally up to the same cap as its neighbor text), and its container SHALL grow with it. A standalone chrome icon SHALL keep its design size at every text size. On both platforms no icon glyph SHALL be clipped by its own box at any text size, including Android font scale 2.0. Icons SHALL be hidden from assistive technology; the control that contains an icon owns its accessible name.

#### Scenario: A text-adjacent icon grows with the font scale

- **WHEN** an icon declared as text-scaled with size 20 renders at font scale 2.0
- **THEN** its glyph and its box both measure 40

#### Scenario: A text-adjacent icon honors its neighbor's cap

- **WHEN** a text-scaled icon with size 12 and a cap of 1.2 renders at font scale 2.0
- **THEN** its glyph and its box both measure 14.4

#### Scenario: A chrome icon keeps its size

- **WHEN** an icon declared as fixed with size 24 renders at font scale 2.0
- **THEN** its glyph and its box both measure 24 and the glyph does not scale with the OS font size

#### Scenario: Icons are decorative

- **WHEN** any icon renders on either platform
- **THEN** the icon is not an accessibility element and is not announced

#### Scenario: Every Android glyph resolves to the Material Symbols codepoint

- **WHEN** the app's Android glyph table is compared with the Material Symbols font table
- **THEN** every glyph name maps to the same codepoint in both

### Requirement: Accessibility text sizes are detected through one threshold

The app SHALL treat a text size as an accessibility size when the OS font scale is at or above the iOS accessibility-medium multiplier (1.786), on both platforms, through one shared detection used by every layout that changes shape at accessibility sizes. The detection SHALL follow a live text-size change without a restart.

#### Scenario: Threshold boundaries

- **WHEN** the font scale is 1.353 (iOS xxxLarge)
- **THEN** the text size is not an accessibility size
- **AND** at 1.786 and above it is an accessibility size

### Requirement: Unbreakable brand text caps its scale

Text whose content includes the one-word brand name "TimeCalendar" SHALL cap its font scale at 1.5, so the word never breaks inside itself at the largest text sizes. The cap SHALL come from one shared theme value and SHALL apply only to that brand text.

#### Scenario: The brand word stays whole at the largest size

- **WHEN** the Home app name or an onboarding page title renders at iOS AX5 or Android font scale 2.0
- **THEN** its font scale multiplier is capped at 1.5
