## MODIFIED Requirements

### Requirement: Un-hide is reachable from a hidden-events management screen

The app SHALL provide a presentational hidden-events management screen and a deep-linkable thin root route reached from Settings. The screen SHALL list name-hidden titles and uid-hidden events, resolving each uid to its current synced event title and time; a uid that no longer resolves SHALL remain omitted for Flutter parity. Every rendered entry SHALL retain its accessible un-hide control and write-failure notice.

After the reactive hidden set resolves to no rendered entries, the screen SHALL use the shared full-screen `EmptyState` with the locally bundled, theme-paired unDraw “No data” artwork and a stable `hidden-events-empty` selector. Its English title SHALL read exactly “No hidden events” and caption “Events you hide will appear here.” Its French title SHALL read exactly “Aucun événement masqué” and caption “Les événements que vous masquez apparaîtront ici.” The title and caption SHALL carry the complete accessible meaning without relying on the decorative image.

#### Scenario: The management screen lists hidden entries with un-hide controls

- **WHEN** the management screen renders with a non-empty hidden set
- **THEN** it lists the name-hidden titles and the still-resolving uid-hidden events, each with an accessible un-hide control that removes it from the set
- **AND** no full-screen empty state is mounted

#### Scenario: Empty management state

- **WHEN** nothing is hidden or only stale non-resolving uids remain
- **THEN** the management screen shows the shared illustrated full-screen empty state with `hidden-events-empty`
- **AND** it shows the exact localized title and caption instead of a crash or blank

#### Scenario: A write error remains distinct from empty content

- **WHEN** an un-hide write fails while the rendered set is otherwise empty
- **THEN** the existing accessible write-failure notice remains visible and announced
- **AND** the empty-state content does not replace or relabel the failure

#### Scenario: The management screen is reachable

- **WHEN** the user opens the Hidden events entry in Settings or its development deep link
- **THEN** the compact root Stack destination opens with its localized native header
- **AND** the back affordance is chevron-only
