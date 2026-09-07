## Context

The merged responsive foundation provides one owner-measured policy through `AdaptiveContent`, `useAdaptiveLayout`, and `resolveResponsiveLayout`: compact below 600, tablet gutters at 600+, readable content capped at 640, standard content capped at 800, and optional-column eligibility at 834. The audited scheduling screens predate that seam. Home and personal events still carry local 800-point frames, Calendar Agenda is uncapped while the day/week renderer correctly fills its owner, and details/forms allow long content to span the available route.

Home's `TodayTimeline` is the exceptional geometry consumer. Its overlap engine produces fractions, but the initial pixel multiplier is inferred from `useWindowDimensions()` and Home padding before `onLayout` reports the real tile-area width. That assumption is wrong for any presentation whose usable owner is narrower than the window.

This change crosses Home, Calendar, event-details/checklist, and personal-events UI, but it must preserve the feature/renderer boundary, native chrome, route/data/persistence semantics, safe-area ownership, keyboard avoidance, and source/focus order. The portrait full-screen iPhone/iPad contract in ADR 042 remains binding; landscape and multitasking are not introduced here.

## Goals / Non-Goals

**Goals:**

- Apply the existing semantic lanes consistently to the scheduling surfaces identified by the tablet audit.
- Make Today timeline horizontal geometry depend only on its laid-out tile-area owner.
- Preserve compact phone composition and every existing scheduling interaction.
- Prove boundary behavior with focused component/geometry tests and update the tablet matrix with actual implementation evidence.

**Non-Goals:**

- No change to event selection, calendar sync, time-zone math, overlap packing, checklist or personal-event persistence, validation, deletion, navigation, or route parameters.
- No calendar renderer replacement, vendor patch, gesture/density redesign, optional tablet columns, master-detail/sidebars, landscape, multitasking, or tablet-only navigation.
- No dependency, generated API/contract, schema/migration, native/store/EAS/Firebase, deployment/CI, or legacy Flutter edit.

## Decision 1 — One measured lane owner per composed scheduling surface

Home, event details, and the personal-event screens will place the shared adaptive component or hook inside their existing safe-area/presentation owner and reuse that single measurement for all feature-owned siblings that must align. Home uses `standard`; details and the form use `readable`; the personal-events list uses `standard`.

For Home, the feature-owned header, welcome/status blocks, Upcoming, Today, scroll edges, and platform-specific add affordance share the lane. Upcoming remains a horizontal scroller of fixed 200-point cards; extra tablet width reveals more cards instead of stretching individual cards. For the form, the `KeyboardAvoidingView` stays the vertical/keyboard owner while its scroll body and footer are bounded by the same readable lane and retain their source order.

**Alternative rejected:** retain `maxWidth` and per-child padding at each screen. That reproduces the cap but not the foundation's exact breakpoint gutters, duplicates width policy, and lets header/body/footer edges drift.

## Decision 2 — Today geometry waits for and follows the tile-area owner

`TodayTimeline` will attach the existing measured-layout mechanism to the actual flex tile-area owner and use that positive content width as the sole pixel multiplier for overlap fractions. `useWindowDimensions()` remains only for `fontScale`, which is genuinely window-owned. The current window-width/padding fallback constants are removed.

Before the first positive tile-area measurement, events use the already-supported ordered reflow presentation rather than guessed absolute geometry or zero-width tiles. After measurement, the existing font-scale, minimum-target-width, and event-height conditions choose between overlap geometry and reflow exactly as today. Later owner-size changes recalculate placement from the new measurement without changing the pure overlap or time-grid algorithms.

**Alternative rejected:** pass the Home lane's computed width down and subtract the hours column. The tile area is nested below section composition and the hours column; measuring it directly is simpler and remains correct if either parent composition or column width changes.

## Decision 3 — Calendar composition is mode-aware at the feature seam

The Calendar feature continues to own orchestration and the renderer-neutral `CalendarTimeline` remains full bleed for day/week. The Android FAB remains an absolute child of those full calendar bounds, and native header/actions/view-menu ownership is unchanged.

Agenda mode instead places `CalendarScreenStatus` and `AgendaList` inside one `standard` adaptive lane so loaded rows, empty/error feedback, and pull-to-refresh content align. This mode-aware wrapper belongs in calendar feature UI; no responsive concern crosses into the calendar-kit adapter or vendor package.

**Alternative rejected:** cap the entire Calendar screen. That would shrink day/week canvas density and move the Android FAB away from the renderer bounds. Capping only Agenda list rows while leaving state content outside would retain the alignment defect.

## Decision 4 — Details and forms remain one column

Event details, including loaded/loading/not-found/error presentation and the checklist, use one `readable` lane. Personal-event create/edit/delete uses one `readable` lane for both fields and actions. Neither surface adopts optional columns at 834: the content is sequential, actions depend on preceding context, and one column preserves title → metadata → actions → checklist and field → validation → save → delete source/focus order without a large-text branch.

**Alternative rejected:** group metadata or form fields into two columns at 834+. The audit permits columns only when they improve independent scan groups and provide a one-column large-text fallback; these flows are sequential and gain more from a readable line length than from denser grouping.

## Decision 5 — Boundary-focused proof, not a width cross-product

Each changed screen will prove its own lane, state, and behavior at the smallest width set that exercises its rule. The responsive resolver's existing suite remains the exhaustive 390/599/600/768/800/834/1024 boundary table. Feature tests will cover 390 phone preservation plus representative 600/768/800/834/1024 tablet cases where needed, including a narrower measured owner than the mocked global window for Today geometry.

Tests will continue asserting user-visible behavior, source/accessibility order, selectors, and platform branches rather than duplicating resolver arithmetic everywhere. Maestro selector/static checks are retained or updated only if affected; this host cannot provide native execution, so no simulator claim or `run-e2e` label is part of the change.

**Alternative rejected:** render every state of every screen at all seven widths. That creates a slow, brittle cross-product while adding no proof beyond the central resolver boundary table and focused ownership assertions.

## Risks / Trade-offs

- **The unmeasured Today timeline briefly uses reflow before its first layout event.** → Keep that fallback fully interactive and ordered; focused tests prove the first positive measurement switches geometry to the exact owner width.
- **Scroll/list layout styles can accidentally fight flex sizing or sticky headers.** → Keep measurement outside the existing scroll/list primitive, preserve its vertical flex ownership, and assert Agenda headers/rows plus Home and personal-event scrolling at representative widths.
- **Moving wrappers can disturb safe-area, keyboard, or absolute-FAB anchoring.** → Place lanes strictly inside current safe-area owners, keep `KeyboardAvoidingView` and platform chrome in place, and add platform/focus-order regression assertions.
- **A broad multi-screen diff increases regression surface.** → Organize implementation by feature owner with focused tests after each slice, then run the prescribed full mobile gates before handoff.

## Migration Plan

This is a presentation-only, atomic application change with no stored-data, API, or rollout migration. Implement feature by feature, update the tablet matrix after the code and focused proof exist, and ship through the existing mobile release path. Rollback is a code revert of the lane wrappers, geometry measurement, tests, and matrix entry; no persisted state requires recovery.

## Open Questions

None. The merged responsive policy, tablet audit ownership matrix, and Founding Engineer brief resolve the lane, breakpoint, composition, and verification choices.
