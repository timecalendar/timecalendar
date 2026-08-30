# 049 — Wire Activity's triggers as independent edges into one seam, and let none of them fail its caller

## Status

Accepted.

## Context

[ADR 048](./048-activity-refresh-single-flight-and-token-precondition.md) built
the Activity refresh seam: one module-level single-flight slot, one persisted
five-minute freshness window, one token precondition, and a `refreshNewestPage`
that **never rejects**. It deliberately wired nothing to it.

This ADR records the wiring. Six events should make Activity current — pull to
refresh, a relevant push, a successful calendar sync, opening the screen,
returning to the foreground, and cold launch — and they arrive from three
different owners: the calendar feature, the notifications feature, and the
Activity feature itself. Three questions had to be settled before any edge could
be drawn: *what may a trigger do with the outcome*, *what fires a trigger when
the calendar-log history stops being current for a reason no request can see*
(a calendar was removed), and *which way do those edges point*.

Upstream source: `docs/react-native-migration/05-tech-specs/activity-revival.md`,
architecture decisions 6 and 7 (the trigger table) and *Mobile state behavior*.
Implemented by TIM-399.

## Decision

### Silent host and runtime edges fire the seam and read nothing back

Calendar sync, push receipt and app foreground are silent host/runtime edges.
They call `void refreshNewestPage(...)` — unawaited, with no `try`, no `catch`
and no inspection of the outcome. That is not carelessness; on the sync path it
is the mechanism behind the epic's hardest requirement, *a calendar-sync
success is never converted into a failure by an Activity refresh failure*.
`refreshNewestPage` never rejects (ADR 048), so a caller cannot propagate a
rejection it forgot to catch, because there is none to propagate; and because
the sync reads no outcome, a `{ status: "failed" }` cannot reach `setIsError`.
A `catch` on these call sites would be dead code implying the opposite contract,
so there is none.

The Activity screen is the deliberate exception. Its screen-open refresh and
forced pull-to-refresh await the shared operation and expose its outcome so the
screen can show a failure while retaining cached content. Failure isolation is
therefore a caller policy: silent edges ignore the outcome; screen-owned edges
observe it.

The sync trigger fires **after the event write commits and before name
convergence** — the spec's trigger is "after event storage succeeds", and name
convergence is a separate failure domain whose throw must not suppress Activity.
It is unawaited so `isSyncing` is not held open across an unrelated request.

**Forced vs. passive is a property of the trigger, not of the seam.** Pull to
refresh, a push and a completed sync are forced: each *is* the signal that
something changed, so the freshness window must not swallow it. Opening the
screen and returning to the foreground are passive: they are guesses that
something *might* have changed, and the window answers them for free.

### Notification receipt fans out to two independent seams

`useNotificationTapRouting` already called `void sync()`. It now also calls
`void refreshNewestPage({ force: true })` **beside** it, never chained onto its
promise, because architecture decision 7 requires the push guarantee to survive a
sync that fails. Independence costs no extra request: when the sync also
succeeds, its own post-storage refresh joins the same in-flight slot.

The Activity gate is the message **action** (`calendar_changed` /
`calendar_digest`), not `parseNotificationRoute(message) !== null`. A
`calendar_changed` whose `payload` cannot be decoded parses to `null` but is
still a real calendar change: routing correctly declines to navigate, and
Activity must still refresh. `routeTap`'s existing unconditional `void sync()`
stays unconditional — narrowing it would be a routing-behavior change.

### Cold launch gets no code

The trigger table gives cold launch no independent row: the startup calendar sync
causes the post-sync refresh. The honest consequence, recorded rather than
papered over: on an **offline** cold launch the sync fails, so no Activity
refresh happens at launch, and Activity becomes current at the next screen open,
foreground return, push or successful sync. An unconditional launch refresh would
spend a request per launch per student — the capacity posture this epic exists to
avoid.

### Foreground means `background → active`, never `inactive → active`

iOS raises `inactive → active` for a notification-shade pull, a control-centre
swipe and an incoming call. None is a return to the app. The trigger tracks a
`backgroundedRef` set on `"background"`, the idiom `OtaUpdateRuntime` already
uses. Cold start is not a foreground transition either, which is why the previous
decision is a separate one rather than an accident.

### Activity observes the held-calendar set shrinking; calendar-sources never imports Activity

"Calendar is removed → delete its Activity rows immediately" needs a
`pruneToHeldCalendars` call, and the obvious home for it is the removal call site
in `calendar-sources/data`. **Rejected.** `activity/data/request.ts` imports
`@/features/calendar-sources/data`, so the reverse import closes a module require
cycle whose failure mode under Metro is a binding that is `undefined` at
module-init time — invisible to `tsc`, invisible to the boundaries plugin, and
dependent on import order. Putting it in `calendar-sources/ui` avoids the
file-level cycle but inverts the feature-level edge and covers only the one call
site that exists today.

Instead `useActivityOwnershipPrune` lives in the Activity feature, is mounted
once in the root layout, and reads the calendar-sources live query it is already
allowed to read. It does nothing until loaded, does nothing on the **first**
loaded observation, and prunes only when an id present in the previous
observation is absent now.

**That first-observation guard is the whole safety argument.** ADR 048 forbids a
speculative `findAll()` precisely because it cannot tell an empty device from a
read that raced the sources table — and pruning on the latter destroys the entire
cache. Here the empty set is only ever acted on as the *second* term of an
observed transition from a non-empty loaded set, which is a removal event
observed rather than assumed. Ids come from every held row and are never filtered
on `visible`: hiding a calendar is a display preference, and dropping a hidden id
would delete that calendar's whole history the first time a student hid it.

To make the direction enforceable rather than aspirational, `eslint.config.js`'s
`timecalendar/calendar-sources-is-a-leaf` block bans `@/features/activity` inside
`src/features/calendar-sources/**`.

## Consequences

- **Four triggers, one request.** Overlap collapses in the seam, so adding a
  trigger costs no capacity — provided it goes through `@/features/activity`. A
  future trigger that bypasses the barrel reintroduces the risk; ADR 048's ban on
  the generated calendar-log client outside `activity/data/**` and the
  request-counting integration test are what hold that line.
- **An Activity failure is invisible on four of six triggers.** Push, sync,
  foreground and the cold-launch sync path are silent; screen open and
  pull-to-refresh expose the outcome. Failure visibility belongs to the trigger,
  not the fault, so Crashlytics is the only signal for a persistently failing
  refresh outside the Activity screen.
- **The no-catch posture is safe only while `refreshNewestPage` never rejects.**
  If a later change makes it rejectable, the calendar-sync path is where the
  damage lands. The contract is asserted in ADR 048's tests and restated here.
- **The prune is only as live as the root layout.** It observes a live query
  mounted for the whole app lifetime; a removal that happens while the tree is
  unmounted is caught at the next mount, not missed — the transition is
  recomputed from the first loaded observation after remount, so a removal
  spanning a process restart is **not** pruned by this path. It is corrected by
  the next successful page write, which prunes by ownership inside its own
  transaction.
- **One new lint block, and a trap it documents.** The block re-calls
  `restrictedImports([...])` rather than listing its single pattern: flat config
  *replaces* a rule's options rather than merging them, so a block naming only
  the new pattern would have silently disabled every base seam ban for the whole
  calendar-sources feature with lint still green.

## Revisit if

- `refreshNewestPage` ever needs to reject, or a silent host/runtime caller ever
  needs its outcome — the failure-isolation argument above is what would have to
  be rebuilt.
- A trigger needs Activity to be current when the calendar sync is *not* — the
  post-storage placement is what would move.
- Background fetch or another OS-driven lifecycle arrives: it is a new row in the
  trigger table, and the passive/forced question has to be answered for it
  explicitly rather than inherited.
- The removal prune needs to survive a process restart, or a second consumer
  needs the held-calendar transition — at that point the observation belongs in a
  shared place rather than in one hook.
