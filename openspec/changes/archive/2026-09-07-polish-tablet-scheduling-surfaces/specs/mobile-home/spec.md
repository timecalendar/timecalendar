## ADDED Requirements

### Requirement: Home scheduling content shares one measured standard lane
Home SHALL resolve one `standard` responsive lane from the positive width of the existing safe-area content owner. The feature-owned header and add affordance, welcome and status content, Upcoming section, Today section, and scroll edges SHALL use that lane without adding safe-area ownership or changing their source order. Upcoming event cards SHALL retain their fixed width and horizontal access so a wider lane reveals more capacity instead of stretching cards.

#### Scenario: Tablet Home aligns one content lane
- **WHEN** Home's safe-area content owner reports a portrait-tablet width at or above 600
- **THEN** the header, welcome/status blocks, Upcoming, Today, and scroll edges use the centered standard lane with tablet gutters
- **AND** the existing platform-specific add affordance stays reachable at the lane edge

#### Scenario: Compact Home behavior is preserved
- **WHEN** the owner width is 390 or 599
- **THEN** Home retains its ordered single-column composition with compact gutters
- **AND** refresh, add, Calendar routing, event routing, all-day, checklist, and press behavior remain unchanged

#### Scenario: Wider lanes reveal fixed Upcoming cards
- **WHEN** the measured standard lane becomes wider on a tablet
- **THEN** each Upcoming card retains its established fixed width
- **AND** the horizontal scroller can reveal additional cards without removing horizontal access

### Requirement: Today timeline geometry is owned by its laid-out tile area
The Today timeline SHALL derive the pixel width for overlap placement from the finite positive layout width reported by its actual tile-area owner. It SHALL NOT infer nested geometry from global window width, content caps, or parent padding. Window dimensions MAY remain an input only for genuinely window-owned values such as font scale.

#### Scenario: First usable measurement drives overlap pixels
- **WHEN** the tile-area owner first reports a finite positive width
- **THEN** fractional overlap positions and widths are multiplied by that exact measured width
- **AND** no window-derived width is used for the placement

#### Scenario: Unmeasured events remain usable
- **WHEN** no positive tile-area measurement is available yet
- **THEN** events render in the existing ordered, interactive reflow presentation rather than guessed or zero-width absolute tiles
- **AND** the first usable measurement can select the normal geometry without changing event semantics

#### Scenario: Narrow nested owner wins over a tablet window
- **WHEN** the global window is tablet-width but the tile-area owner reports a narrower positive width
- **THEN** tile placement and the minimum-target reflow decision use the narrower tile-area width
- **AND** no event is clipped because of the wider window

#### Scenario: Timeline behavior remains unchanged after remeasurement
- **WHEN** the tile-area owner reports a later positive width
- **THEN** placement recalculates from that width while overlap packing, time positions, now indicator, all-day separation, checklist progress, Dynamic Type reflow, accessibility labels, and event presses retain their existing behavior
