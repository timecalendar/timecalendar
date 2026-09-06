## ADDED Requirements

### Requirement: Event-details orchestration is focused and directly verifiable

The exported `EventDetailsScreen` React function SHALL remain below 200 lines and SHALL express loading, resolved not-found, and resolved-event outcomes as straightforward top-level control flow. Header action selection, async state presentation, and rich event content SHALL live in focused calendar `ui/` modules that preserve the existing sublayer dependency direction. Internal extracted modules SHALL NOT widen the calendar feature's public API beyond the existing `EventDetailsScreen` export.

The decomposition SHALL preserve the complete unified event-details behavior: synced visible events offer the hide chooser; synced hidden events offer unhide; personal events offer Edit; both event kinds render the rich details and checklist; loading and not-found retain their accessible translated states. Header actions SHALL retain their exact persistence and navigation timing, and content SHALL retain calendar-name threshold/fallback, locale/display-zone/all-day formatting, translations, accessibility semantics, test IDs, and visual layout.

#### Scenario: Loading remains a direct screen outcome

- **WHEN** the rich event read is still loading
- **THEN** the screen renders the translated accessible loading state with the standard header
- **AND** it does not render the not-found state or resolved content

#### Scenario: Not found remains a direct screen outcome

- **WHEN** loading has completed and neither event source resolves the uid
- **THEN** the screen renders the translated accessible not-found state with the standard header
- **AND** it does not expose a synced or personal header action

#### Scenario: Synced visible behavior is preserved

- **WHEN** a resolved synced event is absent from both hidden-event sets
- **THEN** the header exposes the existing hide action and native uid/name chooser
- **AND** choosing either hide mode navigates back only when that persistence call succeeds
- **AND** a failed write keeps the screen mounted with the accessible hide error notice

#### Scenario: Synced hidden behavior is preserved

- **WHEN** a resolved synced event's uid, name, or both are present in hidden-event state
- **THEN** the header exposes the existing unhide action
- **AND** activating it removes every matching uid/name entry without navigating away

#### Scenario: Personal behavior is preserved

- **WHEN** a resolved personal event renders
- **THEN** the header exposes Edit and no hide/unhide action
- **AND** Edit pushes `/personal-event-form?uid=<event uid>`
- **AND** the personal event's rich details and checklist remain mounted

#### Scenario: Rich content contracts survive extraction

- **WHEN** either event kind renders through the extracted content boundary
- **THEN** title, color, tags, optional content lines, updated footer, and checklist retain their current ordering, translations, accessibility semantics, and styling
- **AND** calendar name appears only with at least two held calendars and uses the whitespace-safe fallback
- **AND** locale, display zone, and all-day values continue through the existing formatters

#### Scenario: Extracted modules remain feature-internal

- **WHEN** the calendar UI barrels and imports are inspected
- **THEN** routes and cross-feature consumers continue to import only the existing `EventDetailsScreen` public surface
- **AND** extracted modules use the feature's sibling sublayer barrels without introducing a cycle or direct infrastructure import

### Requirement: Event-details maintainability diagnostics are resolved or evidence-classified

The implementation SHALL run React Doctor in verbose changed-file scope after the decomposition. The `EventDetailsScreen` high-control-flow-complexity finding SHALL be absent. Manual memoization SHALL be removed from the changed screen UI only when it has no semantic referential-identity or measured performance role; memoization outside the changed UI remains out of scope. Every remaining changed-file finding SHALL be classified with code and contract evidence and SHALL NOT be hidden by configuration or suppression.

The tag renderer SHALL preserve every tag occurrence, including identical duplicates. It SHALL NOT use tag name alone as identity because the generated `EventTag` contract exposes only `name`, `color`, and `icon` and establishes no unique field. A stable domain identifier SHALL be used only if uniqueness is proven from the committed contract and data path; otherwise an occurrence-aware presentation identity MAY remain as a documented React Doctor limitation because the tag bubbles hold no local state.

#### Scenario: High complexity is removed

- **WHEN** React Doctor scans the changed event-details files after implementation
- **THEN** it does not report `EventDetailsScreen` for high React-function control-flow complexity
- **AND** the exported screen function is below 200 lines

#### Scenario: Changed-file findings are classified rather than suppressed

- **WHEN** React Doctor reports any other diagnostic in a changed file
- **THEN** the PR and handoff identify it as resolved, false positive, or evidence-backed limitation with the relevant code/contract reason
- **AND** no React Doctor configuration, ignore, or suppression is added for this refactor

#### Scenario: Duplicate tags are not collapsed

- **WHEN** an event contains two tags with the same name, color, and icon
- **THEN** both tag bubbles render
- **AND** the implementation does not claim that name or the available composite fields are a unique domain identifier

#### Scenario: Memoization removal stays bounded

- **WHEN** the changed event-details UI is reviewed for manual memoization
- **THEN** only memoization with no semantic or measured performance role is removed under the enabled React Compiler
- **AND** memoization in unchanged data, renderer, checklist, and other feature modules is not broadened into this change
