## Context

The Flutter app computed one `Map<eventUid, completed/total>` from the checklist store and reused it on Home cards, calendar rectangles, and planning rows. Its dense calendar treatment was only a colored dot, while roomier surfaces showed `completed/total`; the useful semantics are zero-item hiding, a distinct complete state, and one shared event-UID projection. React Native already owns checklist CRUD in `features/event-checklists`, but each event summary currently receives only `CalendarEvent` data and none subscribes to checklist changes.

The React Native `@/db` seam provides a coalesced `useLiveQuery` over one observed table. Home renders today's merged synced/personal events. Calendar renders either a buffered CalendarKit event collection or a seven-day Agenda collection. CalendarKit memoizes its vendor event projection from the `events` prop; checklist state must not be folded into `CalendarEvent` or into that projection because doing so would rebuild the vendor collection on every checklist mutation.

Constraints are: one set-oriented SQLite subscription per mounted summary screen, identical UID behavior for synced and personal events, no `deletedAt` filtering, no schema/API/native changes, compact output for dense tiles, EN/FR accessibility, and no device execution on this host.

## Goals / Non-Goals

**Goals:**

- Return reactive completed/total progress for a rendered set of event UIDs through one checklist-table live query.
- Render zero, partial, and complete states consistently across every named Home, Calendar, and Agenda summary.
- Keep progress meaningful with Dynamic Type, screen readers, dark/light themes, overlaps, and the smallest supported tiles.
- Preserve the identity and memoization boundary of the CalendarKit event collection.
- Prove storage semantics, reactive updates, presentation variants, accessibility composition, and the existing real-CRUD return journey.

**Non-Goals:**

- Changing checklist editing, including the controlled-input work in TIM-268 / PR #293.
- Changing the checklist schema, delete behavior, import format, server/API contract, or adding an index without measured evidence.
- Editing legacy Flutter, adding a native dependency, changing store/EAS/Firebase configuration, or changing CI workflows.
- Adding a human QA or merge gate; device-only observations remain a non-blocking inbox record.

## Decisions

## Decision 1: One feature-owned, UID-set live projection per summary screen

Add `ChecklistProgress` (`completed`, `total`, and a derived complete condition) plus a hook such as `useChecklistProgress(eventUids)` under `features/event-checklists/data/`. The hook normalizes the input to unique, sorted, non-empty UIDs so duplicate Home/Calendar representations do not expand the read and equivalent sets produce a stable dependency key.

The hook builds one `db.select({ eventUid, isChecked }).from(checklistItems)` query scoped with `inArray(checklistItems.eventUid, normalizedUids)`. An empty UID set uses an always-false SQL predicate so the hook remains unconditional and returns an empty map without inventing a sentinel UID. `@/db` narrowly re-exports only the extra Drizzle operators needed by this query. The returned rows are reduced into a read-only UID-keyed map in the feature data layer.

The query intentionally has no `deletedAt` predicate. Imported rows with non-null `deletedAt` count exactly like Flutter's `findEventNumberOfNotes`; hard-deleted rows are absent. Selecting the two needed columns bounds transfer to checklist rows for the rendered set. Each Home or Calendar screen calls the hook once, never once per event/component.

Alternatives rejected:

- One `useChecklist(uid)` per card/tile: creates an unbounded subscription/query pattern and duplicates reads when an event appears on multiple Home surfaces.
- Reading the entire checklist table then filtering in JavaScript: currently feasible, but discards the visible-set bound requested by the performance contract.
- Persisting denormalized counts: introduces mutation consistency and migration risk for data that SQLite can derive reactively.

## Decision 2: Progress is sidecar presentation state, not part of CalendarEvent

Home obtains progress for `todayEvents` once and passes the map through `TodaySection`, `UpcomingSection`, `UpcomingScroller`, and `TodayTimeline`. Calendar obtains progress for the range's `events` once and passes it to `AgendaList` or through the renderer-neutral `CalendarTimelineProps` facade.

The CalendarKit adapter keeps `eventItems = useMemo(() => events.map(toCalendarKitEvent), [events])` unchanged. The progress map is passed separately to `CalendarKitEventTile` and `CalendarKitAllDayTile` through render closures. Checklist changes therefore update tile content while the vendor `events` array and each projected event identity remain stable. A focused test records this invariant.

Alternatives rejected:

- Adding progress to `CalendarEvent` or `toCalendarKitEvent`: couples device-local checklist state to the unified event-source domain and forces projection churn on every mutation.
- Letting individual renderer tiles call the data hook: violates both renderer ownership and the single-query constraint.

## Decision 3: One shared indicator with roomy and dense variants

Add a feature-owned presentational `ChecklistProgressIndicator` used by Home, CalendarKit, and Agenda. It accepts a nonzero `ChecklistProgress` and a `variant` (`inline` for cards/rows/reflow layouts, `compact` for timed/all-day calendar tiles). Callers omit it entirely for `total === 0`.

Both variants display the localized-neutral numeric form `completed/total`. Partial progress uses a checklist-shaped icon; complete progress uses an explicit checked icon/shape. The complete distinction is encoded by glyph/shape plus the same count, with color only supplementary. Inline output participates in normal layout and Dynamic Type; compact output clamps to the tile, uses the smallest existing typography/token spacing, and prioritizes the icon/count over title/location when geometry is too narrow. It never falls back to a dot-only signal.

The visual indicator is hidden from the accessibility tree because each tappable/text summary composes a localized sentence such as “2 of 3 checklist items completed” into its existing label. This prevents duplicate announcements. A small helper in the feature UI/data boundary can return the optional translated phrase, or callers can pass the phrase to their existing label templates; EN/FR key parity remains typechecked.

Alternatives rejected:

- Recreating Flutter's colored dot on dense tiles: fails non-color and screen-reader requirements.
- Bespoke markup per surface: invites semantic drift and makes complete/partial behavior inconsistent.

## Decision 4: Tests prove query count, reactivity, surface coverage, and identity

Data tests use the existing `@/db` mock/fake patterns to assert one `useLiveQuery` for the whole UID set, UID de-duplication, query scoping, aggregation of zero/partial/complete states, inclusion of non-null `deletedAt` rows, and update outcomes for add, check/uncheck, reorder, and delete. Reorder must trigger a refresh but preserve counts.

Component tests exercise synced and personal UIDs on Home upcoming, today all-day, timed normal, and Dynamic Type reflow layouts; Calendar day/week timed and all-day tiles; and Agenda rows. They assert zero hiding, partial/complete content, compact small-tile behavior, and composed accessible labels. Calendar renderer tests additionally prove that changing only the progress map does not recreate the projected event collection.

The existing `mobile/.maestro/event-checklists.yaml` keeps its add/toggle/delete assertions and, before cleanup, returns through the existing stack to a summary surface and observes the created/toggled progress. The host cannot run a simulator, so syntax/static checks and Jest are local; definitive native execution remains the ordinary path-triggered post-merge main workflow. A `(HUMAN: …)` inbox note records light/dark, Dynamic Type, VoiceOver/TalkBack, dense-week, and smallest-tile observations without blocking merge or adding the normally-unused `run-e2e` label.

## Risks / Trade-offs

- [A large buffered calendar range yields a large `IN` list] → Normalize/dedupe UIDs, select only two columns, cover dense fixtures, and add an index only in a later measured change if evidence shows the existing table scan is material.
- [CalendarKit may cache render output more aggressively than expected] → Add a focused rerender test around the owned adapter and verify on native CI/device while preserving the vendor event-array identity invariant.
- [Compact content can crowd very short or narrow tiles] → Give the compact indicator layout priority, clamp text, test minimum geometry, and preserve the full state in the tile's accessible label even where visual detail is constrained.
- [TIM-268 lands concurrently in the checklist editor] → Keep this change out of `event-checklist.tsx`; after PR #293 lands, rebase and run focused checklist tests to prove compatibility.
- [A content edit also invalidates the checklist-table subscription although counts do not change] → Accept the coalesced bounded reread; denormalized invalidation would add complexity beyond the measured need.

## Migration Plan

This is an additive presentation/read change with no persistent migration. Implement the aggregate seam and shared indicator, thread the sidecar map through Home and Calendar/Agenda, extend tests/Maestro/docs, and run focused checks plus `ci-mobile`. Rollback is a code revert: existing checklist rows and CRUD remain untouched.

## Open Questions

None. If implementation evidence requires a new index, renderer identity change, or Architecture Book rule change, stop and return that expansion to the Founding Engineer before proceeding; it is outside this proposal's approved surface.
