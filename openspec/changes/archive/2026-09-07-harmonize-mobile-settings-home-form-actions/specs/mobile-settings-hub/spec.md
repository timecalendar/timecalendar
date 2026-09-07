## ADDED Requirements

### Requirement: Settings section labels preserve localized casing
Settings grouped-section labels SHALL render the casing supplied by the active localized resource and SHALL NOT apply an uppercase or lowercase text transformation. The existing semantic label typography, secondary color, inset, section spacing, grouped surface, and platform-specific radius SHALL keep Calendars, Events, Preferences, App, Support, and Environment visually distinct from destination rows on iOS and Android.

#### Scenario: French section labels use catalog casing
- **WHEN** Settings renders in French
- **THEN** every section label uses the casing stored in the French catalog without a visual text transform
- **AND** the grouped surfaces and destination rows remain unchanged

#### Scenario: English hierarchy remains clear on both platforms
- **WHEN** Settings renders on iOS or Android in English
- **THEN** section labels use normal localized casing
- **AND** their semantic typography, spacing, and grouped containers distinguish them from rows without forced uppercase
