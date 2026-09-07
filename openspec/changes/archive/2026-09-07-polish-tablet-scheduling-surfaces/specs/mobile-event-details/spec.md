## ADDED Requirements

### Requirement: Every event-details outcome uses one readable lane
Event details SHALL place loaded content, loading, missing/not-found, recoverable error content, and the resolved event checklist in one `readable` lane measured inside the existing safe-area/presentation owner. The surface SHALL remain one column at every supported portrait width and SHALL preserve the existing title → metadata → event action → checklist source and accessibility order.

#### Scenario: Loaded details and checklist stay readable on tablet
- **WHEN** a synced or personal event resolves at a portrait-tablet owner width
- **THEN** its title, date, tags, metadata, update text, action feedback, and checklist align within the centered readable lane
- **AND** checklist CRUD and event hide/unhide-or-edit behavior remain unchanged

#### Scenario: Loading and missing states share the lane
- **WHEN** event details are loading or the requested event is missing
- **THEN** the accessible status content is constrained by the same readable lane used by loaded content
- **AND** the existing live-region and status semantics are preserved

#### Scenario: Large text retains one ordered column
- **WHEN** font scaling stresses the details content at 834 or a wider owner
- **THEN** content remains a wrapping one-column readable lane
- **AND** source and focus order are not changed by the eligible optional-column breakpoint

#### Scenario: Compact details behavior is preserved
- **WHEN** the details owner reports a width below 600
- **THEN** loaded and status content use compact readable-lane gutters
- **AND** routing, scrolling, actions, metadata, and checklist behavior remain unchanged
