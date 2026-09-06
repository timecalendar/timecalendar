## ADDED Requirements

### Requirement: Held-calendar expansion reopens Activity pagination

A completed or partial Activity older-page chain SHALL describe only the held-calendar set that
established it. After the first loaded held-calendar observation, an observed addition SHALL clear
the persisted older-page cursor and completion flag before a newest-page response for the expanded
set adopts its cursor. The reset SHALL delete no cached Activity row and SHALL NOT change the read
watermark, unread count, or last-successful-refresh timestamp.

The lifecycle edge SHALL then force the existing newest-page coordinator. It SHALL join an already
in-flight sync-triggered newest refresh through the existing single-flight slot, or issue a new
refresh when the sync-triggered refresh finished before the reset. The older-page single-flight
slot and cursor-recovery behavior SHALL remain unchanged. Calendar removal pruning SHALL remain
independent and SHALL continue to use the authoritative post-transition held set.

#### Scenario: A completed baseline chain expands to a cursored history

- **GIVEN** one held calendar's newest refresh stored its complete history and cached rows
- **WHEN** a second held calendar is observed and its combined history spans more than one page
- **THEN** the older-page chain is reopened without deleting the baseline rows or moving read state
- **AND** the expanded newest page stores its live next cursor
- **AND** loading the older page sends that cursor and stores the following page

#### Scenario: Expansion overlaps the calendar-sync refresh

- **WHEN** the held-calendar addition is observed while calendar sync's forced Activity refresh is in flight
- **THEN** the lifecycle refresh joins that request rather than issuing a duplicate newest-page request
- **AND** the shared response adopts its cursor after the chain reset

#### Scenario: Removal and hidden-calendar safety remain intact

- **WHEN** a calendar is removed, hidden, or added while the ownership observer is mounted
- **THEN** removals still prune to the full current held set, hidden calendars remain held, and additions prune no cached row
- **AND** the first loaded observation remains a baseline that performs no prune or pagination reset
