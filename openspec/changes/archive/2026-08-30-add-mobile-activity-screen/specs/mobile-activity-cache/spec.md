# mobile-activity-cache — delta

## ADDED Requirements

### Requirement: Cached Activity history and Activity state are readable reactively

The Activity data layer SHALL expose reactive reads over both Activity tables, so a consumer re-renders when a page write, a prune, or a read-state write changes them, without polling and without holding a second copy of the data.

The history read SHALL return the cached logs newest first with the same deterministic tie-break the one-shot read uses, mapped to the domain type through the existing defensive mapper, and SHALL report whether the underlying query has settled at least once so a consumer can distinguish "not read yet" from "genuinely empty".

The state read SHALL return the same defaults a missing singleton row produces for the one-shot read, so a fresh install and a reset device behave identically.

These reads SHALL go through the database seam's re-exported reactive query helper, not a direct import of the database driver, and SHALL remain the only way a consumer outside the Activity data layer observes Activity tables.

#### Scenario: A stored page updates a mounted consumer

- **WHEN** a page write stores new rows while a consumer is rendering the cached history
- **THEN** the consumer re-renders with the stored rows
- **AND** the rows are ordered newest first

#### Scenario: An unsettled read is distinguishable from an empty cache

- **WHEN** the reactive history read has not settled yet
- **THEN** it reports that it has not settled
- **AND** a consumer can render a loading state rather than an empty state

#### Scenario: A missing state row reads as the documented defaults

- **WHEN** the reactive state read runs with no singleton row present
- **THEN** it returns the documented default read watermark, unread count, cursor, and completion flag

### Requirement: The unread badge value is a pure rule over the stored count

The Activity data layer SHALL expose a pure function mapping a stored unread count to its badge text, returning no badge below one, the decimal count from one through ninety-nine, and a capped "99+" representation for any count of one hundred or more.

The rule SHALL be a plain function rather than a component, so it is callable outside React, is covered by the logic coverage gate, and can be consumed by the Settings hub without importing an Activity screen module.

The capped representation SHALL NOT be a translation key: it is a numeral and a plus sign, identical in every supported locale. The accompanying accessible name is translated by its consumer.

#### Scenario: The rule maps counts to badge text

- **WHEN** the rule is applied to zero, one, ninety-nine, one hundred, and a much larger count
- **THEN** it yields no badge, "1", "99", "99+", and "99+" respectively
