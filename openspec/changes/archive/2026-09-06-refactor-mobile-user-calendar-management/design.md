## Context

`UserCalendarsScreen` currently owns navigation chrome, reactive list states, delete orchestration, rename-dialog state, row/menu presentation, optimistic visibility state, and all styles in one 488-line file. Calendars are eagerly rendered with `ScrollView` plus `map`. Each visibility control keeps a local optimistic override, clears acknowledged state from an effect, and uses a ref as the one-write-at-a-time guard.

The refactor must preserve the shipped surface exactly: the native `Switch`; translated accessibility label and hint; id-based testIDs; effective-name and personal-calendar fallbacks; iOS/Android menu behavior; confirm-gated delete and success-only announcement; rename dialog mounted only while open; read-gated empty state; write-error notice; platform add affordance; safe-area width and Android FAB clearance. ADR 018 remains the storage contract, ADR 031 remains the event-source filtering contract, ADR 044 forbids using larger waits or retries to hide ordering failures, and lint boundary B-6 keeps calendar-sources independent of Activity.

## Goals / Non-Goals

**Goals:**

- Give screen composition, row/menu presentation, and visibility coordination separate, bounded owners.
- Virtualize every non-empty calendar collection without changing its surrounding layout and state behavior.
- Make optimistic ordering explicit and deterministic across write completion, delayed live-query echoes, failures, rapid input, external canonical updates, and virtualized row unmount/remount.
- Keep the change local, reversible, and fully covered by focused component/controller tests.

**Non-Goals:**

- No change to SQLite rows, repository writes, `useUserCalendarActions`, sync, event filtering, rename semantics, translations, routes, public barrels, or analytics/observability.
- No new dependency, ADR, migration, native configuration, Maestro flow, or legacy Flutter edit.
- No redesign of the menu, add affordance, empty/error states, switch visuals, accessibility tree, or safe-area/FAB spacing.

## Decision 1 — Extract three UI owners without widening the public feature API

Keep `user-calendars-screen.tsx` as the exported composition root. Extract a calendar row/menu module and a visibility-control/controller module within `calendar-sources/ui`; keep them internal to that sublayer unless a test needs a direct relative import. The screen continues to own data hooks, navigation, delete confirmation, and rename target because those coordinate the whole surface. The row owns effective display labels and the platform menu trigger. The visibility module owns the switch presentation plus a pure reducer/controller for operation ordering.

This follows the existing feature-sublayer boundary: UI modules import the calendar-sources `data` sub-barrel, never the feature barrel, and do not introduce an Activity edge. A generic shared component was rejected because the behavior is calendar-domain-specific and has no second consumer. Splitting styles with their owning modules is preferred over one shared style file because it keeps component contracts local and avoids a styling dependency hub. Each resulting component must remain materially below 200 lines.

## Decision 2 — A single `FlatList` owns the non-empty content and its spacing

Replace the non-empty `ScrollView` and `calendars.map` with React Native `FlatList`, using `calendar.id` as `keyExtractor`. Put the visibility-description copy in `ListHeaderComponent`, render one `CalendarRow` per item, and retain the existing content gap and bottom padding in `contentContainerStyle`, including the extra Android FAB clearance. Keep the write-error notice, unresolved-read blank state, centered loaded-empty state, Android FAB, and rename dialog outside the list exactly where they are today.

Using one list rather than nesting a virtualized list inside a scroll container preserves virtualization. Rendering the intro outside the list was rejected because it changes which region scrolls and complicates the available-height/empty-state layout. An additional list dependency was rejected because React Native's built-in list is sufficient for this bounded management screen.

## Decision 3 — Hoist id-keyed visibility operations above virtualized rows

The screen-level visibility controller owns a map of operation records keyed by calendar id; rows receive only the derived visible value, pending state if needed internally, and a toggle callback. This ensures a `FlatList` unmount/remount cannot discard an in-flight or awaiting-acknowledgement operation. Each accepted toggle receives a monotonically increasing operation id and records the target value. While that write is unresolved, further input for the same calendar is ignored and no second repository write starts.

The controller has explicit transitions:

1. **Start:** record the target immediately and render it optimistically.
2. **Write failure:** clear that same operation only if its id is still current, revealing the latest canonical value.
3. **Write success before echo:** retain the target while the canonical value is still the pre-write value.
4. **Canonical acknowledgement:** when canonical equals the current target, retire the operation synchronously as part of canonical reconciliation; do not use a passive effect to reset presentation state.
5. **Later canonical change:** with the acknowledged operation retired, render the new canonical value immediately.
6. **Stale completion:** a completion carrying an operation id that is no longer current is ignored.

The reducer/controller keeps canonical reconciliation separate from async completion handling so the ordering is testable as pure transitions. The implementation may use reducer state plus render-time canonical reconciliation or an equivalently explicit operation-keyed model, but must not mutate refs during render and must not restore the current state-reset effect. Local row state was rejected because virtualization can remount it away. Keying a visibility child by the canonical boolean was rejected for the same reason. Disabling the switch was not chosen as a product change; the existing one-write guard ignores repeated events while pending, and tests prove that behavior.

## Decision 4 — Preserve behavior through focused seams and exact ordering tests

Keep existing screen regression tests for loading/empty/error, safe-area insets, add routing, effective names, menu actions, rename mounting/cancel, delete confirmation/cancel/success/failure announcement, and platform accessibility behavior. Add a direct list assertion that the non-empty surface is a `FlatList` and remains id-keyed. Move row/menu assertions beside the extracted row when that reduces fixture size, but retain at least one screen-level composition proof.

Test the operation model with controllable promises and rerenders, without timer inflation or retries: optimistic success before canonical echo; successful delayed acknowledgement; failed write rollback to the latest canonical value; multiple rapid/repeated change events producing one write; canonical acknowledgement followed by a later external reversal; stale async completion not overriding a newer canonical/operation state; and unmount/remount of a virtualized row retaining the operation through screen ownership. These tests are the CI proof required by ADR 044; they must fail on incorrect ordering rather than wait longer.

React Doctor's current try/finally compiler bailout in the visibility path must be rechecked after extraction. Rewrite the async guard only if the resulting reducer/controller still makes single-flight release and failure recovery explicit; do not suppress the finding. Remaining findings are reported and classified as fixed, pre-existing, false positive, or accepted with evidence.

## Risks / Trade-offs

- **[List ownership shifts layout behavior]** → Keep unresolved/empty/error/FAB/dialog siblings unchanged; snapshot concrete content styles and assert header, row, and bottom clearance rather than relying on a visual guess.
- **[Virtualization remounts a row during an operation]** → Store operation records at screen/controller scope keyed by calendar id and cover remount behavior.
- **[Canonical old value is indistinguishable from a delayed echo before acknowledgement]** → Preserve the optimistic target until canonical equals it or the write fails, matching today's no-stale-flash intent; only a later change after acknowledgement is treated as external.
- **[Old async work mutates newer state]** → Compare operation ids on every completion and ignore stale ones.
- **[Extraction accidentally widens exports or crosses lint boundaries]** → Keep modules private to `ui`, preserve both existing barrels byte-for-byte unless an internal export is demonstrably required, and run lint with zero warnings.
- **[Compiler cleanup obscures recovery]** → Treat the try/finally rewrite as conditional and retain an explicit release transition covered on success and failure.

## Migration Plan

Implement the controller/tests first, then extract the visibility control and row/menu, then replace the list composition and update documentation. This is a source-only refactor with no persisted-data or rollout step. Rollback is a revert of the UI modules, tests, and documentation; no migration or cleanup is required.

## Open Questions

None. File names and the exact reducer action names are local implementation details for the Applier, provided the ownership and ordering contracts above hold.
