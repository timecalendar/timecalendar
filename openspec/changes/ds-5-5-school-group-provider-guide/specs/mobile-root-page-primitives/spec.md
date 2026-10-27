## MODIFIED Requirements

### Requirement: Root pages share a measured frame and optional intro hierarchy

The mobile app SHALL provide shared `RootPage` and `PageIntro` components for user-facing non-tab destinations. `RootPage` SHALL own the themed full-height surface, non-header safe-area edges, consistent vertical rhythm, and one measured `readable` or `standard` lane while leaving scrolling, virtualization, overlays, presentation, and feature state to the consumer. `PageIntro` SHALL render a required caption only; the native Stack title SHALL be the route heading, and `PageIntro` SHALL NOT accept a heading, so a second in-content copy of the route title cannot be passed to it.

#### Scenario: Native title stands alone

- **WHEN** a root destination supplies its localized route title through `Stack.Screen` and needs only explanatory intro copy
- **THEN** it renders `PageIntro` with that caption and no content heading
- **AND** the caption follows the shared spacing and text hierarchy

#### Scenario: A heading cannot be passed to the intro

- **WHEN** a caller passes a title to `PageIntro`
- **THEN** type checking fails

#### Scenario: Virtualized content keeps its owner

- **WHEN** a root page contains a `FlatList` or `SectionList`
- **THEN** `RootPage` provides the measured lane and available height without wrapping the list in another scroller
- **AND** the list retains its own refresh, pagination, and inset behavior

#### Scenario: Layout follows the actual page owner

- **WHEN** the page owner reports compact and portrait-tablet widths
- **THEN** the page resolves the existing compact/tablet gutters and semantic lane caps from `useAdaptiveLayout`
- **AND** it does not infer width from a device model or unrelated window
