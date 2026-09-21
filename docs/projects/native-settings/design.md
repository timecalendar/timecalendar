---
kind: design
status: approved
---

# Target technical design

## Current context and constraints

Expo SDK 56 / React Native 0.85 renders native controls through components/chrome. Settings
preferences and notification preferences use validated MMKV-backed feature stores. Expo
Router owns navigation. The generated subscription endpoint accepts a full PUT snapshot;
there is no preference read-back or server-side revision contract. Source paths and versions
are recorded in [the evidence register](research/evidence.md).

## Target architecture

### Native settings composition — P01, P03, D01

The feature owns labels, options, stored selections, validation, and commit policy. Chrome
owns SwiftUI/Compose primitives and their platform composition. iOS uses native Form/Section,
inline theme choices, and checkmarked lists inside explicit Expo Router selection routes.
Android uses Material list rows, switches, and single-choice radio dialogs. Plain actions
do not acquire disclosure chevrons merely because they reuse a navigation row.

The hub and preference destinations share the platform-specific surface language. Existing
appearance-settings, timezone-settings, and notification-settings routes remain valid. A
selection page has one Router navigation owner and one native scroll owner, with safe-area
and content insets owned once. No nested SwiftUI NavigationStack is assumed necessary.
Native Hosts receive the resolved app color scheme so an explicit app override reaches
controls and dialogs; system fonts, geometry, and neutral surfaces remain native.

Frequency/day preset selection commits immediately. iOS selection pages keep their native
Back behavior; Android closes the dialog on selection. Custom numeric input has a local
draft, numeric keyboard, whole-number validation, and an explicit submit action. Opening
Custom does not persist a synthetic value. A nonpreset saved value is shown as Custom (12
days) in the chooser and as 12 days on the parent. A preset-equivalent custom value selects
that preset. Cancel, Android Back, and sheet dismissal discard only uncommitted input.

### Time-zone search — P02, D02

Use @vvo/tzdb for names, aliases, and common cities; date-fns-tz and Intl for time conversion
and current offsets; and a bounded imported Unicode CLDR subset for French/English exemplar
city names. Do not ship all CLDR data or copy an unversioned list by hand. The feature owns
only an index over supplied names, display formatting, selection, and persistence.

Search is local, case/accent insensitive, and includes country names, representative and
common cities, and IANA identifiers. Distinct named zones must remain discoverable even when
the library groups them for display; grouping alone is not proof of identical historical
rules. Existing saved identifiers are not rewritten to a group representative. UTC and
fractional-offset zones are covered. Current-offset labels are computed for now; event
formatting computes the offset at the event instant, not the search-screen instant.

The iPhone chooser is a Router native form sheet with close action and iOS 26 native bottom
toolbar search. Older iOS uses native header search. iPad uses its native sheet/search layout.
Android has a full-screen search route. Selecting closes the chooser; dismissing it preserves
the selection. The initial list exposes the current zone and useful library-backed entries;
an empty query is usable, and no-results copy is localized.

### Subscription synchronization — P03, D03

One notification-feature runtime owns requests and observable status across all screens.
Screens commit local preferences and request synchronization; they do not own independent
network mutations. Startup, token rotation, relevant preference changes, effective locale/
zone changes, and calendar membership changes feed the same runtime after data is loaded.

Durable desired preferences remain the source of truth. An environment-bound dirty marker
and monotonic local generation record unsent intent; token and calendar payloads are rebuilt
from current sources rather than stored in a new durable request queue. Mutation bookkeeping
must tolerate a crash between writes: mark dirty before changing preferences, and replay the
current full snapshot on startup even if the previous session ended mid-transition.

At most one client request is active per runtime. Changes during a request coalesce into the
next latest snapshot. Success acknowledges only the captured generation/environment/token;
it cannot clear later changes. Retry always reads current state. A missing token is waiting
for registration, not a successfully synced preference. A not-yet-loaded calendar collection
must not be sent as an empty collection; a genuinely loaded empty collection must still PUT.

Status is shared: pending, waiting for registration, retryable error, or last acknowledged
snapshot. Closing a child route cannot erase it. The parent screen exposes concise pending
or error copy and Retry. It never equates subscription synchronization with OS permission
or guaranteed push delivery. Turning the subscription off keeps frequency/horizon values.

Recovery uses startup, foreground, explicit Retry, token availability, relevant input changes,
and a bounded retry schedule while active. No new background service or connectivity library
is required. Failed intent remains durable after the retry budget is exhausted. Reset cancels
timers and transport, invalidates stale completions, and clears environment-bound sync state
through the existing environment-reset participant. No old-environment payload is replayed
to another backend.

### Limited automatic-language refresh — P01, P04, D04

One mounted app-level listener uses the installed expo-localization locale-change API and
the existing resolver. It calls i18next only when preference is system and the resolved
supported language differs. Explicit French/English choices remain authoritative. Existing
languageChanged handling feeds the shared notification sync owner. If a simple listener is
insufficient, retain startup/manual-selection resolution and defer further lifecycle work.
OS app-language synchronization and native locale-setting APIs are outside this design.

## Data and contracts

Preserve existing theme, language, notification preference keys, defaults, and full PUT DTO.
The stored time-zone preference remains system or a named-zone string, with validation
against standard data and runtime support rather than the ten-value union. Add a remembered
manual-zone value: seed from an existing explicit choice, otherwise use the effective device
zone when first leaving automatic mode. Selecting a zone validates before committing it.
Unsupported data must not crash or erase the stored choice; surface a usable fallback and
retain the original value for recovery. Mobile/server support is checked before rollout.

P02 preserves UTC event instants and floating all-day dates. Display and push formatting use
the same effective zone. P03 preserves enum values and the 1..30 numeric range. D05 preserves
all queue schedules, including daily at 19:00 Europe/Paris. UI copy can explain that schedule;
it cannot promise exact arrival or add a user-local delivery time.

## Security and integrity

Search requires neither a network call nor location access. Preference retries use the
existing API and Firebase boundaries. Logs must not include FCM tokens, calendar identifiers,
raw subscription payloads, or user-entered search text. Library versions and licenses are
recorded normally. Sync metadata belongs to the selected backend environment and resets
with existing backend-bound storage.

## Failure handling and operations

Retain existing sanitized error reporting and expose a shared user Retry action. No new
dashboard or telemetry project is required. Serialization prevents normal concurrent
client writes; idempotent PUTs make replay safe but do not enforce ordering at the server.
A transport timeout can leave a server request executing. The design offers eventual repair
on subsequent latest-snapshot replay, not linearizable ordering after ambiguous timeouts.
If strict ordering becomes necessary, revisit D03 for a server revision protocol.

## Rollout and rollback

Use the existing build/runtime compatibility policy. Native dependency or plugin changes
require a compatible native build; do not assume an OTA-only release. Preserve old route URLs
and values. A downgrade to the old ten-zone parser treats new zones as system, so a rollback
should prefer a compatible forward repair; do not rewrite a user's expanded preference to
hide that limitation. Sync metadata is additive and safely ignored by older builds. Revalidate
the approved package against current main before implementation and coordinate changes to
the open mobile-timezone-preference spec instead of leaving contradictory requirements.

## Verification strategy

Automated behavior tests belong with each implementation slice and cover actual transitions:
selection/cancel, custom input, stored-value compatibility, automatic/manual zone toggling,
common-city and translated search, current versus event-date offsets, all-day invariance,
language override protection, dirty-state restart, request coalescing, old acknowledgments,
null tokens, delayed calendar loading, retry, and environment reset. Use controlled promises
and storage recreation for sync tests. Preserve the repository's required type/lint/test gates.

The owner performs on-device visual acceptance. Record that dependency in implementation
acceptance criteria, not a separate ticket. Native control geometry, iOS sheet/search,
Material dialogs, both themes, French/English, large text, screen readers, keyboard, Back,
phone/tablet, and app/device theme mismatch need visual review. Tests do not claim that proof.

## Decision index

- [D01: Native presentation](decisions/D01-native-presentation.md), approved.
- [D02: Library-backed time zones](decisions/D02-timezone-libraries.md), approved.
- [D03: Durable sync](decisions/D03-notification-sync.md), approved.
- [D04: Permission/language boundary](decisions/D04-permission-language-boundaries.md), approved.
- [D05: Scheduling and acceptance ownership](decisions/D05-schedule-and-acceptance.md), approved.

## Open risks

Native integration and large-text behavior are unproven on devices. Common-city data is not
an exhaustive gazetteer. Translated aliases require a bounded imported dataset. Runtime zone
data may lag library releases. Timeout ordering is limited by the existing server protocol.
Permission refusal and Android authorization repair remain a deliberately separate concern.

## Approval

The project owner approved the scoped product and D02–D04 in the 2026-09-21 Codex
conversation with “Approve these choices and continue to roadmap/tickets.” Together with
D01/D05 approvals, this authorizes the design and its decomposition.
