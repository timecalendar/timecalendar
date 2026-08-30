## ADDED Requirements

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
pull to refresh and scroll until an item that exists only beyond the first 50-row response renders.

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

#### Scenario: Scrolling loads the real older page

- **WHEN** the flow scrolls until the lower-ID same-timestamp boundary item or older-page anchor is
  visible
- **THEN** that item renders from a real following-page response
- **AND** the first-page member of the timestamp pair was observed earlier in the journey

### Requirement: The Activity flow proves current routing and cancelled inertness safely

The Activity flow SHALL activate the stable new item and the stable changed item by platform-neutral
testID and SHALL observe real current event details for the corresponding current UIDs. It SHALL
attempt to activate the stable cancelled row and SHALL prove that Activity remains the active
screen and that cancelled event details did not appear.

The flow SHALL not use Maestro's `back` command. Every cold deep-link re-entry SHALL use the existing
`stopApp` → `openLink` → optional iOS confirmation → 60-second `extendedWaitUntil` idiom.

Selectors SHALL use stable testIDs or full-match accessible-name regexes that account for iOS
accessibility-container collapse. A negative assertion SHALL be paired with a prior positive match
of the same selector or with a positive current-screen anchor, so it cannot pass because the target
was never addressable or the wrong screen rendered. Below-the-fold elements SHALL be reached with
`scrollUntilVisible`.

#### Scenario: New and changed items route to current details

- **WHEN** the flow activates the seeded new item and changed item in turn
- **THEN** each opens the existing event-details screen for its current seeded UID
- **AND** a unique seeded details value is visible, ruling out the not-found state

#### Scenario: The cancelled row is inert without a vacuous assertion

- **WHEN** the flow taps the seeded cancelled row
- **THEN** the Activity list remains positively visible
- **AND** the cancelled event's details-only content is not visible

#### Scenario: The same flow is selector-safe on both platforms

- **WHEN** the committed flow is checked and then executed on iOS and Android
- **THEN** it uses no platform-specific selector fork beyond the existing optional iOS deep-link
  confirmation
- **AND** it uses no `back` command, no unscrolled below-the-fold tap, and no unanchored negative
  claim
