## ADDED Requirements

### Requirement: Every Home event summary surfaces checklist progress

Home SHALL obtain checklist progress through one screen-level UID-set projection and SHALL pass it to the upcoming cards, today's all-day cards, and today's timed tiles in both normal and Dynamic Type reflow layouts. Synced and personal events SHALL resolve progress identically from `CalendarEvent.id`.

Each surface SHALL hide zero-item progress, show the shared inline or compact completed/total representation for nonzero progress, preserve the explicit all-complete state, and compose the localized progress phrase into the existing event accessibility label.

#### Scenario: Upcoming cards show progress for both event origins

- **WHEN** the upcoming scroller contains a synced event and a personal event with checklist items
- **THEN** each card shows the correct progress for its UID and includes that progress in its accessible label

#### Scenario: Today all-day cards show progress

- **WHEN** a today all-day event has checklist items
- **THEN** its Home all-day card shows completed/total progress and announces it with the all-day event label

#### Scenario: Today timed tiles support normal and reflow layouts

- **WHEN** a timed event renders in the normal overlap layout or Dynamic Type causes the reflow list
- **THEN** the event's checklist progress remains visible and its accessible label contains the localized progress phrase

#### Scenario: Zero-item Home events remain unchanged

- **WHEN** a Home event has no checklist rows
- **THEN** its summary contains no progress indicator or empty-progress announcement
