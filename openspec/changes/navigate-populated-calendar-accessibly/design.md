## Context

T09 mounts the complete committed page and gives ordinary tiles one localized button; T10 separates duration-faithful visuals from minimum interaction geometry; T11 lays out overlaps and replaces intersecting effective targets with one chooser trigger. The current source order is date column then chronologically sorted tile, adjacent pager pages are hidden, `removeClippedSubviews` is false, and accepted page changes already announce settled date context once. There is no identity focus registry or native proof that 01:00 and 23:00 nodes remain reachable from the initial viewport.

The low-confidence inspection found no Android or iOS native tooling on the proposal host. It also found the deliberate T11 semantic gap: a dense conflict exposes a chooser trigger rather than each involved event in the committed event traversal. Host component tests cannot establish whether a visual-target tree with overlapping effective frames behaves correctly under VoiceOver, TalkBack, Voice Control, or switch scanning. D06 therefore requires a real-device probe before the implementation expands beyond the smallest target arrangement.

## Goals / Non-Goals

**Goals:**

- Expose every supported timed event on the committed Day/Week page once, ordered by civil date, start, end, source, and UID.
- Keep the semantic node as the event's visible target, with complete labels and bounded off-viewport reachability independent of zoom.
- Preserve event identity focus through details, paging, and mode changes, with a relevant date-heading fallback and one settled context announcement.
- Retain accessible page and zoom alternatives and prove screen-reader, voice, switch, large-text, dense, and offscreen behavior on actual iOS and Android paths.
- Stop cleanly at the D06 boundary if the first native target tree fails.

**Non-Goals:**

- A hidden mirror tree, accessibility-only Agenda destination, experimental focus-order API, unbounded semantic cache, or second renderer/scroll/pager owner.
- All-day, spanning, DST, removed-event, failure-fallback, final workload, or product-wide accessibility acceptance.
- API/generated contract, database schema, native/store configuration, dependency, deploy/CI, or legacy Flutter changes.

## Decisions

## Decision: Gate all feature expansion on the existing visual-target tree

The Applier first adds a deterministic development fixture containing 01:00, 10:00, and 23:00 events plus the accepted overlap/tiny-target cases, then exposes the smallest real-route semantic arrangement on the existing current-page tiles. The probe records native traversal order, automatic offscreen scrolling/reachability, focused-node frames, labelled voice activation, switch activation, and exact routed UID on available iOS and Android paths.

The pass condition is strict: every event is encountered once in model order; both vertical extremes are reachable; each activation opens the intended visible tile; and no hidden, adjacent-page, child-text, conflict-overlay, or duplicate node enters traversal. If either platform demonstrates that the visual-target tree cannot meet bounded reachability or meaningful activation geometry, the Applier stops before implementing focus restoration or broader tests, records the exact failure, and returns the issue for a scoped D06 revision. The alternate same-screen semantic layer is not authorized by this change.

Alternatives considered: trusting React Native host output cannot prove native semantic behavior; completing code before the probe risks building on a failed D06 premise; adding a semantic mirror pre-emptively violates the approved stop condition.

## Decision: Publish one pure chronological accessibility projection

The data layer derives an immutable `CalendarAccessibilityEntryV1` projection only from the committed validated page. It flattens date columns and tiles by display-zone civil date, start instant, end instant, source, and UID using the existing ordinal identity rules. Each entry carries the original identity, date key, complete label inputs, and prepared visual/interaction geometry reference. The projection rejects duplicate identities and contains no React refs, localized strings, scroll offsets, viewport visibility, or pager-slot identity.

The renderer consumes that order as the source order of the same event targets that draw the tiles. Zoom changes only pixel projection; it cannot reorder, recreate identity, or change label content. Neighbour pages remain excluded. The current page remains bounded by the approved three-page local range and committed-page event payload; the renderer retains no session-length semantic history and applies no cap that omits valid events.

Alternatives considered: relying on nested visual mount order couples semantics to later culling/refactors; localized sorting is unstable; a permanent full-event index violates D05; experimental explicit-order properties are excluded by D06.

## Decision: Keep one semantic event node while retaining explicit touch disambiguation

Each tile owns one native event button containing the full localized title, time range, optional location, and checklist progress. Its child visuals remain inaccessible. For a multi-event T11 target-conflict component, the visible tile buttons remain the only semantic nodes and assistive activation routes the focused identity directly. One absolutely positioned chooser overlay continues to disambiguate pointer taps over the component union but is excluded from the accessibility tree; opening it presents the existing focus-contained modal choices for pointer users. A single-event component keeps its direct pointer and semantic activation.

This arrangement changes T11's committed-page semantic behavior but not its visual packing, minimum target geometry, chooser ordering, or original-identity routing. It is allowed only after the native gate proves Voice/Switch selection and target frames remain meaningful. If the overlay suppresses, duplicates, or misroutes a native event node, the gate fails rather than being patched with invisible buttons.

Alternatives considered: one semantic conflict trigger cannot provide full chronological event traversal; competing pointer targets are ambiguous; shrinking nodes below platform minimums weakens T10; a second offscreen list is the D06 alternative and needs a decision update.

## Decision: Restore focus only after an accepted committed revision

The screen/renderer boundary keeps a small identity focus coordinator. Event targets register native refs by stable source/UID and report native focus/activation identity. On details departure, page/mode request, and presentation replacement, the coordinator remembers the last focused identity and its date. After the matching transition revision and complete presentation settle, it requests native focus exactly once: first to the surviving identity, otherwise to that identity's relevant date heading, and finally to the committed page heading when the date is no longer present.

Stale revisions, neighbour pages, intermediate gestures, zoom frames, and incomplete replacement presentations cannot move focus. A restored target is scrolled into the bounded vertical viewport before native focus is requested. Returning from details uses the same coordinator rather than route-specific timing. The existing accepted-context announcement remains revision-deduplicated and focus restoration adds no second spoken context.

Alternatives considered: array index and pager slot do not survive replacement; immediate focus races the native layout; title focus discards surviving identity; announcing from both renderer and screen duplicates settled context.

## Decision: Verify structure automatically and behavior on exact native builds

Pure tests prove total ordering, duplicate rejection, zoom independence, page exclusion, conflict expansion, and identity fallback. Renderer/screen tests prove one node per retained identity, full labels, non-semantic chooser overlays, exact UID activation, ref cleanup, settle-gated focus, offscreen scroll-before-focus, logical date/page fallback, and one announcement. Repository contract tests continue to assert one vertical owner, one pager, three pages, and no alternate or hidden semantic renderer.

The checked-in probe script and fabricated fixture name preparation/reset steps and every canonical checklist row. Evidence records the exact commit/PR head, build identity, platform/device, tool, traversal and activation result, and command output. Missing platform evidence is Applier rework; prior-epic device notes and host tests cannot be inferred as a pass. No additional top-level Maestro journey is required unless the existing journey can gain stable selectors without pretending to exercise native assistive technology. The binding Architecture Book remains read-only for this slice; conformance is recorded as N/A for documentation changes, and any required rule change stops for an ADR.

Alternatives considered: snapshots do not prove native order/geometry; coordinate-heavy automation is brittle and cannot replace manual assistive operation; evidence from another head is invalid after relevant edits.

## Risks / Trade-offs

- [The native parent `ScrollView` may group or suppress descendant event nodes] → make descendant traversal the first probe case and stop for D06 revision on either platform failure.
- [A non-semantic conflict overlay may still obscure voice or switch activation] → record target frames and exact-UID activation for the overlap fixture; do not ship a platform-specific guess.
- [Programmatic focus can race scrolling or presentation replacement] → bind requests to accepted revisions and layout registration, scroll first, and discard stale requests.
- [A dense committed week can contain many semantic nodes] → retain only the current bounded page, measure exact fixture node counts, and leave representative ceilings to T24/T27 without omitting events.
- [Largest text can obscure tile content] → keep complete semantic labels independent of visual clipping and verify focus/activation geometry at the largest supported setting.
- [Architecture guidance is binding] → update it only for the proven implemented current state; any new rule or alternate tree requires an ADR and explicit review.

## Migration Plan

1. Add the pure chronological projection, deterministic fixtures, and smallest existing-tree semantic wiring needed for the real-route probe.
2. Run the native probe before expanding the feature. On failure, commit the diagnostic evidence, stop this change, and request D06 revision; do not implement the remaining steps.
3. On a passing probe, complete conflict semantics, identity focus coordination, offscreen scroll/focus, translations, and deterministic coverage.
4. Confirm Architecture Book conformance without editing its read-only scope, run the canonical local checks and CI proof, then repeat the complete native checklist on the exact final head/build.

Rollback is a source revert to the accepted T11 behavior. There is no persisted-data, API, schema, or native-configuration migration.

## Open Questions

- The exact supported device/OS instances are resolved when native evidence is recorded; absence on the current host is not acceptance or a reason to weaken the gate.
- Whether the visual-target strategy passes the dense Voice Control and switch geometry cases is intentionally unresolved until the first native probe. A failure belongs in a scoped D06 revision, not an implementation-local alternative.
