# mobile-responsive-layout Specification

## Purpose
TBD - created by archiving change add-mobile-responsive-layout-foundation. Update Purpose after archive.
## Requirements
### Requirement: Responsive policy is typed and centrally exported
The mobile app SHALL define typed responsive breakpoints, semantic lane caps, lane and size-class
types, resolved metrics, and a pure resolver in the theme layer. The public policy SHALL be exported
through `@/theme`, with compact below 600, tablet at 600 and above, readable content capped at 640,
standard content capped at 800, and optional columns eligible at 834 and above.

#### Scenario: Downstream code consumes one public policy
- **WHEN** a screen needs breakpoint, gutter, lane, or optional-column information
- **THEN** it imports the typed contract from the established theme/shared-component seams
- **AND** it does not need to declare a local breakpoint or duplicate the width calculation

### Requirement: Layout resolution uses the actual positive owner width
The resolver and measured hook SHALL classify and size content from the width reported by the
container that owns the usable layout. A non-finite or non-positive width SHALL remain in the
unmeasured compact state, and the responsive layer SHALL NOT use a device model or global window
width as a substitute for a nested or presented owner.

#### Scenario: Pre-measurement behavior stays compact
- **WHEN** no finite positive owner width has been reported
- **THEN** the resolved size class is compact
- **AND** optional columns are not eligible
- **AND** rendered content remains visible with the compact-gutter fallback

#### Scenario: Nested owner overrides a wider window
- **WHEN** the application window is tablet-width but the attached layout owner reports a positive
  width below 600
- **THEN** the hook resolves compact metrics from the reported owner width
- **AND** it does not resolve tablet behavior from the wider window

### Requirement: Semantic lanes apply adaptive gutters and usable-content caps
Compact capped lanes SHALL use `Spacing.four` on both horizontal edges and tablet capped lanes
SHALL use `Spacing.six`. The readable and standard caps SHALL apply to usable content after both
gutters are removed. A full-bleed lane SHALL use the complete positive owner width without a
responsive gutter or maximum width.

#### Scenario: Readable lane centers capped usable content
- **WHEN** a readable lane resolves at any supported positive width
- **THEN** its usable content width is the lesser of 640 and the non-negative owner width remaining
  after both resolved gutters
- **AND** the usable content is centered in the owner

#### Scenario: Standard lane centers capped usable content
- **WHEN** a standard lane resolves at any supported positive width
- **THEN** its usable content width is the lesser of 800 and the non-negative owner width remaining
  after both resolved gutters
- **AND** the usable content is centered in the owner

#### Scenario: Full-bleed lane preserves width-bearing content
- **WHEN** a full-bleed lane resolves from a positive owner width
- **THEN** its usable content width equals that owner width
- **AND** no responsive gutter or maximum width is added

### Requirement: Tablet and column boundaries do not redesign composition
A positive width below 600 SHALL resolve compact and a positive width at or above 600 SHALL resolve
tablet. Optional columns SHALL be ineligible below 834 and eligible at 834 and above, but the shared
resolver and container SHALL NOT create columns or reorder content.

#### Scenario: Representative widths honor exact boundaries
- **WHEN** the resolver is evaluated at 390, 599, 600, 768, 800, 834, and 1024
- **THEN** 390 and 599 resolve compact
- **AND** 600, 768, 800, 834, and 1024 resolve tablet
- **AND** only 834 and 1024 report optional-column eligibility

#### Scenario: Eligibility leaves composition with the feature
- **WHEN** a width of 834 or greater reports optional-column eligibility
- **THEN** the adaptive container remains a single ordered content lane
- **AND** the consuming feature retains responsibility for scanability, source/focus order, and a
  one-column fallback under large-text or width stress

### Requirement: A measured hook and container share one resolver
The shared component module SHALL expose a measured hook for list, scroll, and custom-geometry
consumers and a reusable adaptive content container for ordinary view composition. Both SHALL
derive metrics and lane styling from the same pure resolver, and caller-provided view behavior
SHALL remain composable with the internal measurement handler.

#### Scenario: Positive layout events update the shared content lane
- **WHEN** the owner emits a finite positive layout width
- **THEN** the hook updates its metrics and lane style from that exact width
- **AND** the adaptive container centers or fills its child according to the requested semantic lane

#### Scenario: List and geometry consumers can reuse the measured policy
- **WHEN** a consumer cannot use the convenience wrapper because it owns a list, scroll container,
  or custom geometry
- **THEN** it can attach the hook's layout handler to its existing owner
- **AND** use the returned metrics/style without introducing a second resolver

### Requirement: Platform chrome and environmental inset ownership is preserved
The responsive foundation SHALL only provide measurement, centering, semantic maximum width, and
horizontal responsive gutter. It SHALL NOT apply safe-area insets, replace native headers or tabs,
change list inset or keyboard-avoidance behavior, anchor full-window overlays, or replace native
menus, alerts, pickers, and presentation.

#### Scenario: Existing native navigation and sheet contracts remain unchanged
- **WHEN** the responsive foundation is introduced
- **THEN** native tabs continue through the existing chrome wrapper with platform tab-bar behavior
- **AND** `/changelog-sheet` remains an iOS `formSheet` and Android `fullScreenModal` with its
  existing full-height detent and grabber settings
- **AND** existing static route/tab regression tests remain green

#### Scenario: A lane sits inside the current safe-area owner
- **WHEN** a feature applies an adaptive lane to a route that already owns safe-area or automatic
  inset behavior
- **THEN** the lane adds no safe-area inset of its own
- **AND** only its semantic horizontal gutter and centering affect inner content

### Requirement: Responsive behavior is covered by focused automated tests
The mobile test suite SHALL table-test the pure resolver at 390, 599, 600, 768, 800, 834, and 1024
for readable, standard, and full-bleed calculations. Component coverage SHALL prove the compact
pre-measurement fallback, a positive measurement update, and a nested owner narrower than its
global window.

#### Scenario: Focused responsive tests run in the mobile gate
- **WHEN** the focused responsive suites run
- **THEN** they assert exact size class, gutter, usable width, centering, and column eligibility at
  the representative widths
- **AND** they assert hook/component behavior for unmeasured and nested-owner cases
