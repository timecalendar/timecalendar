## Context

Ticket 6 of the Activity revival epic ([TIM-399](/TIM/issues/TIM-399), epic
[TIM-389](/TIM/issues/TIM-389)). Authoritative spec:
`docs/react-native-migration/05-tech-specs/activity-revival.md` at `595786a0` — **architecture
decisions 6 and 7** (the trigger table and the dependency graph) and **Mobile state behavior**.

This change writes no request logic and no policy arithmetic. Ticket 4 already owns both: the
five-minute window, the single-flight slots, the token precondition and the failure classification
all live inside `refreshNewestPage`. What is left, and what this change is, is **the set of edges
into that seam** — which event calls it, with `force` or without, and what the caller is allowed to
do with the outcome.

Every symbol consumed here is fixed by [PR #324](https://github.com/timecalendar/timecalendar/pull/324):

```ts
refreshNewestPage({ force?: boolean }): Promise<ActivityRefreshOutcome>  // never rejects
loadOlderPage(): Promise<ActivityOlderPageOutcome>                       // never rejects
pruneToHeldCalendars(heldCalendarIds: string[]): Promise<void>           // writes no state
```

## Decisions

### D1 — The triggers live in `activity/data/lifecycle.ts`, not in a new sublayer

The three triggers the Activity feature owns (foreground, screen open, ownership prune) go in one new
file inside the existing `data/` sublayer.

`data/` is right, and a new `runtime/` sublayer is wrong, for two reasons. The repo already has the
exact precedent: `useStartupSync` — an app-lifecycle trigger hook, mounted in the root layout — lives
in `mobile/src/features/calendar/data/sync/startup.ts`. And the `boundaries/elements` taxonomy in
`eslint.config.js` captures `src/features/*/*` as `{ feature, layer }`, where B-1 keys off
`layer: "!(data)"`; a `runtime/` sublayer would immediately be forbidden from importing `@/db` and
would need config surgery to buy nothing.

The screen-open hook returns state to a screen but renders nothing, so it stays out of `ui/`. Ticket 5
owns everything that renders.

### D2 — Out-of-feature consumers import the Activity **feature barrel**, `@/features/activity`

Not `@/features/activity/data`. TIM-397's barrel says so in its own docstring ("this barrel is what
the OUT-OF-FEATURE triggers consume"), and it re-exports every symbol needed here.

This deliberately differs from `sync.ts`'s existing import of the calendar-sources **sub**-barrel
(`@/features/calendar-sources/data/user-calendars`). That deep import is not a competing convention —
it exists because the calendar-sources *feature* barrel does not re-export `findAll`. Where the
feature barrel carries what the consumer needs, the feature barrel is the import. B-2 (no self-barrel
cycle) is not engaged: it forbids a sublayer importing *its own* feature barrel, and every consumer
here is in a different feature or in `src/app/`.

### D3 — The sync trigger fires after the event write commits, non-blocking, unawaited

In `useSyncCalendars.sync()`, immediately after the `replaceAll(rows)` try/catch resolves successfully
and **before** the name-convergence block:

```ts
void refreshNewestPage({ force: true })
```

Three properties, each load-bearing:

- **After event storage, not after the whole sync.** The spec says "after event storage succeeds". Name
  convergence is a deliberately separate failure domain in that function; hanging the Activity trigger
  behind it would suppress Activity whenever a name write throws.
- **Unawaited.** `sync()` sets `isSyncing` for its whole body. Awaiting the Activity refresh would hold
  the calendar's spinner open on an unrelated network call.
- **No `try`/`catch`, no `.catch()`.** `refreshNewestPage` never rejects (TIM-397 D11), so there is no
  rejection to swallow and a `catch` would be dead code implying otherwise. This *is* the mechanism
  behind the epic's "a calendar-sync success is never converted into a failure": the caller never sees
  a throwable and never reads the outcome. A `{ status: "failed" }` outcome is not a sync failure and
  must not touch `isError`.

Not fired when the token list is empty (that path returns before the request) and not fired when
`replaceAll` throws.

### D4 — Push triggers Activity beside the sync, not after it, gated on the same relevance test

`useNotificationTapRouting` today calls `void sync()` from three entrypoints. This change adds a
second, independent `void refreshNewestPage({ force: true })` at each of them — never chained onto the
sync's promise. Architecture decision 7 is explicit about why: "Notification receipt requests calendar
sync and Activity refresh independently… This preserves the push guarantee even if the event sync call
itself fails." When the sync also succeeds, its own post-storage refresh collapses into the same
in-flight request.

Relevance is `data.action ∈ { calendar_changed, calendar_digest }` — the check the foreground handler
already inlines, extracted into one predicate now used by all three entrypoints. Two consequences worth
stating:

- Gate the Activity refresh on the **action**, not on `parseNotificationRoute(message) !== null`. A
  `calendar_changed` with a malformed `payload` parses to `null` but is still a real calendar change;
  routing correctly declines to navigate, and Activity must still refresh.
- `routeTap`'s existing unconditional `void sync()` stays unconditional. Narrowing it would be a
  routing-behavior change, which is out of scope and a sensitive surface.

### D5 — Foreground fires only on a `background → active` transition

Reuse `OtaUpdateRuntime`'s idiom exactly: a `backgroundedRef` set on `"background"`, and a refresh only
when the next `"active"` finds that flag set. iOS raises `inactive → active` for a notification-shade
pull, a control-centre swipe and an incoming call; those are not returns to the app and must not spend a
request.

The refresh is **passive** (`refreshNewestPage()`, no `force`) — the coordinator answers `fresh` inside
the five-minute window without issuing anything. Failure is silent: there is no screen guaranteed to be
mounted at a foreground boundary.

Cold start is *not* a foreground transition (no preceding `"background"`), which is correct and is why
D8 is a separate decision rather than an accident.

### D6 — Screen open is a hook Ticket 6 owns and Ticket 5 mounts

`useActivityScreenRefresh(): { outcome, isRefreshing, refresh }`.

- On mount, once, it fires a **passive** refresh — the five-minute rule.
- `refresh()` fires a **forced** one: the screen's pull-to-refresh row of the trigger table.
- `outcome` is the last `ActivityRefreshOutcome`, so the screen can show a visible failure. It is the
  screen's job to keep cached content visible underneath; the hook deletes nothing and returns the
  coordinator's outcome verbatim.

The split follows the ticket boundary: Ticket 6 owns *when* a refresh is asked for, Ticket 5 owns what
the student sees. Putting both trigger rows in one hook is also what makes every row of the trigger
table provable here, in Ticket 6, where the acceptance criterion sits — Ticket 5 can then wire a
`RefreshControl` without re-deciding policy. `loadOlderPage` is not wrapped: backfill is screen-driven
pagination, which is Ticket 5's.

### D7 — Activity observes the held-calendar set shrinking; calendar-sources never imports Activity

"Calendar is removed → delete its Activity rows from SQLite immediately" (Mobile state behavior) needs a
`pruneToHeldCalendars` call. The obvious place is the removal call site — `useUserCalendarActions.remove`
in `calendar-sources/data/`, or its only caller `calendar-sources/ui/user-calendars-screen.tsx`. **Both
are rejected.**

`activity/data/request.ts` imports `@/features/calendar-sources/data`. An import of `@/features/activity`
from `calendar-sources/data` therefore closes a **module require cycle**, whose failure mode under Metro
is a binding that is `undefined` at module-init time — invisible to `tsc`, invisible to lint, and
dependent on import order. The `ui/` variant does not close a file-level cycle, but it inverts the
feature-level edge that architecture decision 6 draws (`activity data → calendar-sources data`, with
calendar-sources a leaf), and it only covers the one call site that exists today.

Instead, `useActivityOwnershipPrune()` lives in the Activity feature, is mounted once in the root layout,
and reads the calendar-sources live query it is already allowed to read:

1. Read `useUserCalendars()` and `useUserCalendarsLoaded()` from `@/features/calendar-sources/data`.
2. Do nothing until loaded, and do nothing on the **first** loaded observation — record it.
3. On any later loaded observation where an id present in the previous observation is **absent** now,
   call `pruneToHeldCalendars(currentIds)` and record the new observation.

Step 2 is the whole safety argument, and it is what makes this *not* the speculative `findAll()` TIM-397
forbids. The forbidden read is one that cannot distinguish an empty device from a read that raced the
sources table. Here the empty set is only ever acted on as the *second* term of an observed transition
from a non-empty loaded set — which is a removal event, observed rather than assumed. A first render
that yields `[]` before the query settles is gated out by `useUserCalendarsLoaded`, and even if it were
not, it is the first observation and step 2 discards it.

Ids are taken from every held row, never filtered on `visible` — hiding a calendar is a display
preference, and dropping a hidden id would delete that calendar's whole history the first time a student
hides it.

A `pruneToHeldCalendars` throw is caught and recorded through `@/firebase` (`"activity/prune"`); it is
the one consumed operation that *can* reject.

To make the cycle rule enforceable rather than aspirational, add one `no-restricted-imports` entry —
the existing seam-ban idiom — banning `@/features/activity*` inside `src/features/calendar-sources/**`.
Cheap, precise, and it fails loudly at the exact edge whose failure mode is otherwise silent.

### D8 — Cold launch adds no code; it is a test

The trigger table's cold-launch row reads "startup calendar sync causes the post-sync refresh". `useStartupSync`
already fires `sync()` once at mount, and D3 hangs the Activity refresh off that sync's success. So cold launch
is discharged by asserting it, not by adding a second startup path.

The honest consequence, recorded rather than papered over: on an **offline** cold launch the sync fails, so no
Activity refresh happens at launch. Activity then becomes current at the next screen open, the next foreground
return, the next push, or the next successful sync. That is what the trigger table prescribes — the table gives
cold launch no independent row — and shipping an extra unconditional startup refresh would spend a request on
every cold launch for every student, which is the capacity posture this epic exists to avoid.

### D9 — Overlap is proven by counting requests at the mutator, not by reasoning about the slots

The acceptance criterion "overlapping triggers produce exactly one newest-page request" is a property of the
*wiring*, so it is proven at the wiring level: one integration test that mounts the real sync hook, the real
tap-routing hook and the real lifecycle hooks over a mocked `customFetch`, fires notification + sync +
screen-open + foreground into the same tick, and asserts exactly one `POST /v1/calendar-logs/search`.

Ticket 4's `coordinator.test.ts` already proves the slot logic in isolation; that is not this criterion. A
regression this test catches and that one cannot: a trigger that reaches for the generated client, a second
`QueryClient`-backed path, or an `await` inserted between two of these calls that serialises them into two
requests.

## Risks

- **Duplicate requests through a non-collapsing path.** Any future trigger that bypasses
  `@/features/activity` reintroduces the capacity risk. Mitigations: TIM-397's lint ban on the generated
  calendar-log client outside `activity/data/**`, plus D9's counting test.
- **A silent require cycle** if a later change wires Activity from `calendar-sources/data`. Mitigated by
  D7's lint entry.
- **Push routing regression.** Mitigated by leaving every existing routing test unedited (task 6.4) — an
  edit to one of them is the signal that behavior changed.
- **`refreshNewestPage` becoming rejectable.** D3's no-catch posture is safe only while the contract holds.
  It is stated in the ADR and asserted in TIM-397's own tests; if a future change makes it reject, the sync
  path is where the damage lands.
- **Rebase.** This change cannot compile before #324 merges, and shares three doc files with it.

## Rejected alternatives

- **Wire the prune at the removal call site** (`actions.ts` or `user-calendars-screen.tsx`) — D7. Rejected
  for the require cycle / inverted edge.
- **Gate the push refresh on `parseNotificationRoute() !== null`** — D4. Rejected: it would drop a real
  calendar change whose payload failed to decode.
- **An unconditional cold-launch Activity refresh** — D8. Rejected: one extra request per launch per
  student, for a case the table assigns to the startup sync.
- **A new `runtime/` sublayer** — D1. Rejected: B-1 is sublayer-scoped, so the new sublayer would be
  banned from `@/db` and would need eslint surgery for no gain.
- **Awaiting the Activity refresh inside `sync()`** so its outcome could be logged. Rejected: it extends
  `isSyncing` across an unrelated request and puts an Activity failure on the calendar's critical path.
