## ADDED Requirements

### Requirement: Cached Activity history can be pruned to a supplied held-calendar set without a page write

The Activity repository SHALL expose an ownership prune that deletes every cached Activity row whose calendar is absent from a supplied held-calendar set, in one transaction, writing no read state, no cursor state, and no refresh timestamp, and requiring no server snapshot time.

An empty held-calendar set SHALL clear the cached rows outright, matching the page-write path's treatment of an empty set.

This operation exists because the ownership prune otherwise runs only inside a page write, and a device holding no calendars issues no request and therefore performs no page write. It SHALL be called only by a caller that observed a calendar removal and can therefore supply an authoritative post-removal set. A speculative read of the calendar sources is not such a caller: it cannot distinguish a device that genuinely holds no calendars from a read that raced the calendar sources table, and pruning on the latter would destroy the entire cache.

#### Scenario: Removing one calendar removes only its rows

- **WHEN** the prune is called with a held set omitting one calendar that has cached rows
- **THEN** that calendar's rows are deleted
- **AND** every other held calendar's rows are still present

#### Scenario: Removing the last calendar clears the cache

- **WHEN** the prune is called with an empty held set
- **THEN** no cached Activity row remains

#### Scenario: The prune leaves read and pagination state alone

- **WHEN** the prune is called
- **THEN** the read watermark, the unread count, the last-successful-refresh timestamp, the older-page cursor, and the older-page completion flag are all unchanged
