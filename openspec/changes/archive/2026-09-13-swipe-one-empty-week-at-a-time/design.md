## Context

T01 replaced the vendor timeline with a feature-private owned shell on the real Calendar route. The screen owns one selected date and derives the native month/year title and localized canvas label from it; the renderer owns only that accessible context and the empty full-bleed canvas. Gesture Handler, Reanimated, Worklets, the root gesture owner, and their supported Jest setup remain installed, but the Calendar renderer has no gesture or transition state yet.

T02 must add one visible capability without prebuilding the later timeline: an empty week moves exactly one complete launch week per swipe or accessible action. The approved D02/D04/D05/D06 boundaries require UI-thread transient motion, a three-page mounted working set, explicit Monday-first policy input, atomic settled presentation, stale-completion rejection, and one settled accessibility announcement. The page remains empty: hour scrolling, weekday columns, events, weekend filtering, day mode, zoom, and far-date controls belong to later tickets.

## Goals / Non-Goals

**Goals:**

- Page the empty owned week by exactly one complete week for either horizontal direction, independent of fling velocity.
- Keep the native title, canvas label, and selected date on the old committed week while a drag is held, then update the page and date context together after an accepted settle.
- Use display-zone calendar arithmetic across month, year, and daylight-saving boundaries, with Monday supplied as an explicit launch policy rather than embedded as an invariant.
- Keep only previous/current/next pages mounted and at most one pending replacement generation; cancel or ignore obsolete motion and duplicate completions.
- Provide translated previous/next adjustable-canvas actions with deterministic focus semantics, reduced-motion behavior, and one announcement per accepted week.
- Capture focused automated proof plus content-free native gesture/frame/retention evidence and a testable owner checklist.

**Non-Goals:**

- Vertical scrolling, an hour gutter/grid, weekday columns, Show weekends, day/week mode switching, event/all-day rendering, event activation, zoom, current time, orientation/resizing, or arbitrary far-date controls.
- Agenda redesign or bidirectional active-section integration, changes to stored event facts/range queries, a public renderer API, another pager implementation, a fallback renderer, or a new dependency.
- API/generated-client, database migration, native/store configuration, deployment/CI workflow, or legacy Flutter changes.
- Release-performance acceptance, the 30-minute final stress gate, complete assistive-technology acceptance, owner acceptance, or merge.

## Decision: Isolate launch-week arithmetic as a pure policy-driven seam

Add pure Calendar data helpers that resolve the containing week and shift it by whole calendar weeks in an explicit display zone. Callers pass a first-weekday policy; the launch caller supplies Monday. The implementation composes the existing day-key/date conversion and zone-calendar-day helpers and never adds fixed 24-hour millisecond durations. The settled Calendar date is the launch-week anchor, so a fresh date, Today, or retained one-shot focus date is normalized to the containing policy week before it reaches the paged surface.

Tests cover all seven input weekdays, both directions, month/year rollover, spring-forward and fall-back boundaries, and multiple display zones. Pure week arithmetic receives 100% statement and branch coverage plus round-trip and repeated-shift properties.

Alternatives considered:

- Add or subtract `7 * 24h`: rejected because the result can miss display-zone midnight across daylight-saving changes.
- Hard-code Monday inside renderer indices: rejected because D02 and the product contract require week start to remain an explicit future policy input.
- Defer week normalization until T04 columns: rejected because T02 already promises whole, non-straddling launch-week pages.

## Decision: Use one three-slot renderer with UI-thread transient translation

Extend the feature-private renderer into one horizontal strip containing exactly the immediate previous, current, and next empty week canvases. A Gesture Handler pan updates only a Reanimated shared translation during finger movement. No frame-frequency React state update, date formatting, event read, or page allocation occurs. The renderer measures its positive width, clamps drag resistance, chooses at most one direction from displacement/velocity, and settles to either one neighbour or the current page. Velocity can affect the decision and platform-tuned animation, never the number of pages crossed.

The controller also keeps a cumulative page position. Each strip generation is laid out at that position, and a completed destination already rests at the next position before the JS acknowledgement. When the accepted commit replaces the three week identities around the new anchor, the destination page therefore remains at the same physical coordinate; there is no post-commit transform jump that can expose the wrong neighbour for a frame. A new pan/action or layout interruption cancels current animation and invalidates its completion. Reduced motion uses the same request/accept path but commits without nonessential travel animation. Exact thresholds and timing are tuning constants owned by implementation evidence rather than product contracts.

Alternatives considered:

- Use `react-native-pager-view`: reserved as D04's comparator only if measured owned motion fails; choosing it now would introduce another behavior surface without evidence.
- Keep an unbounded page array or append while paging: rejected because session length would become retained work.
- Recreate the whole renderer after every settle: rejected because it risks blank frames and discards the approved bounded replacement model.

## Decision: Commit week transitions through one revisioned controller path

The screen/controller remains authoritative for the committed selected date, native title, and canvas label. A page request carries a monotonic transition revision, direction, source, and current anchor. The renderer may move complete adjacent visuals while the old committed date context remains unchanged. A settle acknowledgement is accepted once only when its revision is still current; acceptance changes the week anchor, cumulative page position, native month/year title, renderer generation, and accessibility context in the same transition. Duplicate acknowledgement is idempotent, and any completion from a cancelled or superseded revision is discarded.

Swipe and translated previous/next actions enter this same path. No hidden imperative ref or independent screen/renderer date state is introduced. Agenda continues to consume the committed selected-date range and stays unchanged otherwise; T18 retains ownership of bidirectional agenda date context.

Alternatives considered:

- Let the renderer mutate the date directly from a gesture callback: rejected because independent title and page updates recreate the race D02 removed.
- Update the heading when the pan crosses a threshold: rejected because held or reversed drags would announce and label an unsettled destination.
- Queue every press while motion is active: rejected for T02 because an unbounded queue conflicts with one pending replacement; a newer request invalidates obsolete work and every accepted request still moves at most one week.

## Decision: Keep one accessible settled context and explicit alternatives

The native month/year title is the sole visible page header. The adjustable canvas exposes the localized committed week and translated increment/decrement actions. Adjacent visual slots are hidden from the accessibility tree until committed so recycling never creates duplicate contexts or canvas targets. Both actions request exactly one week and remain usable without the swipe gesture; no visible arrow toolbar is rendered.

Only the accepted settle path announces the new localized week context once. Intermediate pan updates, cancelled motion, stale acknowledgements, and duplicate delivery do not announce. The adjustable canvas remains the predictable date context; full event-identity focus behavior remains with later event tickets.

Alternatives considered:

- Give all three pages semantic headings: rejected because it creates a duplicate, recycling-dependent focus tree.
- Depend on a live region plus an explicit announcement: rejected because the same settle can be spoken twice.
- Treat Agenda as the accessible alternative: rejected by D06 because paging must remain operable on the Calendar surface.

## Decision: Prove behavior at pure, component, screen, contract, and native boundaries

Pure tests own week arithmetic and reducer/revision behavior. Renderer tests use the supported Gesture Handler/Reanimated Jest path and only add narrow wrappers to `mobile/jest/setup-reanimated.ts` when a lifecycle call must be observable; they do not emulate a worklet runtime. Component/screen tests cover held-drag context stability, one-page settle, frame-coherent page-position replacement, snap-back, reversal/cancellation, stale and duplicate completion, repeated actions, reduced motion, one announcement, and stable three-page retention. The repository contract is updated so it permits only the intended owned paging modules and continues to reject vendor/fallback/duplicate renderer paths.

Implementation also records content-free iOS/Android gesture evidence when available, including actual build/device/OS, active refresh rate for timing claims, held drag, fast fling, reversal, controls, settled announcement, frame observations, and retained-page/generation counts. Missing physical-device axes are recorded in a `(HUMAN: owner device verification)` migration inbox note and remain explicit for T28; automated tests do not claim native feel or screen-reader behavior.

## Risks / Trade-offs

- **JS acknowledgement can arrive after newer motion** → Carry monotonic revisions through request and settle, cancel active motion, and accept each current revision once.
- **Three visual slots can become three focus trees** → Hide non-current slots from native accessibility and assert one settled heading/context.
- **Fast flings can skip or expose an empty edge** → Clamp every gesture to one direction/slot and retain both immediate neighbours for the full interaction.
- **Week arithmetic can drift at timezone transitions** → Build only from display-zone civil-day helpers and prove DST/month/year properties without fixed durations.
- **Resize or unmount can leave a translated strip** → Cancel animation and reset/rebuild from the last committed anchor on lifecycle/layout changes; T07 still owns responsive-window acceptance.
- **The supported Jest mock can mask native gesture timing** → Keep unit assertions behavioral and collect the ticket's native recordings/traces before owner acceptance.
- **Early frame/retention evidence lacks final numeric budgets** → Fail obvious wrong/partial frames or unbounded growth now, record exact observations, and leave final latency/resource thresholds to T26/T27.
- **The change can grow into later Calendar slices** → Keep pages empty and do not add grid, columns, events, vertical arbitration, pinch, settings, or alternate pager code.

## Migration Plan

1. Add and fully test the pure policy-driven week arithmetic and revisioned transition semantics.
2. Extend the owned shell to the three-slot gesture surface and shared previous/next transition path.
3. Wire accepted settlements into the existing Calendar controller/screen so selected date, page position, native title, canvas label, range, and announcement share one commit.
4. Update focused tests, the owned-renderer repository contract, current Calendar Architecture Book guidance/changelog, and the owner-evidence note.
5. Run scoped local-green and strict OpenSpec checks, push the implementation to the existing draft PR, and prepare the immutable build/checklist for the ticket-specific owner QA hold.

Rollback is a source/build rollback to the accepted T01 revision. The change has no persisted-data, server-contract, or native-binary migration, and no dormant alternate renderer is retained.

## Open Questions

None. The approved product contract, D02/D04/D05/D06 decisions, T02 checklist, and T01 implementation resolve the design boundary. If native evidence shows the owned motion cannot satisfy one-page paging or continuity, stop and return that measured failure to the Founding Engineer before introducing the native pager comparator or changing an approved decision.
