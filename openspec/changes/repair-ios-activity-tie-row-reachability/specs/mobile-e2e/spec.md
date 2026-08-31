## MODIFIED Requirements

### Requirement: The Activity flow proves the real unread and pagination round trip

The mobile Maestro suite SHALL contain one top-level `activity.yaml` flow, shared unchanged across
iOS and Android, that uses the harness-managed NestJS/Postgres server and the generated v1
calendar-log client with nothing mocked.

The flow SHALL first import the dedicated older baseline calendar into cleared app state, open
Activity so the baseline server timestamp becomes the local read watermark, and positively verify
that the baseline history rendered. It SHALL then import the dedicated newer Activity calendar
without clearing app state, causing the real sync-triggered Activity refresh to search both held
tokens with the baseline watermark.

The flow SHALL observe the exact non-zero unread state on the Settings Activity row, open Activity,
and then prove that the same unread state is absent while the Settings row remains present. It SHALL
pull to refresh and traverse the long virtualized first page through deterministic, positively
asserted seeded checkpoints before observing the first-page member of the timestamp-tie pair. It
SHALL then continue scrolling until the lower-ID tie member and older-page anchor render from the
following response. Every checkpoint and boundary observation SHALL remain required and
non-optional; the traversal SHALL NOT be replaced by broader sleeps, retries, longer timeouts, or a
weaker visibility threshold.

The baseline and newer imports MAY be nested Activity-only subflows, but only `activity.yaml` SHALL
be top-level so the harness does not execute setup fragments independently.

#### Scenario: Staged imports produce and clear the unread badge

- **WHEN** the flow marks the older baseline read and then imports and synchronizes the 52-row newer
  calendar without clearing device state
- **THEN** Settings exposes the Activity row with exactly 52 unread changes
- **AND** opening Activity renders the newer server-backed history and clears that unread state
- **AND** reopening Settings positively finds the Activity row without the previously observed
  unread accessible name

#### Scenario: Pull-to-refresh keeps the real timeline available

- **WHEN** the flow performs a native pull gesture at the top of the populated Activity list
- **THEN** the forced newest-page path completes without blanking or replacing the cached timeline
- **AND** a known first-page item remains visible

#### Scenario: The virtualized first page is traversed through positive checkpoints

- **WHEN** iOS cannot traverse all 50 grouped first-page logs within one bounded
  `scrollUntilVisible` command
- **THEN** the shared flow first scrolls to and positively asserts a stable seeded midpoint row
- **AND** it then scrolls to and positively asserts the higher-ID same-timestamp boundary row
- **AND** neither observation is optional, retried, or replaced by a longer timeout

#### Scenario: Scrolling loads the real older page

- **WHEN** the flow scrolls until the lower-ID same-timestamp boundary item or older-page anchor is
  visible
- **THEN** that item renders from a real following-page response
- **AND** the first-page member of the timestamp pair was observed earlier in the journey
