# Tasks — Event checklists (Phase 05 Ship B)

Ordered, apply-ready. The 4th-table data layer + the unified-details surfacing are the
load-bearing work; do the ADR + schema first (they gate everything), then the data layer (with
its full write-path test plan incl. the restart-sim), then the UI, then i18n/a11y/docs.

## 1. ADR + schema decision (do first — gates the data design)

- [x] Write **ADR 024** under `.claude/rules/mobile/decisions/024-event-checklist-storage-and-surfacing.md`
  (copy `TEMPLATE.md`): record (a) the `checklist_items` verbatim schema + TEXT-ISO-UTC + the
  `eventUid` soft-ref-no-FK + the **hard-delete-not-soft finding** (the brief's premise corrected
  against the Flutter code; `deletedAt` kept for importer fidelity only), and (b) the
  **unified-event-details surfacing** decision (one screen for both kinds, `eventRoute` flipped,
  the Edit header action for personal events) with the rejected alternatives (bolt-onto-form /
  synced-only). Status Accepted; full Context/Decision/Consequences/Revisit-if.
- [x] Add the **ADR 024 row** to `.claude/rules/mobile/decisions/README.md` index.

## 2. The 4th Drizzle table + migration (committed, fresh-clone-no-codegen)

- [x] Add `checklistItems = sqliteTable("checklist_items", …)` to `mobile/src/db/schema.ts`
  with the D1 columns (`uuid` PK, `eventUid` notNull, `content` notNull, `isChecked`
  `mode:"boolean"` notNull, `order` integer notNull, `createdAt`/`updatedAt`/`deletedAt` nullable
  TEXT) + a header comment mirroring the existing tables (verbatim-importer-fidelity rationale,
  the soft-ref-no-FK note, the hard-delete-not-soft note, the nullable-dates note).
- [x] Re-export `checklistItems` and add **`asc`** (from `drizzle-orm`) to
  `mobile/src/db/index.ts` (the only new operator — the ordered read; R-2).
- [x] Run `npm run generate:migrations` in `mobile/` (driver `expo`) → produces `0003_*.sql`
  (`CREATE TABLE checklist_items …`), `0003_snapshot.json`, a 4th `meta/_journal.json` entry, and
  an updated `migrations.js` (now importing `m0000`..`m0003`). **Commit all of them** (a fresh
  clone has the migration without codegen). Confirm `migrations.d.ts` is unchanged (stable shape).
- [x] Confirm `mobile/src/db/migrate.test.ts` still passes — the runner applies all FOUR
  migrations against the mocked migrator with the committed bundle; no test change beyond the
  bundle assertion if it counts entries.

## 3. The `data/` layer — `src/features/event-checklists/data/` (90%-gated)

- [x] `types.ts` — the `ChecklistItem` domain type (`uuid`, `eventUid`, `content`,
  `isChecked: boolean`, `order: number`, `createdAt/updatedAt/deletedAt: Date | undefined`) + the
  pure `rowToChecklistItem` / `checklistItemToRow` mappers: ISO TEXT ↔ Date (normalizing every
  write to canonical UTC via `toISOString()`), null↔undefined for the three dates, bool↔0/1. Pure
  (no db, no React, no `t()`).
- [x] `id.ts` — `newId()` over `expo-crypto` `randomUUID` (the single swappable uid site; the
  importer bypasses it by supplying its own uuid). Mirror `user-calendars/id.ts`.
- [x] `repository.ts` — async functions over `@/db` (the ONLY `@/db` import site for
  `checklist_items`, B-1): `findByEvent(eventUid)` (`where eq(eventUid)` ordered `asc(order)`, **no
  deletedAt filter** — D2), `add(item)` (insert), `setContent(uuid, content)` /
  `setChecked(uuid, isChecked)` (UPDATE the one column + `updatedAt`), `reorder(items)` (re-number
  `order = i+1` in ONE `db.transaction` — D7), `remove(uuid)` (hard DELETE — D2).
- [x] `hooks.ts` — `useChecklist(eventUid)` (reactive `useLiveQuery` over `where eq(eventUid)`
  ordered `asc(order)`, row→domain mapped) + `useChecklistActions(eventUid)` (wraps the repository
  writes: computes `order = items.length + 1` on add, runs each write in try/catch →
  `recordError(error, "event-checklists/<action>")` + a `failed` flag; the remove path calls
  `reorder(remaining)` after; returns `{ add, setContent, setChecked, moveUp, moveDown, remove,
  failed }`, where `moveUp`/`moveDown` compute the swapped order and call `reorder`).
- [x] `index.ts` — the sub-barrel re-exporting the public surface; a feature `index.ts` barrel.

## 4. The `data/` test plan (the irreplaceable-data correctness floor)

- [x] `types.test.ts` — mapper round-trip (row→domain→row identity), canonical-UTC normalization
  of a write, null↔undefined dates, bool↔0/1, **importer-fidelity verbatim** (a `toMap()`-shaped
  row maps with no value change).
- [x] `repository.test.ts` — `jest.mock("@/db")` query-builder spy: assert each function issues
  the expected Drizzle shape (the ordered `eq` read, the insert, the column UPDATE, the
  transactional re-number, the hard DELETE) and maps rows→domain via the real mappers.
- [x] `hooks.test.ts` — the actions hook: add computes `length+1` order; a thrown write →
  `recordError` + `failed=true`; remove → delete then re-number; move-up/down compute the right
  swapped order.
- [x] **Write/read-back + restart-simulation** — a stateful Map-backed `@/db` fake (the
  `user_calendars`/`calendar_events` precedent): write items via the repository, then a FRESH
  repository module reads them back in `order`; and a checklist read by a uid **survives a
  simulated `calendar_events` `replaceAll`** (the soft-ref-no-FK survival property — D1).
- [x] Confirm the K-3 90% gate is green for `event-checklists/data/**`.

## 5. The unified event-details read + the surfacing change (D4)

- [x] Widen `calendar/data/event-details.ts` `useEventDetails(uid)` / `getByUid(uid)` to resolve
  **either** a `calendar_events` row (synced) **or** a `personal_events` row (personal) for the
  uid, returning a discriminated `EventDetails` (`kind: "synced" | "personal"`; the personal
  branch fills `groupColor = color`, empty tags/teachers, `userCalendarId = ""`). Reactive over
  `useLiveQuery` for both. Keep the existing rich synced read intact.
- [x] Change `calendar/data/routes.ts` `eventRoute(uid, userCalendarId)` to return
  `/event-details/<uid>` for **BOTH** kinds (the one-helper flip) — personal events now open the
  details screen. Update its test.
- [x] Update the tap-routing tests in `calendar/ui/calendar-screen.test.tsx`,
  `agenda-list` (via the screen test), and `home/ui/home-screen.test.tsx` to assert a personal
  event tap now routes to `/event-details/<uid>`.

## 6. The event-details screen: checklist section + the Edit header action (70% floor)

- [x] In `calendar/ui/event-details-screen.tsx`: render the shared title/date/lines/footer for
  BOTH kinds; mount the checklist section (the `event-checklists/ui` component) keyed on
  `event.id` for BOTH kinds. Keep the synced-only **hide/un-hide** header action; ADD an
  **Edit** header action shown ONLY for `kind === "personal"` that pushes
  `/personal-event-form?uid=<uid>` (origin-keyed header actions, mirroring the body).
- [x] Update `event-details-screen.test.tsx`: the checklist renders for a synced AND a personal
  event; the Edit action shows only for personal + routes to the form; the hide action stays
  synced-only.

## 7. The interactive checklist UI — `src/features/event-checklists/ui/event-checklist.tsx`

- [x] `event-checklist.tsx` (presentational, 70% floor): reads `useChecklist(eventUid)` +
  `useChecklistActions(eventUid)`; renders the ordered items, each a **checkbox** + an inline
  RN-core `TextInput` (content, `onChangeText` → `setContent`, never `allowFontScaling={false}`)
  + **move-up / move-down** controls (disabled at the ends — D5) + a **remove (×)** control; an
  **"Add note"** button appends a blank item and **auto-focuses** it (D6 — a `ref` to the new
  last row's input, `.focus()` after the add resolves); an accessible **empty** state; the
  `failed`-flag accessible error surface (polite live region + alert role — D8).
- [x] `index.ts` sub-barrel; ensure the feature barrel re-exports the `ui` + `data` surfaces the
  details screen needs (mind B-2 — the screen imports the sibling sub-barrels, not the feature's
  own barrel from within the feature; the *calendar* screen imports the event-checklists feature
  barrel by full `@/` path — a legitimate cross-feature edge).
- [x] `event-checklist.test.tsx` (colocated, in `ui/`): renders through real theme + i18n; add →
  new item appears + focus wiring; toggle → `setChecked`; edit → `setContent`; move-up/down →
  reorder; remove → delete; empty state; the failure surface.

## 8. i18n (flat typed keys, FR + EN parity)

- [x] Add flat keys to BOTH `mobile/src/i18n/locales/en.json` and `fr.json` (parity is
  `tsc`-enforced both directions): `eventChecklist.title`, `eventChecklist.add`,
  `eventChecklist.addLabel`, `eventChecklist.empty`, `eventChecklist.item.label`,
  `eventChecklist.item.checkLabel`, `eventChecklist.item.contentLabel`,
  `eventChecklist.item.removeLabel`, `eventChecklist.item.moveUpLabel`,
  `eventChecklist.item.moveDownLabel`, `eventChecklist.error.writeFailed`,
  `eventDetails.edit.action`, `eventDetails.edit.actionLabel`. No literal user-facing strings
  (lint-enforced); date/time values come from the existing formatters, not catalog keys.

## 9. E2E + docs

- [x] `mobile/.maestro/event-checklists.yaml` — launch dev variant, deep-link to a reachable
  event-details route, assert the checklist section renders (the add button + empty state). The
  populated add/toggle round-trip is seeded-data-limited (no seeded synced event reachable by
  deep link — the same limitation the calendar/event-details flows record); recorded in the file.
- [x] Update `.claude/rules/mobile/storage.md` — a "Checklist items store" section (the 4th
  table, the verbatim schema, the soft-ref-no-FK, the hard-delete-not-soft, the `data/` layer,
  what CI proves vs. on-device).
- [x] Update `.claude/rules/mobile/calendar.md` — the "Event details (read-only)" section becomes
  "Event details" (the edit half landed): the unified-both-kinds surface, the checklist section,
  the Edit action, the `eventRoute` flip; move the checklist out of the deferral list.
- [x] Update `.claude/rules/mobile/features.md` — a "Event checklists" entry + update the
  Personal-events + Calendar entries (the tap-routing change + the Edit action).
- [x] Update `.claude/rules/mobile/firebase.md` if it enumerates `recordError` call sites (add
  `event-checklists/<action>`).
- [x] Append a `.claude/rules/mobile/architecture-changelog.md` entry (date · slug · what moved ·
  why · pointers → storage.md/calendar.md/features.md + ADR 024).
- [x] Write the on-device inbox note
  `docs/react-native-migration/inbox/2026-06-16-event-checklists-on-device.md` (HUMAN — the real
  on-disk SQLite survival of `checklist_items` across restart/kill, the auto-focus keyboard-raise
  feel, the reorder + VoiceOver/TalkBack pass, the checklist survives a real sync drop+replace).
  Discharge / cross-reference the deferral note
  `docs/react-native-migration/inbox/2026-06-16-event-details-deferrals.md` (the checklist half is
  now landed; the hide-event half landed in Ship A).

## 10. Local verification (must be green)

- [x] `npx tsc --noEmit` clean in `mobile/`.
- [x] `npm run lint` clean (`--max-warnings 0`) in `mobile/`.
- [x] `npm test` green in `mobile/`; `npm test -- --coverage` clears the K-3 gate
  (`event-checklists/data/**` ≥ 90%, the screens ≥ 70%).
- [x] `npm run generate:migrations` is idempotent (re-running produces no diff — the bundle is
  committed and stable).

## 11. CI proof + DoD

- [x] The `test-mobile` job (gen-drift, tsc, lint, Jest+coverage) is the runtime proof: the
  mappers + repository query shapes + the actions hook + the write/read-back + restart-sim +
  `migrate.test.ts` all green in CI (the irreplaceable-data correctness floor, R-1). On-disk
  SQLite survival, the reorder atomicity after a mid-write kill, the auto-focus feel, and the
  manual screen-reader pass are the inboxed on-device DoD axis.
- [x] Run the full DoD checklist (`.claude/rules/mobile/definition-of-done.md`) — every axis ✅
  or ➖+reason (Observability ✅ wired; Product analytics ➖ deferred to the analytics-taxonomy
  step with the firing point recorded; Performance ➖ bounded list, folds into the calendar
  on-device pass).
