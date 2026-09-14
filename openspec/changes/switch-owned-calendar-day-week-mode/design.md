## Context

T04 leaves the real Calendar route with one committed Monday-first week anchor, a native three-page `PagerView`, one native vertical `ScrollView`, a synchronized pinned date strip, five/seven week columns, revisioned idle settlement, and a screen-owned settled vertical offset. The view selector currently offers only Week and Agenda, stores its choice only in component state, and the transition data/coordinator names and normalizes every page as a seven-day week.

T05 must add one-day presentation without creating another renderer or motion owner. Product P01/P02 and decisions D01/D02 require display-zone civil arithmetic and one atomically committed mode/date/header/accessibility context. The approved product contract persists only the day/week/agenda mode: selected date and clock offset remain fresh-open state. Agenda active-section feedback and full bidirectional transfer belong to T18; initial current-time positioning belongs to T08; complete Today and direct-date intent semantics belong to T17.

## Goals / Non-Goals

**Goals:**

- Render exactly one date in day mode and the accepted five/seven-date complete week in week mode through the same owned shell.
- Page day by one civil date and week by seven civil dates with one accepted idle settlement and three mounted pages.
- Map week to day at the explicit first weekday and day to week at the containing launch week while preserving the settled clock coordinate.
- Persist and total-parse the three-way Calendar view, defaulting absent/corrupt storage to week and preserving it across backend reset.
- Keep header text, native menu state, accessible previous/next labels, date semantics, and one-settlement announcement coherent with the committed mode/date.
- Cancel partial or stale pager work before a mode replacement can publish callbacks from the old geometry.

**Non-Goals:**

- Agenda active-section reporting or the final agenda-to-timeline transfer contract (T18).
- Initial/current-time scrolling or the complete Today/deep-link contract (T08/T17).
- Zoom, resize/orientation completion, events, all-day lanes, event focus retention, selectable dates, month/custom modes, or configurable week start.
- Persisting the selected date or vertical offset, changing stored event facts, or changing API, database, native/store, deployment, workflow, dependency, or legacy Flutter surfaces.

## Decisions

## Decision: Separate persisted view choice from timeline mode

Define a validated `CalendarView` union of `day | week | agenda` in the settings preference boundary and derive a timeline-only `CalendarTimelineMode` of `day | week` for the data/renderer boundary. Add a namespaced string key to both settings and storage inventories, a total parser whose fallback is `week`, imperative get/set functions, and a reactive hook backed by `useParsedStoredString`. The Calendar controller initializes from that synchronous preference and writes every explicit menu choice through the same settings setter.

The storage key is environment-independent: backend/source reset preserves a UI choice that is per installation rather than per account or server. A missing key after install/reinstall and any malformed or future unsupported value resolve to week. Only the mode persists; controller initialization derives the date from a fresh `Date` in the effective display zone and starts the vertical offset at the existing fresh value until T08 replaces that policy.

Alternatives considered:

- Persist the selected date and offset with the mode: rejected because product fresh-open rules explicitly recompute both.
- Keep `CalendarView` in the Calendar UI layer and duplicate a storage union: rejected because parsing, storage and screen values could drift.
- Encode Agenda as a separate boolean or retain in-memory view state: rejected because the product defines one exclusive three-way choice that survives restart.

## Decision: Generalize the transition engine around explicit mode policy

Rename week-only transition concepts to calendar/timeline transition concepts and carry the committed timeline mode with the anchor in one reducer state. Pure policy helpers normalize an anchor and advance it by mode:

- `day`: normalize to the same display-zone civil date and shift by exactly one civil day;
- `week`: normalize to the containing explicit-first-weekday week and shift by seven civil days.

A mode replacement applies the exact table: day to week normalizes the selected day to its containing week; week to day uses the committed week's first date. Replacing with the already committed mode/date is idempotent. Every accepted page or mode replacement increments the generation and revision floor, clears pending work, and keeps monotonic request identities so callbacks captured by old pages cannot relabel the destination. Day stepping never consults `showWeekends`, so Friday advances to Saturday and Sunday to Monday even when week presentation hides weekends.

Keep Agenda outside the renderer mode. Selecting Agenda persists the view and retains the controller's current settled timeline anchor/range exactly as today. Leaving Agenda before T18 uses that retained anchor: week remains its containing week and day uses that retained first date. This is coherent and deterministic without claiming Agenda scroll feedback or new bidirectional date transfer.

Alternatives considered:

- Maintain independent day and week anchors: rejected because switching could reveal an unrelated date and create competing date owners.
- Derive day steps from visible week columns: rejected because hidden weekends would incorrectly disappear from day navigation.
- Remount the controller for each mode and reset its offset: rejected because the required clock-position continuity is mounted timeline state.

## Decision: Reuse one three-page renderer with mode-derived page models

Pass the committed timeline mode through `OwnedCalendarShell` into the existing coordinator. The coordinator builds previous/current/next pages from the mode policy, and each page carries one day column in day mode or the existing five/seven columns in week mode. Header and canvas continue consuming the exact same page records, so the date strip and grid cannot disagree. `showWeekends` changes week page columns only; day always renders its one date, including Saturday/Sunday.

The native `ScrollView`, animated `PagerView`, UI-thread header projection, automatic inset adjustment, center page, offscreen limit, and passive presentation components remain unchanged in ownership. A mode change is a generation replacement: cancel the pending revision, reset selected page and shared progress to center, recenter the pager without animation, retain the committed raw vertical offset, and restore/clamp it through the existing native scroll path. Old `onPageSelected`, idle, accessibility, or settlement closures are rejected by generation/revision identity.

Alternatives considered:

- Add a dedicated day renderer or conditional second pager: rejected because it duplicates gesture, settlement and date ownership.
- Render seven columns and visually hide six in day mode: rejected because hidden layout and semantics would remain week-shaped.
- Recreate the vertical scroll owner on mode change: rejected because native content offset continuity would become timing-dependent.

## Decision: Commit mode, date, chrome and semantics as one screen projection

Both platform menus expose Day, Week and Agenda in the same order and persist the chosen value. The native month/year title continues to derive from the committed anchor. The owned canvas label and header date cells derive from the committed mode/page model; accessible increment/decrement labels become mode-specific (`previous/next day` or `previous/next week`). An accepted horizontal settlement announces the resulting localized day or week once. A mode switch publishes its destination without an intermediate old-column/new-title combination and moves semantics to the new committed date heading, but it does not invent a second settlement announcement.

Within T05's bounded compatibility, Today and `focusDate` retain the selected mode: day normalizes to the target civil date and week to its containing launch week; both invalidate pending movement and preserve the current clock offset. Agenda retains its current behavior and stays available. This prepares the mode-aware reducer for T17 without claiming current-time scroll, animation, focus transfer from events, or Agenda section movement.

Alternatives considered:

- Leave week-labelled accessibility actions in day mode: rejected because controls would announce the wrong unit.
- Update view state before replacing renderer date state in separate effects: rejected because a render could combine a day canvas with a week anchor or accept an old callback.
- Announce both the mode choice and destination date: rejected because the approved contract requires one settled date context, not duplicate speech.

## Decision: Prove the transition matrix and retained ownership at the narrowest boundaries

Pure data tests cover normalization and stepping across month/year/DST boundaries, the complete day/week switch table, repeated replacements, stale/cancelled revisions, and weekend-hidden day stepping. Preference/storage tests cover every valid value, missing/corrupt recovery, reactive updates, restart-shaped module/remount reads, classification coverage, and backend-reset survival. Renderer tests cover one versus five/seven columns, three page records, synchronized header/canvas keys, partial-drag mode replacement, stale callbacks, vertical-offset retention, AppState cancellation, reduced motion, and mode-specific accessibility actions. Screen/menu tests cover both platform menus, persisted initialization/change, fresh-date rules, Today/focusDate coherence, headings, one-settlement announcements, Agenda availability, and retained details/navigation regressions.

Extend the repository contract to require one renderer/scroll/pager, automatic insets, mode-aware civil stepping, typed environment-independent persistence, and the unchanged three-journey inventory. If a safe existing Maestro journey can exercise the view selector without adding a fourth top-level flow or destabilizing its purpose, add the bounded day/week switch there and keep selector-contract tests green; otherwise record the reason and rely on focused host automation plus the mandatory owner checklist. Update Architecture Book current state and create a `(HUMAN: owner device verification)` inbox note tied to the exact revision/build for native drag, restart, accessibility and platform-menu evidence.

## Risks / Trade-offs

- **A mode switch during a held drag can deliver old native callbacks** → Replace the generation atomically, cancel the pending revision, recenter both native/projection state, and assert old-generation callbacks cannot settle.
- **Day mode can accidentally inherit weekend filtering** → Make page stride/columns a mode policy and test Friday/Saturday/Sunday with Show weekends off.
- **Persisted Agenda may imply T18 behavior** → Persist only the view choice and document/test retained current Agenda anchor behavior without active-section feedback claims.
- **Header, title and canvas can briefly describe different dates** → Derive all three from one committed transition state and cover the mode/date render boundary in the screen and renderer suites.
- **Native raw offsets may clamp differently after one-column geometry replaces week geometry** → Keep the same full-day vertical content height and scroll owner, restore through the existing native path, and require device proof of the visible clock coordinate.
- **Adding mode switching to a long Maestro journey may reduce smoke reliability** → Reuse only an existing deterministic interaction seam; do not add a fourth journey, retries, or weaker assertions.
- **T05 can absorb T08, T17 or T18** → Keep initial offset, complete direct-intent animation/focus, and Agenda active-date feedback explicitly out of scope and name those successor tickets in code/docs where necessary.

## Migration Plan

1. Add the total preference/storage contract and tests before the controller consumes it; existing installations with no key resolve to week.
2. Generalize pure transition state and page policy with exhaustive tests, then pass the mode through the single renderer.
3. Wire atomic screen/menu/header/accessibility behavior and focused regressions, then update repository contracts and current-state documentation.
4. Run the scoped local-green commands and create the revision-bound owner-device note. Rollback is a normal code revert: the new string key can remain unread without affecting earlier versions, and no data migration or destructive transform is required.

## Open Questions

None. T05 behavior is fixed by the approved product contract; device-only presentation tuning belongs to the ticket's owner feedback loop rather than an architectural decision.
