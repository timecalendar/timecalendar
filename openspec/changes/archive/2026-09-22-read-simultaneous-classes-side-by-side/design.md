## Context

T09 publishes complete immutable three-page event models and T10 separates each event's duration-faithful visual from a vertically expanded 44pt iOS / 48dp Android interaction target. The owned canvas still renders every tile at full day-column width. The existing pure `layoutOverlaps` helper already recognizes half-open adjacency, greedily reuses columns, and computes a whole connected cluster's maximum concurrency, but exact start/end ties fall back to input index and the renderer does not consume its output.

T11 connects those seams. Layout must be a stable fact of the complete retained day model, not a viewport or gesture-frame calculation. Every valid event remains visible and keeps its original identity. Where platform-minimum targets would overlap and make direct activation ambiguous, the product must ask the user which event to open rather than guessing from render order or hiding a class.

## Goals / Non-Goals

**Goals:**

- Produce deterministic minimum-column placement for positive-duration intervals from start instant, end instant, and stable source/event identity.
- Give every connected overlap cluster equal-width, non-covering visual columns while allowing adjacent intervals to reuse a column.
- Compute placement from complete day clusters before any viewport clipping and keep it unchanged through scroll and zoom.
- Preserve T10's faithful visuals and platform-minimum targets while making every ambiguous target conflict an explicit, localized, accessible choice.
- Establish property/permutation tests and the first identified fabricated overlap density, frame-work, mounted-node, semantic-node, and activation evidence.

**Non-Goals:**

- Hiding events, capping density, inventing an aggregation threshold, widening tiles across temporarily free columns, or declaring a final supported workload.
- Changing point-event facts, stored rows, bounded local reads, source visibility, details authority, or original-identity routing.
- Adding all-day lanes, multi-day or DST splitting, a compatibility renderer, another pager/scroll/gesture owner, or a fourth top-level Maestro journey.
- Changing API/generated contracts, migrations, native/store/EAS/Firebase configuration, deploy/CI/infrastructure, or legacy Flutter.

## Decisions

## Decision: Layout positive intervals by a total identity-backed order

The overlap helper accepts only finite positive-duration intervals plus a stable identity derived from the existing source discriminator and original UID. It validates every input before sorting; points remain on their T10 path, and reversed or non-finite intervals cannot enter packing. The comparator is start instant, then end instant, then source and UID using deterministic ordinal string comparison. Input position is never a tie-break. Stable identities must be unique within a day presentation; violating that model invariant is surfaced in development/test rather than silently choosing one duplicate or changing its identity.

The engine copies and sorts its input, leaving the immutable presentation unchanged. Its result is keyed by stable identity so a caller never depends on sorted-array position to reconnect placement to a tile.

Alternatives considered: JavaScript stable-sort/input index changes columns when repository order changes; title is mutable and non-unique; locale comparison can change across devices; rewriting duplicate identities would break details authority.

## Decision: Connected clusters use minimum equal-width non-covering columns

Two positive intervals overlap only when each starts strictly before the other's end. Therefore an interval ending exactly when another starts frees its column immediately. In total order, the engine assigns the lowest available column and tracks the maximum simultaneous occupancy across each maximal overlap-connected cluster. Every member receives `column`, `columns`, `startX = column / columns`, and `endX = (column + 1) / columns` from that completed cluster.

The renderer applies those fractions inside the existing civil-date column, preserving the existing two-unit separator inset at the outer edge. Visual rectangles in one cluster therefore have equal widths and no positive-area intersection. A tile does not expand horizontally when a neighbour ends; stable cluster width is favored over locally wider but shifting geometry.

Alternatives considered: pairwise offsets do not handle transitive clusters; duration-weighted widths make scanning inconsistent; span expansion changes a tile's edges through the cluster and complicates stable targeting.

## Decision: Packing belongs to complete presentation preparation before clipping

The timeline presentation prepares overlap placement after filtering/validation and before any visual viewport culling. It supplies every positive interval for the relevant civil day, including off-screen intervals connected transitively to a visible event. Point visuals remain in the day model and participate in target-conflict planning, but do not consume duration columns.

The prepared placement is immutable and changes only when the complete event presentation changes. Vertical scrolling changes visibility only; live pinch frames project already prepared minute and horizontal fractions and do not query, sort, cluster, or write React state. Settled zoom may recompute target-conflict geometry because minimum target pixels interact with scale, but it cannot recompute or reshuffle overlap columns.

Alternatives considered: packing only mounted tiles reshuffles at viewport edges; packing in the canvas duplicates data ownership; per-frame packing violates the UI-thread work budget.

## Decision: Ambiguous effective targets collapse to one explicit chooser trigger

The renderer first derives each event's effective target rectangle from its assigned horizontal span and T10 vertical interaction geometry. Rectangles that intersect with positive area form deterministic conflict components. A component of one keeps the direct event button. A component with multiple identities renders every visual tile unchanged but exposes one localized chooser trigger for pointer and accessibility interaction over the component union; the underlying event targets do not compete for hit testing or appear as duplicate semantic nodes.

Activating the trigger opens one React Native accessible modal owned by the Calendar feature. It names the choice and lists one button per involved event in the same stable start/end/identity order. Each row carries the complete existing localized event label, and selecting it dismisses the chooser and invokes the existing original-UID callback exactly once. Cancel/back dismisses without navigation, focus is contained while open, and a presentation or page-generation replacement dismisses a stale chooser. No event is hidden visually or removed from the available choices.

The conflict component is calculated from actual effective target rectangles, not from a fixed event-count threshold. A point, tiny interval, or ordinary interval may participate when geometry conflicts; a dense count alone never triggers aggregation. Native page/scroll/pinch ownership continues to cancel the initial press through the existing hierarchy.

Alternatives considered: z-order chooses the wrong event silently; shrinking below platform minimums weakens T10; one semantic button per overlapping rectangle leaves touch ambiguous; a numeric aggregation threshold hides valid events and guesses at device geometry.

## Decision: Property tests and identified fabricated measurements bound the claim

Pure tests generate permutations and interval sets to prove output equality by identity, positive-duration rejection, adjacency reuse, minimum column count, equal width, non-covering visuals, complete transitive clusters, and independence from viewport and zoom inputs. Focused component tests prove direct versus chooser semantics, deterministic option order, cancellation, stale dismissal, exact original-UID activation, and absence of underlying ambiguous targets.

The existing fabricated dense-week fixture is made date/zone deterministic and extended only as needed to identify adjacent, identical-bound, two-way, three-way, five-way, point, and tiny-target cases. Evidence records the fixture revision and exact counts for input events, largest cluster, computed placements, mounted visual nodes, committed semantic nodes before/while the chooser is open, and target selections. It also proves gesture frames perform only projection from prepared placement. These are first populated-surface observations, not representative p50/p95 limits or final device acceptance.

Alternatives considered: one example test misses permutation instability; elapsed time alone hides node and frame-work growth; guessed production counts would prematurely define the T24/T25 workload contract.

## Decision: Extend current renderer guidance without a new ADR

This change implements approved D04/D05/D06 behavior inside the existing data/renderer boundary and preserves ADR 033's single feature-owned renderer module. It changes no costly-to-reverse architecture, dependency, persistence format, or external contract, so no new ADR is planned. Current Calendar/testing guidance and the Architecture Book changelog will describe the implemented overlap and chooser contracts; the canonical T11 evidence section will record only exact results.

If implementation requires an API/generated contract, migration, native/store configuration, deploy/CI change, legacy Flutter edit, a second semantic tree, or a different renderer ownership boundary, the Applier stops and returns the issue to the Founding Engineer before editing that surface.

## Risks / Trade-offs

- [A transitive off-screen interval changes a visible tile's cluster width] → calculate the complete relevant day cluster before viewport clipping and test chained overlaps across viewport boundaries.
- [Expanded vertical targets conflict even after visual columns separate] → replace only the conflicting effective targets with an explicit chooser; keep visuals and complete labels intact.
- [A chooser can become stale during paging or data replacement] → key it by committed page generation and stable identities, dismiss it on replacement, and route only identities still present in the current presentation.
- [Narrow columns can constrain visual text] → retain T10 title-first clipping and complete chooser/accessibility labels; T25 owns later visual-density tuning.
- [Sorting arbitrary strings can vary by locale] → use ordinal source/UID comparison, never localized collation.
- [Host tests cannot prove physical target feel or VoiceOver/TalkBack modal quality] → prove structure, focus containment inputs, semantics, and routing on host; record native-device evidence as missing for the planned final-device slice.

## Migration Plan

Implement the validated identity-backed overlap result and property tests first, then attach placement to immutable timeline presentation, render fractional columns, add conflict planning and the accessible chooser, extend fixtures/contract tests, and reconcile current documentation. No data migration, backfill, native rebuild requirement, rollout, or deploy act exists. Rollback is a source revert to T10 full-width tiles; stored events remain byte-for-byte compatible.

## Open Questions

None. T24/T25 retain supported-workload calibration and final density tuning; the planned final-device slice retains physical accessibility acceptance.
