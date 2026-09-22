## ADDED Requirements

### Requirement: Event details localizes missing titles and totally narrows optional rich content

The unified event-details presentation SHALL render `(No title)` in English or `(Sans titre)` in French when a synced or personal event title is missing or blank. Its rich row mapper SHALL omit malformed optional location, description, teacher, and tag values before rendering and SHALL preserve every valid sibling value. The original UID, synced read-only behavior, personal editability, dates, and persisted row SHALL remain unchanged.

#### Scenario: Untitled synced details remain readable and read-only

- **WHEN** a synced event with a blank title opens in English or French
- **THEN** its heading uses the corresponding localized fallback and its complete date/time remains visible
- **AND** it retains the synced read-only actions and original UID

#### Scenario: Untitled personal details remain editable

- **WHEN** a personal event with a missing title reaches the unified details screen
- **THEN** its heading uses the localized fallback
- **AND** the existing Edit action still targets that personal event's original identity

#### Scenario: Malformed rich optional entries cannot crash details

- **WHEN** teachers or tags contain non-string or incomplete entries and optional text is unusable
- **THEN** invalid values are omitted while valid entries render
- **AND** the details screen does not throw, mutate the row, or lose required event meaning
