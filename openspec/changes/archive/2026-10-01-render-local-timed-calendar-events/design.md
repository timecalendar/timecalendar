## Context

T08 leaves the real Calendar route with one full-day native `ScrollView`, one three-page `PagerView`, a shared zoom scale, a current-time presentation, and revisioned day/week settlement. `CalendarScreen` already calls `useCalendarEvents(range)`, but only Agenda consumes the returned array; `OwnedCalendarShell` receives no events and the entire pager is hidden from assistive technology.

The current read path is not suitable for the populated timeline:

1. `useSyncedEvents`, `usePersonalEvents`, and `useUserCalendars` each read a whole table. `useCalendarEvents` maps every row and only then performs visibility, hidden-state, and range filters in JavaScript.
2. `rowToCalendarEvent` admits invalid `Date` values and casts JSON arrays without validating their elements. A stored tag such as `null` reaches `tags.map(tag => tag.name)` and can throw the whole read. Cancelled events are decoded but not filtered.
3. `CalendarEvent` combines `Date` endpoints with an `allDay` boolean and exposes no original-source identity or schema version. It cannot make illegal timed/date-only combinations unrepresentable, and renderer page slots would be easy to mistake for event identity.
4. The existing overlap and time-grid primitives are reusable, but T09 deliberately proves one ordinary same-day tile. Short-event rescue, overlap packing, cross-midnight segmentation, DST geometry, and all-day presentation belong to later tickets.

The approved project design requires validated projections at the local read boundary, separate timed/date-only interval semantics, bounded three-page reads, complete page models, original-identity activation, one chronological accessible representation, and privacy-safe diagnostics. Stored rows and sync writes remain verbatim; this proposal changes only local reads and presentation.

## Goals / Non-Goals

**Goals:**

- Query only the local instant/date ranges needed for the settled page and its immediate neighbours, reactively and without a network call.
- Turn every row into either a validated timed interval or a validated date-only interval, rejecting one bad row without losing valid siblings.
- Publish immutable schema-versioned event and page models that carry original identity, display-date ownership, formatted-label inputs, and one settled renderer generation.
- Present positive-duration same-day timed events at their actual clock position with title, optional location, checklist progress, one complete accessibility label, and stable activation.
- Preserve synced read-only details and personal editability through the existing unified details route.
- Keep database work, decoding, sorting, formatting, checklist aggregation, and tile planning off gesture frames; only pixel projection follows the live UI-thread zoom scale.
- Record aggregate-only invalid-row diagnostics and exact range/retention measurements from fabricated data.

**Non-Goals:**

- Changing the SQLite schema, migrations, sync payload, generated API, stored event representation, or event-details ownership.
- Making zero-duration markers, short events, overlaps, cross-midnight segments, DST transitions, or all-day ranges launch-ready; T10–T16 own those cases.
- Building a compatibility/fallback renderer, unbounded cache, full-event JavaScript index, or arbitrary event-result cap.
- Completing dense chronological navigation, custom focus restoration, or visual-renderer failure recovery; T12 and T22 own those outcomes.
- Starting sync, fetching from the server, or showing a network loader because the user pages locally.

## Decisions

## Decision: Query a single bounded three-page envelope through owned local repositories

A new pure range planner derives the previous/current/next page identities from the committed `anchor`, `mode`, `displayZone`, `firstWeekday`, and `showWeekends`. It publishes:

- an instant half-open envelope `[from, to)` covering the three complete day/week page strides;
- a floating civil-date half-open envelope `[fromDayKey, toDayKey)` for UTC-encoded date-only rows; and
- the three ordered page/column identities already used by the header and clock canvas.

The synced repository issues separate reactive SQLite queries for timed intersections (`all_day = false`, `starts_at < to`, `ends_at > from`) and date-only intersections (`all_day = true` against UTC midnight strings derived from the civil keys). The personal repository issues the timed intersection query only. Required `and`, `gt`, or `or` operators are narrowly re-exported from `@/db`; feature code never imports Drizzle directly. Visible-source membership is applied from the reactive user-calendar set, while hidden/cancelled filtering stays at the shared calendar data seam because hidden names and cancellation live outside indexable scalar columns.

Changing the anchor after a page settlement replaces the envelope and releases the preceding query result. There are always exactly three presentation pages and no more than the currently resolving replacement generation. No query uses `LIMIT`: dense valid content cannot be silently truncated. T09 measures row counts and elapsed local preparation with fabricated ordinary data, but does not invent p50/p95 workload claims or add an index without query-plan evidence.

Home and Agenda keep the same public `useCalendarEvents(range)` behavior, but that hook delegates to the new range-scoped repositories and validated projection instead of whole-table hooks. The timeline consumes `useCalendarTimelinePresentation(...)`, which uses the same boundary and supplies its three-page envelope. Event details continue their by-UID reads and do not depend on the lossy presentation model.

Alternatives considered: retaining whole-table reads would violate D05 and make page count irrelevant to memory; putting SQL in the screen or renderer would break the feature seam; one query per page multiplies listeners and can publish mismatched neighbours; a permanent in-memory index makes cold start and memory scale with the whole local store; an arbitrary cap silently loses classes.

## Decision: Decode into a total tagged domain before filtering or formatting

`calendar/data` introduces a schema-versioned discriminated union:

- `TimedCalendarEventV1`: `kind: "timed"`, stable `{ source: "synced" | "personal", uid }`, valid finite `startsAt < endsAt`, presentation fields, and source/calendar metadata.
- `DateOnlyCalendarEventV1`: `kind: "date-only"`, the same stable identity, validated `startDay`/exclusive `endDay` civil keys, and presentation fields.

Stored `allDay` chooses the tag; midnight or duration never infers it. Synced date-only UTC fields decode to civil day keys at this boundary. Each scalar and JSON element is narrowed before it is read: dates must parse, colors use the existing safe appearance fallback, optional strings omit unusable values, teachers/tags admit only valid strings/objects, and cancellation must be exactly `true`. Personal rows use the same timed validator instead of assuming mapper output is valid.

The decoder returns `{ accepted, rejectedCounts }` and never throws for row content. Rejection reasons are a closed allowlist such as `invalid-start`, `invalid-end`, `non-positive-range`, `invalid-date-range`, and `invalid-identity`; they carry counts only. A snapshot with non-zero counts emits at most one content-free diagnostic per reason/revision through `@/firebase`, with no raw exception, row, UID, title, location, date, source URL, query value, or user-calendar identity. Hidden, invisible-source, and cancelled events are removed before page models, checklist UID collection, or semantic nodes are built.

T09's timeline projection accepts only `kind: "timed"`, positive duration, one display-zone civil date, and no offset transition between its endpoints. Valid date-only, cross-midnight, zero-duration, and DST-transition events remain tagged data but are intentionally absent from this slice's page models for T13–T15 or the instant-marker work. Home and Agenda migrate to the tagged helpers without losing their current behavior; their established all-day/date grouping remains covered while any intentionally deferred shape is explicit rather than accidental.

Alternatives considered: widening the existing interface while retaining `allDay: boolean` preserves illegal combinations; validating after `tags.map` is too late; catching the whole-array map loses valid rows; rewriting stored rows expands importer/sync risk; treating midnight as all-day corrupts ordinary timed classes.

## Decision: Build one immutable V1 page presentation before it reaches the renderer

`useCalendarTimelinePresentation` combines the settled range plan, accepted local events, visible/hidden state, and checklist progress into a complete immutable model:

```
CalendarTimelinePresentationV1 {
  version: 1
  generation: number
  pages: CalendarTimelinePageV1[3]
}

CalendarTimelinePageV1 {
  version: 1
  direction: -1 | 0 | 1
  key: DayKey
  columns: CalendarTimelineColumnV1[]
}
```

Each column owns chronologically sorted `TimedTileV1` records containing original identity, start/end minute inputs, title/location/color, full time-label input, and checklist summary. Sort order is start instant, end instant, then stable source/UID. Page and column construction happens on the JavaScript thread only when the settled generation or local snapshot changes. The renderer receives this complete model instead of rebuilding dates in its coordinator or importing event data.

Page identities and generation follow the committed anchor synchronously with pager recentering. Until every query needed for a replacement has resolved, the hook projects the last complete event snapshot onto the requested three-page range using each event's actual date. Already-loaded adjacent pages retain their tiles; dates outside the retained snapshot remain empty until the read completes. Replacement event data fills the same page identities without reordering the native pager. Stale query completions are discarded. Within T09, data-driven visibility/removal publishes the next complete model immediately; the broader atomic environment/update protocol remains T19/T20.

Alternatives considered: passing a flat event array leaves page/date assignment and identity rules inside presentation; rebuilding columns independently in the header and canvas permits drift; mutating page objects on live-query completion defeats revision reasoning; deriving tile data on worklet frames would move database/domain work onto gesture frames.

## Decision: Render static tile semantics with live-scale pixel projection

The renderer facade receives `presentation` and `onEventPress(identity)`. `owned-calendar-canvas` maps each page's planned columns and tiles to feature-private `Pressable` tiles. Tile position uses a small worklet-safe animated style over prevalidated `startMinute`/`endMinute` and the live `pixelsPerHour`, so pinch changes top/height without re-sorting, reformatting, reading SQLite, or writing React state per frame. T09 uses full column width and deterministic source/UID z-order; T11 replaces that horizontal layout with overlap columns. Natural clipping is accepted for unusually short events until T10 adds its readable short-event policy.

The tile shows title and location when present, reuses/extracts the safe event surface-color helper rather than importing Home UI, and shows the existing checklist progress primitive. Press activation sends the tile's original UID through `eventRoute`; recycled page keys and array indexes never become route identity. The screen remains the navigation owner.

The pager is no longer blanket-hidden. Decorative clock/grid nodes remain hidden, neighbour pages remain accessibility-hidden, and only the committed centre page exposes its tiles. Tiles are sorted chronologically in the model, are mounted even when vertically off viewport, and expose one button node each. Child text/progress visuals are excluded from the accessibility tree; the button label composes the full localized title, time range, optional room, and checklist phrase exactly once, with the existing localized view-details hint and platform target size. T12 will prove complete traversal under dense/overlapping conditions; T09 proves the ordinary tile is reachable and hidden/cancelled rows create no visual or semantic target.

Alternatives considered: making the whole pager accessible duplicates neighbour pages; an invisible second semantic button tree creates duplicate/hit-geometry failures under D06; navigating from the renderer imports routing into the wrong layer; freezing tile pixel geometry at the settled scale would make pinch detach events from grid lines.

## Decision: Keep dense visual labels separate from unambiguous semantics

The pinned date header uses the locale's narrow weekday glyph visually and a larger date number, while its accessible cell keeps the existing localized short weekday/date label so repeated one-letter glyphs remain unambiguous. Ordinary date text uses the secondary text token in dark appearance; Today uses a primary weekday glyph and a fixed square, fully circular primary fill whose number uses the screen background token. The circle is a non-color shape cue and remains independent of the number of visible columns.

The full 00:00–24:00 geometry and midnight major boundary remain intact, but the gutter omits the visually clipped 00:00 label and renders 01:00–23:00 with compact secondary typography. Vertical column dividers and major horizontal lines use the same separator token; half-hour lines use that token at reduced opacity. The visible current-time gutter chip is removed because the in-column cap and rule already provide the visual cue. On the committed page that rule carries the one localized current-time accessibility label; neighbour-page indicators and decorative grid nodes remain hidden.

Alternatives considered: truncating the existing short weekday formatter would not produce correct locale-specific narrow forms; removing midnight geometry would change scrolling and tile coordinates; dropping current-time semantics with the visual chip would make the cue unavailable to assistive technology.

## Decision: Preserve details authority and prove local-only navigation

Activation always routes the original UID to the existing unified event-details screen. The details read remains authoritative: synced events resolve with `kind: "synced"` and keep hide/unhide but no edit action; personal events resolve with `kind: "personal"` and keep the Edit action. The presentation model never carries rich descriptions/tags or editability decisions.

Focused screen tests settle adjacent pages, activate synced and personal tiles, and assert the exact routes while the sync function and generated network seam remain untouched. Repository-contract tests assert that renderer/data page navigation imports no generated client or fetch mutator and that a page settle only changes local range queries/presentation. Offline owner QA then confirms there is no loader and the event remains on the correct date after swiping away and back.

Alternatives considered: capturing a rich row in the tile can go stale and duplicates details ownership; routing by page/segment identity breaks original activation; refreshing on every page settle violates the offline contract and turns navigation into a network operation.

## Decision: Reconcile current documentation without a new ADR

The implementation follows approved D01, D02, D05, D06 and Architecture Book ADR 033. It does not displace any indexed decision, so no new ADR is planned. `calendar.md`, `data.md`, `storage.md`, and `testing.md` become current-state guidance for the validated bounded local read, V1 presentation model, ordinary timed tile/accessibility contract, and focused proof. `CHANGELOG.md` records the reusable rule change. The canonical T09 execution-evidence section records only results actually produced and retains the complete owner checklist against the exact tested head/build.

If implementation evidence requires a schema/index migration, alternate semantic tree, or a different renderer/data ownership boundary, the Applier stops and returns the issue to the Founding Engineer for an approved design update rather than silently expanding this change.

## Risks / Trade-offs

- [Several reactive inputs can resolve at different times] → key them to one requested range/generation, project the last complete event snapshot onto the requested pages, and discard stale completions; focused tests force out-of-order completion.
- [SQLite text range predicates depend on canonical timestamps] → writers already canonicalize ISO UTC text; row validation still rejects corrupt values after the bounded query, and fabricated query tests cover exact half-open boundaries.
- [Date-only rows use floating civil semantics while storage uses UTC fields] → plan a separate day-key envelope and decoder; do not reuse display-zone instant predicates for all-day rows.
- [An offset transition can make endpoint minute geometry misleading] → tag the event but exclude offset-changing intervals from T09 tiles; T14 owns faithful DST pieces.
- [Full-width tiles overlap before T11] → deterministic ordering preserves stable output, but no overlap-readability claim is made in this slice.
- [Short positive events can clip text before T10] → keep actual-time geometry and activation semantics; T10 adds the minimum readable presentation without changing identity or reads.
- [Removing the pager-wide accessibility hide can expose decorative duplicates] → keep grid/header/neighbour exclusions explicit and test the exact committed accessibility tree.
- [Malformed-row diagnostics could leak or spam] → emit allowlisted reason/count pairs once per snapshot revision only; tests reject raw values and repeated reporting.
- [The host cannot prove native screen-reader quality or offline device feel] → report deterministic host proof only and leave every device-only checklist row pending until the owner records a verdict.

## Migration Plan

1. Add pure range planning, tagged row decoding, same-day support classification, page-model construction, and exhaustive boundary/property tests.
2. Add range-scoped synced/personal reactive repositories and narrow `@/db` operator exports; migrate `useCalendarEvents` and its Home/Agenda consumers without changing stored rows or writes.
3. Add the V1 timeline presentation hook and stale-generation/retention tests, then wire `CalendarScreen` and checklist progress to the three-page model.
4. Extend the renderer facade/canvas with live-scale tiles, accessible committed-page semantics, and identity activation; keep native pager/scroll/zoom owners unchanged.
5. Extend details, Home, Agenda, screen, renderer, repository-contract, i18n, and no-network-navigation proof; update current Architecture Book guidance and canonical T09 evidence.
6. Run every edited suite, pure logic coverage, full mobile coverage, TypeScript, lint, scoped Prettier, React Doctor, OpenSpec strict validation, and the CI proof named in `tasks.md`; bind the complete owner checklist to the exact head/build and pause before Reviewer merge.

Rollback removes the presentation/read additions and returns to the accepted T08 empty timeline. No persisted row or migration changes, so existing Agenda/Home/details data remains readable across rollback.

## Open Questions

None. If query-plan measurements show the existing schema cannot meet the ordinary fabricated range without an index, that is a surfaced sensitive-surface expansion requiring a separately reviewed migration decision, not an assumption in this proposal.
