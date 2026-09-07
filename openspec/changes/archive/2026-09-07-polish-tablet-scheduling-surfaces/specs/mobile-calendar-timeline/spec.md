## ADDED Requirements

### Requirement: Calendar day and week retain full-bleed renderer ownership
Calendar day and week modes SHALL continue to give the renderer-neutral timeline seam the complete positive width of the existing Calendar content owner. Responsive Agenda constraints SHALL NOT cap the timeline, enter the calendar-kit adapter, replace platform-owned header/actions/view-menu chrome, or reposition the Android add FAB away from the full-bleed Calendar bounds.

#### Scenario: Day and week fill their owner on tablet
- **WHEN** day or week mode is active at a portrait-tablet width
- **THEN** the timeline receives the complete laid-out Calendar width without a responsive gutter or content cap
- **AND** existing tile rendering, all-day lanes, gestures, date focus, and bottom-inset behavior are preserved

#### Scenario: Android FAB follows full-bleed bounds
- **WHEN** Calendar renders its Android add FAB in day or week mode
- **THEN** the FAB remains anchored to the full-bleed Calendar bounds with its existing edge offset and action

#### Scenario: Native Calendar chrome remains platform-owned
- **WHEN** responsive scheduling polish is applied
- **THEN** the existing iOS and Android header, Today action, Add action, and view menu retain their platform-specific ownership, labels, and behavior
