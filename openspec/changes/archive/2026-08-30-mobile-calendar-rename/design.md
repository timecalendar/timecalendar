# Design — mobile calendar rename and name convergence

Canonical spec: `docs/react-native-migration/05-tech-specs/calendar-naming-and-manual-import.md`
(Ticket 3, lines 439–455; architecture decisions 5 and 6; the Rename journey; the Error-behavior
table). Investigation: TIM-274. Server contract: TIM-390, merged as PR #313.

## What already exists (verified on this branch)

| Thing | Where | State |
| --- | --- | --- |
| `PATCH /v1/calendars/:token` | `mobile/src/api/generated/calendars/calendars.ts:288` | `useCalendarV1ControllerRenameCalendar`, args `{ token, data: UpdateCalendarDto }`, returns `CalendarForPublic` |
| `UpdateCalendarDto` | `timeCalendar.schemas.ts:55` | `{ name: string }`, `@maxLength 100` |
| Sync returns metadata | `timeCalendar.schemas.ts` `CalendarWithContent` | `{ calendar: CalendarForPublic, events: [] }` — the names are **already on the wire**, no contract change |
| Cross-platform `MenuView` | `@/components/chrome` → `@expo/ui/community/menu` | Already used on **Android** in `calendar-view-menu.tsx` |
| Narrow single-column write precedent | `repository.ts` `setVisible(id, visible)` | The shape `updateName` copies |
| The `visible: true` trap | `types.ts:81` `fromCalendarForPublic` | Hard-codes `visible: true` |

No new dependency, no new Drizzle table, no migration.

## Decision 1 — The sync path writes names through `updateName`, never `upsert`

**Decision.** After the existing `replaceAll(rows)` transaction, the orchestrator diffs the returned
`calendar.name` values against the `findAllUserCalendars()` snapshot it already read at the top of
`sync()`, and calls `updateName(id, name)` for **only the calendars whose name actually changed**.

**Why.** `fromCalendarForPublic` sets `visible: true` unconditionally (it is a client-only field, not
on the DTO). Any `upsert` on the sync path therefore silently unhides every calendar the student
hid — on every sync, which is at every app start. A student who hides a calendar would watch it come
back and have no idea why. `updateName` is a one-column `UPDATE ... WHERE id = ?`; it cannot touch
`visible`, `createdAt`, or `token`.

The diff is not just an optimization: it makes "a sync that changed no name performs no write" a
directly assertable scenario, and it keeps the steady-state sync at zero extra writes.

**Rejected.** `upsert(fromCalendarForPublic(dto))` — one line, reuses an existing mapper, and is
exactly the bug the canonical spec calls out. A "fix" that reads the local row first and re-injects
its `visible` re-derives `updateName` the long way round while still writing every column.

## Decision 2 — Rename persists the server's returned name, not the typed input

**Decision.** `useRenameCalendar` sends `data: { name: trimmed }`, awaits the `CalendarForPublic`
response, and writes `updateName(id, response.name)`.

**Why.** The server owns normalization (it trims, and accepts an empty result as a valid cleared
name). Persisting the typed string means the renaming device holds one value and every other device
converges on a possibly different one at its next sync — the two would look identical in the common
case and diverge exactly where normalization bites. Echoing the response makes the renaming device
converge through the same rule as everyone else.

## Decision 3 — Event replace and name write-back are two failure domains, and a name-write failure is recorded

**Decision.** A `updateName` failure on the sync path is caught, does **not** roll back or discard
the successful event replace, is reported through `recordUnknownError(error, "calendar/sync-names")`,
and flips the orchestrator's existing `isError`. The previous local name stays; the next sync retries.

**Why.** The canonical spec (decision 5) forbids a cross-feature transaction here — the events are
the valuable payload and must land even if the metadata write fails. But the committed
`mobile-calendar-sync` requirement *"Sync failure observability distinguishes recoverable fetch
failure from a local write failure"* is explicit that a **local SQLite write failure is
crash-worthy** and goes to `recordError`, unlike a fetch rejection. A name write is a local SQLite
write. Both rules are satisfiable at once: record it *and* keep the events.

Flipping `isError` is the honest signal — the sync genuinely did not fully converge — and it costs
the user nothing, because the events they came for are already on screen and the banner is
dismissible/recoverable. The alternative (swallow it silently) would make a permanently failing
metadata write invisible forever, which is precisely the class the `recordError` split exists to
catch.

**Note for the Applier.** Do this in its own `try`/`catch`, *after* the existing
`replaceAll` catch block — not inside it. Folding the name write into the existing block would make
a name failure abort the function before the events are considered committed and would mis-bucket
the error under `"calendar/sync"`.

## Decision 4 — One controlled `Modal` dialog, not `Alert.prompt`

**Decision.** A new `rename-calendar-dialog.tsx`: RN `Modal` (`transparent`, `animationType="fade"`,
`onRequestClose` for Android back), a controlled `TextInput`, and an explicit
`idle | pending | error` state the dialog owns. It closes only on a resolved success or an explicit
cancel.

**Why.** `Alert.prompt` is iOS-only, dismisses itself the moment a button is pressed, and cannot be
re-shown with the user's text intact — so an offline rename would discard what they typed, which the
Error-behavior table forbids ("keep the dialog/input open, preserve the old local name, offer
retry/cancel"). A controlled dialog also gives both platforms the same validation, the same
accessibility surface, and one test surface reachable without gesture simulation.

**Controlled-input caution.** The dialog's `TextInput` value is **local React state seeded once from
the calendar name** — never a `useLiveQuery` value. A controlled input whose `value` round-trips
through an async SQLite write drops non-adjacent characters under fast typing (TIM-268 found exactly
this on the checklist input, and Maestro types fast enough to hit it every run). Seed on open, keep
it local, write once on success.

**Validation.** `trim(input).length > 100` blocks Save and shows inline text. An empty result is
**valid** — an empty name is legal and renders as the fallback. Do not block it.

## Decision 5 — The overflow menu, and what Android needs

`MenuView` does not open itself on Android. `CalendarAndroidViewMenu` shows the working idiom: a
`ref`, a child `Pressable` whose `onPress` calls `menuRef.current?.show()`, and
`accessibilityActions={[{ name: "activate" }]}` + `onAccessibilityAction` so TalkBack can open it
without a gesture. iOS opens on press natively and needs no ref. Reuse that idiom verbatim rather
than inventing a second one.

The trigger keeps the existing `testID={`user-calendar-actions-${id}`}` and its
`accessibilityLabel={t("userCalendars.actions", { name })}` — both already exist on the iOS branch,
so making them cross-platform is a widening, not a new selector.

## Decision 6 — The effective-name fallback changes an existing translation value

`userCalendars.namePlaceholder` is today "Calendar" / "Calendrier". The canonical spec mandates
"My timetable" / "Mon emploi du temps". Change the **value** of the existing key rather than adding a
new one: TIM-391 is in flight on the same i18n files and also applies this fallback, so a new key
invites two competing fallback keys and an FR/EN parity divergence. A value edit is additive-free and
conflict-free.

The rule lives in one pure helper so it cannot drift between the row and the dialog:

```ts
// features/calendar-sources/data/effective-name.ts
export function effectiveCalendarName(stored: string, fallback: string): string {
  return stored.trim() || fallback
}
```

Note today's `calendar.name || t(...)` is **not** equivalent — it passes whitespace-only names
straight through to the UI, which is the exact production case TIM-274 measured.

## Decision 7 — A dedicated E2E calendar, and what the flow actually proves

**Decision.** Seed a second calendar (`E2E_RENAME_CALENDAR_TOKEN = "e2e-rename-calendar"`, fixed id
`e2e0e2e0-0000-4000-8000-000000000002`, baseline name `E2E Rename Baseline`) with its own
`rename-seed.yaml` preamble, and a `user-calendar-rename.yaml` flow.

**Why not reuse `e2e-smoke-calendar`.** A rename is a durable server mutation. Renaming the smoke
calendar changes shared state for eleven other flows in the same run, and `run_e2e.sh` runs the
folder in one device session — a name-dependent assertion anywhere else would start failing for
reasons no one would attribute to the rename flow.

**The round trip must clear state, or it proves nothing.** Asserting the renamed name after a plain
restart only re-reads the local row this device just wrote. The flow instead does:

1. `rename-seed.yaml` (clears state, imports the rename token, syncs) → deep-link `/user-calendars`
2. assert `E2E Rename Baseline` is visible → open the row menu → Rename → type `E2E Renamed
   Timetable` → Save → assert the new name (proves the local write)
3. `rename-seed.yaml` **again** — its leading `launchApp: clearState: true` wipes the device, and the
   re-import resolves the token from the server → deep-link `/user-calendars`
4. assert `E2E Renamed Timetable` — this row's name came from the **server**, on a device that never
   saw the rename. That is the convergence claim.

**Re-run caveat, stated honestly.** Step 2's baseline assertion is only true against a freshly seeded
server. CI re-seeds every run, so it is deterministic there; a *local* re-run without re-running
`ci/e2e-server.sh` will fail at step 2 because the calendar is already renamed. Document it in
`mobile/e2e/README.md` next to the existing UTC-"today" caveat. The alternative — dropping the
baseline assertion to make local re-runs idempotent — would make step 4 vacuous on a re-run, trading
a documented local inconvenience for a silent false green.

### Maestro pitfalls that apply to this flow specifically

- **iOS a11y collapse.** A `text:` selector is a fully-anchored regex, and iOS collapses a pressable
  container into one element exposing only its composed `accessibilityLabel`. The row name renders in
  a `ThemedText` inside a plain `View` (not inside a pressable), so a bare-name `text:` assertion is
  safe here — but the menu **trigger** is a `Pressable` with a composed label, so tap it by
  `id: user-calendar-actions-<id>`, never by text.
- **Menu-item ambiguity.** "Rename" (menu item) and the dialog's title/Save must not collide as
  strings. Give the dialog title a distinct string from the menu action, and tap the dialog's Save by
  `id: user-calendar-rename-save`. Two live elements sharing one a11y string made both `tapOn`s hit
  the first element on iOS in TIM-264 while Android passed on hierarchy-order luck.
- **`- back` is iOS-broken** (reports COMPLETED without popping). Use the suite's
  `stopApp` → `launchApp` → `extendedWaitUntil` re-entry idiom. Do not add a `- back`.
- **Cold-start waits.** Every `extendedWaitUntil` whose preceding top-level command is
  `launchApp`/`openLink` gets `timeout: 60000`, matching the suite.
- The flow is **not** labelled `run-e2e`; native E2E runs on `main`. Land it, do not block the PR on
  an emulator run (no KVM on this host).

## Test surface

Everything below is reachable without gesture simulation, mocking at the mutator seam per
`testing.md`:

| Claim | Where |
| --- | --- |
| Validation, pending, failure, retry, cancel; local state only after success | `rename-calendar-dialog.test.tsx` |
| Menu exposes Rename + Delete identically on both platforms (`Platform.OS` render tests) | `user-calendars-screen.test.tsx` |
| Whitespace/empty name → translated fallback in row **and** dialog | `effective-name.test.ts` + both UI tests |
| Rename writes the **server's** returned name | `rename.test.ts` |
| Sync updates names, preserves `visible`; unchanged name performs no write | `sync.test.tsx` |
| A failed name write keeps last-good data, records, does not discard events | `sync.test.tsx` |
| `updateName` emits a single-column `UPDATE` | `repository.test.ts` |

Coverage: the dialog and screen sit under the 70% presentational floor; `rename.ts`,
`effective-name.ts` and the repository write are logic under the 90% gate.
