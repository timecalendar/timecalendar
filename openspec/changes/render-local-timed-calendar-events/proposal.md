## Why

The owned Day/Week timeline still renders an empty grid even though synced and personal events are available locally and remain readable in Agenda. Students cannot see an ordinary class at its scheduled time or open its existing details from the primary Calendar surface, and the current whole-table decode can let one malformed row throw before filtering.

## What Changes

- **BREAKING (internal):** replace the permissive `CalendarEvent`/whole-table rendering seam with bounded reactive local reads and a tagged V1 domain for the timeline's settled page plus immediate neighbours, while retaining the bounded Agenda/Home behavior and making page/query completion generation-aware.
- Decode stored synced and personal rows through a total, validated boundary that produces explicit timed or date-only domain tags without changing the SQLite or wire representation; this slice presents only positive-duration timed events contained in one display-zone civil date.
- Filter invisible-source, hidden, and cancelled rows before either visual or semantic presentation, isolate malformed rows with privacy-safe aggregate reason codes, and publish complete immutable versioned page/event models rather than partially relabeling retained data.
- Render one normal timed tile at its actual clock position with title, location, checklist progress, and one composed localized accessibility label; activate it by stable original event identity through the existing unified details route.
- Preserve synced read-only details and personal-event editing, keep event decoding/layout off gesture frames, retain exactly three timeline pages, and make page navigation entirely local with no sync or network dependency.
- Add deterministic query, decoder, filtering, page-model, geometry, activation, accessibility, and no-network-navigation proof plus the complete revision-bound owner QA gate.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-calendar-timeline`: T09 supplies bounded, versioned populated page models and renders/activates ordinary same-day positive-duration timed tiles without changing native gesture ownership.
- `mobile-calendar-sync`: local event reads become range-scoped, row-isolated, validated, cancellation/visibility/hidden-aware projections while stored rows and sync writes remain unchanged.
- `mobile-event-details`: owned timeline activation routes the original synced or personal identity into the existing unified read-only/editable details behavior.
- `mobile-event-checklists`: Calendar timed tiles join Home and Agenda in showing and announcing summary checklist progress from one scoped UID-set read.
- `mobile-architecture-book`: current-state Calendar, storage/data, and testing guidance records the validated bounded local-read and timed-tile contracts and removes the empty-timeline limitation.

## Impact

- Affects the calendar domain/read seam under `mobile/src/features/calendar/data/`, synced and personal reactive repositories, the Calendar controller/screen, the owned renderer facade/coordinator/canvas, event accessibility/appearance helpers, checklist progress wiring, EN/FR resources, focused tests, and current Architecture Book Calendar/data/storage/testing pages plus `CHANGELOG.md`.
- The `CalendarEvent` consumer contract becomes a complete discriminated/versioned rendering model rather than a permissive row-shaped object, so Home, Agenda, details-related routing tests, fixtures, and other data consumers must migrate coherently in this change.
- Touches no repository-sensitive surface: no OpenAPI or generated client, no database schema or migration, no native/store/EAS/Firebase configuration, no deploy/CI or infrastructure files, and no legacy Flutter code.
- Adds no dependency, server request, compatibility renderer, overlap packing, instant marker, spanning/DST/all-day presentation, arbitrary event cap, or storage/wire rewrite. T10–T16 retain those explicit later cases.
- Changes no approved architectural boundary and therefore requires no new ADR unless implementation evidence forces a different data/renderer ownership decision.
