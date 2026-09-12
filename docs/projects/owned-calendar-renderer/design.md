---
kind: design
status: approved
---

# Target technical design

## Approval and evidence boundary

Product P01–P08 and D01–D08 are approved on 2026-09-12. The owner approved all decisions,
explicitly included D04–D06, and directed that evidence be collected during small sequential
implementation slices. This design expresses those approved choices and the owner's delivery
policy. Approval is not a performance result. No product requirement is relaxed.

The implementation loop is: one ticket → agent checks → owner QA → feedback/fixes → explicit
acceptance → merge → next ticket. The [delivery protocol](./delivery.md) and
[roadmap](./roadmap.md) make the pauses and ticket-specific checklists concrete. There is no
mandatory separate prototype phase or final-only QA batch. Compare alternatives if evidence
shows a real problem; changing an approved decision still requires a recorded approval.

## Current context and constraints

Calendar currently composes an imperative calendar-kit facade with independent anchor/visible
React state. Local hooks merge full-table synced and personal reads, then filter by range.
The synced replacement is transactional, but multiple live-query completions do not establish a
single coherent presentation snapshot. Agenda groups only by start day. The native configuration
is portrait-only with full-screen iPad. These are concrete gaps against P02, P03, P06 and P07.

The [repository audit](./research/technical-system-audit.md) records exact source paths,
reusable candidates, rejected workarounds, and global-document reconciliation. The design stays
inside the existing feature/layer conventions; it creates no public package or server renderer.

## Target architecture

### Ownership and flow — D01, D02, D04, D06

1. Existing sync and personal-event repositories own persisted facts and writes. The renderer
   never imports a database, generated DTO, router, analytics client, or sync hook.
2. Calendar data owns validated rendering projections, local range reads, filtering, and immutable
   snapshots. Pure calendar arithmetic, segmentation, overlap, label inputs and geometry have no
   React, native, database or network imports. Keep these as a distinct pure submodule under
   `calendar/data`; enforce purity directly rather than trusting the broader data-layer lint rule.
3. The Calendar controller owns mode, selected civil date, navigation intent, display environment,
   settings persistence, agenda context and the committed snapshot. One transition reducer
   coordinates state changes. Day/week zoom and clock position remain separate from agenda scroll.
4. The renderer facade accepts a complete presentation model and revisioned intents, and emits
   settled outcomes and event activation identities. Its implementation owns grid, tiles, all-day
   lane, scrolling, gesture arbitration and bounded mounted work.
5. A chronological Calendar representation derives from the same validated model. It remains
   available if timeline rendering fails. Agenda retains its presentation and receives shared
   coverage semantics plus active-section/scroll integration.
6. The screen resolves event identities through the existing unified event-details flow. Rich
   descriptions/checklists remain in their current feature ownership; calendar summaries retain
   existing checklist presentation unless a separate approved product decision displaces it.

Dependency direction is screen → renderer/data, renderer → pure data, and data → owned storage
seams. Pure geometry cannot import hooks merely because both reside in `data`. Other features,
including Home, retain their independent presentation; any shared data signature changes must be
migrated coherently, not hidden behind a calendar-kit compatibility API.

### Presentation and gesture runtime — D03, D04

Use owned React Native View/Text/Pressable presentation, with the installed Gesture Handler and
Reanimated/Worklets stack for gesture recognition and transient UI-thread motion. Static semantics
and event planning execute in pure TypeScript; per-frame input does not trigger database reads,
event sorting, formatted labels, or React state writes. No additional native renderer is proposed.

A horizontal pan owns a one-page translation and platform-tuned settle; vertical scrolling owns
the timed viewport; the all-day lane owns gestures beginning within its bounds. Pinch takes
precedence, cancels press recognition, and preserves focal clock time. With scale s and scroll y,
the focal clock coordinate is (y + focalY) / s; updates solve the new y from that same coordinate,
then clamp at day boundaries. Menu zoom uses the viewport center. Boundary clamping, changing
finger count and interruptions need explicit native proof, including reduced motion.

If owned gesture motion fails its ticket acceptance, compare native ScrollView/pager-based
motion using the installed pager dependency. Native paging may simplify physics but does not automatically prove one-page
flings, recycling, pinch coexistence or atomic settle. Skia/custom native views remain escalation
options when evidence identifies a specific unsatisfied requirement, not assumed improvements.

### Navigation and atomic presentation — D02

A committed revision contains mode, civil anchor/date policy, environment, filtered event snapshot,
geometry, chronological model and date heading. A request carries a monotonically increasing
identity plus its operation (Today, target date, mode, zoom or environment change). This is a
private controlled protocol, not a promise to preserve the current imperative handle.

Prepare the destination's local data and geometry before publishing it. During finger-held
paging, the old title/date/semantic context remain committed while complete adjacent visuals may
move. Settle publishes destination content, heading and focus context together. A stale completion
cannot overwrite a newer intent or data/environment revision. Acknowledgements are idempotent;
repeated delivery of an intent does not repeat navigation or announcements. Commands interrupting
motion invalidate its completion and settle or cancel through the same state machine.

Retain the last complete model while building its replacement; never relabel old events as a new
date. Urgent visibility/removal changes invalidate activation immediately and must not remain
exposed indefinitely while waiting for an animation. Coherence includes headers outside the
renderer, not merely one React subtree. A native trace must prove the actual UI-thread/React
handoff; a reducer alone is not evidence of atomic frames.

Mode/week/agenda transitions follow product section 6 exactly. Agenda reports the date section
nearest the top and consumes direct-date requests without gaining a new date-selection UI.
Persistence uses the existing settings/storage seam for mode, show-weekends and shared zoom;
selected date and scroll offset follow fresh-open rules rather than restart restoration. Week
start is an explicit policy input, Monday at launch; weekend filtering uses weekday identity.

### Bounded work — D05

The initial horizontal working set is the settled page plus its immediate predecessor and
successor, with a single replacement generation while preparing a jump or environment change.
This initial policy is approved for implementation; measured resource ceilings remain open. Superseded generations are
released and at most one replacement job survives; rapid jumps cannot accumulate pending pages.

Read only the dates needed for those windows. Query long intervals by intersection, not start
within range; treat instant markers and date-only ranges separately. Do not pre-expand a long
multi-day event into its entire lifetime. Compute overlap from the complete relevant day cluster
before vertical clipping so columns do not shift when scrolling. Mounted tiles use viewport
culling with measured overscan; the semantic representation must reach every event allowed by the
collapsed/expanded contract even when its visual tile is outside the viewport.

Keep local-store size, rows scanned, returned events, geometry, mounted views, semantic nodes and
retained revisions as separate measurements. A bounded page count does not bound dense-day work.
The design uses database range selection plus bounded query-result caching to a permanent
full-event JS index. Query plans and latency must decide whether secondary SQLite indexes are
needed; any index migration preserves rows and importer fidelity. No hidden arbitrary event cap
or truncation of supported content is permitted.

## Data and contracts — D01, D02

The rendering domain discriminates timed instant intervals from all-day civil-date intervals.
Each carries stable source/event identity and only the summary fields required for presentation.
Segment identities include source event identity and covered date; all segments activate the
original event. Never use recycled page slots or array position as event identity.

The existing iCal parser uses `datetype === "date"` and stores UTC-encoded dates for all-day
input. Decode that established representation to date-only values at the local read boundary.
Do not infer all-day from midnight or duration. Preserve server DTOs, SQLite event rows and Phase
09 importer writes; the domain projection is not a serialization format. Other provider/import
paths still require fabricated contract fixtures before this assumption is trusted universally.

Validate required dates and interval ordering per row before shared formatting or layout. Skip
invalid rows individually; omit malformed optional fields and use localized title/color fallbacks.
Hide cancelled, hidden and invisible-source events before building both visual and semantic
models. Current whole-array mapping can throw on malformed tag elements; validation must precede
those operations. Zero-duration timed markers use point membership at the range boundary, whereas
positive durations use half-open intersection. All-day zero-length ranges are invalid.

Clip timed intervals to each covered display-zone day; all-day and agenda coverage use the same
exclusive-end semantics. Sort overlap by start instant, end instant, stable identity. Format
labels with locale, zone and device 12/24-hour preference supplied explicitly. Pure date-fns and
date-fns-tz wrappers are reuse candidates, subject to Gregorian validation and DST properties.

Fall-back dates are a specific unresolved geometry counterexample: a positive-duration event may
project from 02:45 to 02:15 on the same familiar wall-clock grid. Simple endpoint subtraction is
invalid. The semantics spike must define offset-transition splitting, positive drawable pieces,
and collision handling for distinct instants sharing wall-clock space, while keeping one event
identity and full labels. It must also resolve spring-forward intervals crossing the empty hour.
Do not add an extra hour row, change the product's wall-clock contract, or silently draw a
negative-height rectangle. If no faithful rendering satisfies the product contract, surface the
contradiction for product revision before continuing the affected implementation.

## Security and integrity — D01, D06, D08

Local rendering introduces no remote authorization path or data upload. Existing source visibility,
hidden events and event-details editability remain authoritative. Activation resolves a current
identity; removed events use the accessible unavailable-details state, not a stale captured row.

Diagnostics use allowlisted reason codes and aggregate counts only. Do not forward raw exceptions,
row objects, event identifiers, titles, dates tied to users, descriptions or query parameters to
analytics/crash metadata. Workload research uses aggregate-only output and cohort suppression from
the existing research plan; fabricated fixtures cannot contain copied identifiers or text.

## Failure handling and operations — D02, D06, D08

Local snapshot reads expose success, known empty and recoverable error as distinct states. Keep a
last valid snapshot where possible and offer accessible local retry; this retry cannot start sync.
A transactional sync commit invalidates queries and publishes one completed generation. Initial
sync availability and routine background sync remain in the app's existing orchestration, with
Calendar refresh/stale indicators removed as required by P06.

A timeline error boundary exposes the same-date chronological representation and retry. Its
validated data/labels and failure controls must sit outside the failed visual subtree. A data error
cannot be disguised as a valid empty date. Focus resolves to a surviving event or relevant date
heading; collapsing all-day content returns focus to the relevant expansion action.

The renderer stops animation/timers and releases obsolete revisions on unmount/background.
Current-time updates run only at the visible precision and while relevant/foreground; no continuous
idle animation loop. Foreground refresh recomputes Today/current time and effective environment.
Engineering owns release traces and regression diagnosis; product owns behavior/design sign-off.

## Rollout and rollback — D07

The first small slice installs the owned shell on the real Calendar screen and removes
calendar-kit, its facade/adapter/patch and exclusive mocks/lint allowances. It keeps the app
buildable and preserves existing agenda/data/details flows. No vendor/owned switch or second
renderer is introduced. Day/week capabilities are intentionally incomplete while later accepted
slices add paging, vertical scrolling, columns, zoom and events. This is approved pre-launch
sequencing, not a launch-quality exception or a license to leave defective finished capabilities.

Each ticket normally produces one reviewable change. Stop for the owner's checklist and feedback,
resolve it, and record acceptance and merge before implementing the next numbered ticket. Update
current docs/tests with each coherent slice; do not silence live checks to hide an unfinished
change. The chronological failure representation is required recovery, not another calendar engine.

Source-controlled Expo configuration enables the approved orientations and resizable iPad use,
preserving phone/tablet device families and OS floors. Update disposable-prebuild assertions and
source-contract tests; never hand-edit generated native projects. Because this affects the native
runtime, verify a fresh fingerprint and require compatible new binaries. Broader navigation/chrome
must receive orientation smoke coverage since these settings affect the app shell.

The audit lists exact ADR/OpenSpec reconciliation targets. Historical records remain historical;
current specs and Architecture Book pages describe the implemented end state when it exists.
Until acceptance passes, hold launch. Recovery is a source/build rollback to a known coherent
pre-launch revision for development, not authorization to ship calendar-kit or send incompatible
OTA code. Persisted event rows remain usable across that rollback; any optional index migration
must be additive and safe for the prior reader.

## Verification strategy — D08

[Technical acceptance research](./research/technical-acceptance-plan.md) defines incremental measurements,
measurements, ownership, research-row mapping and evidence gates. Existing tests prove existing
behavior only. Pure date/week/timezone/segmentation/indexing/overlap/zoom code needs 100% statement
and branch coverage plus property invariants; the wider repository quality checks still apply.
Native release traces and recorded human accessibility/gesture passes are irreplaceable gates.

## Decision index

See [D01–D08](./decisions/README.md). Every decision is approved with the owner’s implementation-time
evidence policy recorded in its Approval section.

## Open risks

Release performance, workload percentiles, Galaxy A16 validation, numeric zoom/overscan/node/memory
budgets, dense hit-target disambiguation, DST geometry, and complete native semantic navigation
remain unproven. The initial three-page working set may need tuning after measurement. No approved choice is a
performance result. Evidence gaps are assigned to explicit tickets; approval does not close them.
