# Tasks — mobile calendar rename and name convergence

> **Preconditions (verified on this branch, 2026-08-30).** TIM-390 is merged (`5f14a146`):
> `useCalendarV1ControllerRenameCalendar` and `UpdateCalendarDto` exist in
> `mobile/src/api/generated/`. **Do not regenerate the client or edit `openapi/openapi.json`.**
> No file under `app/` may change. No migration, no production backfill.
>
> Read first: `docs/mobile/architecture-book/` — `calendar.md`, `storage.md`, `data.md`,
> `theming.md`, `i18n.md`, `accessibility.md`, `testing.md`, `features.md`,
> `definition-of-done.md`. And `design.md` here: decisions 1 and 3 are the correctness crux.

## 1. Data layer — the narrow write and the pure helper

- [x] 1.1 Add `updateName(id, name)` to `data/user-calendars/repository.ts` — a single-column
      `db.update(userCalendars).set({ name }).where(eq(userCalendars.id, id))`, mirroring
      `setVisible`. **Not** an `upsert`.
- [x] 1.2 Add `data/calendar-sources/effective-name.ts` exporting the pure
      `effectiveCalendarName(stored, fallback)` = `stored.trim() || fallback`; export from the
      feature barrel.
- [x] 1.3 Tests: `repository.test.ts` asserts the query shape sets only `name` and filters by `id`,
      and that an unknown id resolves without throwing; `effective-name.test.ts` covers empty,
      whitespace-only, padded, and >100-char stored values.
  - Verify: `npm test -- --maxWorkers=4 src/features/calendar-sources/data` in `mobile/`

## 2. Data layer — the rename seam

- [x] 2.1 Add `data/user-calendars/rename.ts` exporting `useRenameCalendar()` in the shape of
      `add-calendar.ts` (`{ rename, isPending, isError, reset }`), wrapping
      `useCalendarV1ControllerRenameCalendar`. It is the ONLY import site of that generated hook
      (B-1). Send `{ token, data: { name: trimmed } }`; on success call
      `updateName(id, response.name)` — **the response's name, not the typed input** (design D2).
- [x] 2.2 Split the failure domains: a rejected request → `isError` only, NOT `recordError`
      (recoverable, mirrors the fetch posture). A rejected `updateName` after a successful response →
      `recordUnknownError(error, "user-calendars/rename")` **and** `isError`.
- [x] 2.3 Export from the `data/user-calendars` and `data` barrels; check for a barrel cycle the way
      `add-calendar.ts:7` documents (import siblings by full `@/` path, never the sub-barrel).
- [x] 2.4 Tests (`rename.test.ts`, mocked at the mutator seam per `testing.md`): success persists the
      **server's** name; a rejected request writes nothing and does not record; a rejected local
      write records; `isPending` spans the whole chain.
  - Verify: `npm test -- --maxWorkers=4 src/features/calendar-sources/data/user-calendars`

## 3. The controlled rename dialog

- [x] 3.1 Add `ui/rename-calendar-dialog.tsx`: RN `Modal` (`transparent`, `animationType="fade"`,
      `onRequestClose` → cancel), themed from `@/theme` (R-3), `accessibilityViewIsModal` on iOS.
      A controlled `TextInput` seeded **once** from `trim(current name)` into **local state** — never
      from a `useLiveQuery` value (design D4: the TIM-268 character-drop pattern).
- [x] 3.2 States `idle | pending | error`: Save disabled while pending or invalid; the entered text
      stays visible in every state; the dialog dismisses only on resolved success or explicit cancel.
      Error state offers Retry and Cancel.
- [x] 3.3 Validation: block when `trim(value).length > 100` with inline text announced to screen
      readers (`accessibilityLiveRegion="assertive"` / `AccessibilityInfo.announceForAccessibility`).
      **Empty and whitespace values are valid** — do not block them.
- [x] 3.4 `testID`s `user-calendar-rename-dialog` / `-input` / `-save` / `-cancel`; input
      `accessibilityLabel` from `userCalendars.rename.label`; placeholder = the effective-name
      fallback; dialog title a string distinct from the menu's "Rename" action (design D7 —
      colliding a11y strings made both `tapOn`s hit one element in TIM-264).
- [x] 3.5 Tests (`rename-calendar-dialog.test.tsx`): 101 chars blocked and no request; exactly 100
      and empty both accepted; failure keeps the dialog + the entered text; Retry reissues; Cancel
      closes and writes nothing; local state changes only after success.
  - Verify: `npm test -- --maxWorkers=4 src/features/calendar-sources/ui/rename-calendar-dialog`

## 4. The overflow menu on both platforms

- [x] 4.1 In `ui/user-calendars-screen.tsx`, replace the `Platform.OS === "ios" ? MenuView : trash
      Pressable` fork in `CalendarRow` with one `MenuView` on both platforms carrying `rename` and
      `delete` (delete keeps `image: "trash"` + `attributes: { destructive: true }`). Delete the
      `TrashAffordance` component and the now-dead `styles.delete`.
- [x] 4.2 Android needs the `calendar-view-menu.tsx` `CalendarAndroidViewMenu` idiom verbatim —
      `MenuComponentRef`, trigger `onPress` → `menuRef.current?.show()`,
      `accessibilityActions={[{ name: "activate" }]}` + `onAccessibilityAction`. iOS opens natively
      and needs no ref. Keep `testID={`user-calendar-actions-${id}`}`, the
      `userCalendars.actions` label, and the ≥44×44 target.
- [x] 4.3 Wire `rename` → open the dialog for that row; `delete` → the existing `confirmDelete`
      (`Alert`, destructive confirm, announce gated on the resolved write) unchanged.
- [x] 4.4 Replace `calendar.name || t("userCalendars.namePlaceholder")` with
      `effectiveCalendarName(calendar.name, t("userCalendars.namePlaceholder"))` — the current `||`
      lets a whitespace-only name through, which is the measured production case (TIM-274).
- [x] 4.5 Tests in `user-calendars-screen.test.tsx`: both `Platform.OS` shapes render one overflow
      trigger and no standalone trash; the captured `onPressAction` for `rename` opens the dialog and
      for `delete` opens the `Alert` (confirm/cancel branches preserved, cancel still asserted
      `style: "cancel"` with no `onPress`); the Android trigger's `onPress` and its `activate`
      accessibility action both call `show()`; a whitespace name renders the fallback.
  - Verify: `npm test -- --maxWorkers=4 src/features/calendar-sources/ui/user-calendars-screen`

## 5. Sync convergence (the correctness crux)

- [x] 5.1 In `features/calendar/data/sync/sync.ts`, after the existing `replaceAll(rows)` try/catch
      succeeds, add a **separate** try/catch that diffs each returned `calendar.calendar.name`
      against the `calendars` snapshot already read at the top of `sync()` and calls
      `updateName(id, name)` for changed names only.
- [x] 5.2 **Do not** `upsert`, and do not route through `fromCalendarForPublic` — it hard-codes
      `visible: true` (`types.ts:81`) and a full-row write would unhide a hidden calendar on every
      sync (design D1). Import `updateName` by its full `@/features/calendar-sources/data/...` path,
      matching the existing `findAllUserCalendars` import.
- [x] 5.3 On failure: keep the committed events, keep the last-good names, call
      `recordUnknownError(error, "calendar/sync-names")` (a context distinct from `"calendar/sync"`),
      set `isError`, and do not throw (design D3).
- [x] 5.4 Tests in `sync.test.tsx`: a changed name calls `updateName`; a hidden calendar keeps
      `visible: false` and **no `upsert` is called anywhere on the sync path**; unchanged names issue
      no write; a rejected `updateName` leaves `replaceAll`'s result committed, records under the
      distinct context, and surfaces `isError`.
  - Verify: `npm test -- --maxWorkers=4 src/features/calendar/data/sync`

## 6. Translations (FR/EN parity)

- [x] 6.1 **Change the value** of `userCalendars.namePlaceholder` to `My timetable` / `Mon emploi du
      temps` (design D6 — a value edit, not a new key; TIM-391 is in flight on these same files).
- [x] 6.2 Add flat keys to both `en.json` and `fr.json`: `userCalendars.rename.action`,
      `.title`, `.label`, `.save`, `.tooLong`, `.error`, `.retry`, `.renamed`.
- [x] 6.3 Verify FR/EN parity and the typed-key surface (`i18next.d.ts`) — the existing i18n parity
      test must stay green.
  - Verify: `npm test -- --maxWorkers=4 src/i18n`

## 7. E2E seed + Maestro flow (land it; do not block the PR on an emulator run)

- [x] 7.1 In `server/src/scripts/seed-e2e-calendar.ts`, export
      `E2E_RENAME_CALENDAR_TOKEN = "e2e-rename-calendar"` and
      `E2E_RENAME_CALENDAR_ID = "e2e0e2e0-0000-4000-8000-000000000002"`, and seed that calendar with
      the ASCII-safe baseline name `E2E Rename Baseline`, a future `syncPlannedAt`, and a minimal
      event set. Re-`save` by fixed id so every `up` resets the name a previous run changed.
- [x] 7.2 Add `mobile/.maestro/rename-seed.yaml` mirroring `import-seed.yaml` for that token
      (leading `launchApp: clearState: true`, `stopApp`, `openLink`, the optional iOS "Open" tap,
      `extendedWaitUntil timeout: 60000`).
- [x] 7.3 Add `mobile/.maestro/user-calendar-rename.yaml` implementing the six steps in
      `specs/mobile-e2e/spec.md`. Tap the menu by `id: user-calendar-actions-<E2E_RENAME_CALENDAR_ID>`
      and Save by `id: user-calendar-rename-save` — never by text. **No `- back`.** Every
      `extendedWaitUntil` following a `launchApp`/`openLink` gets `timeout: 60000`.
- [x] 7.4 Update `mobile/e2e/README.md`: the new flow, and the re-run caveat (the baseline assertion
      needs a freshly seeded server; CI re-seeds every run).
- [x] 7.5 Server-side seed check stays green.
  - Verify: `npm test -- --maxWorkers=4` in `server/` for the seed's own suite, and
    `npx maestro check-syntax mobile/.maestro/user-calendar-rename.yaml mobile/.maestro/rename-seed.yaml`
    if the CLI is available (pinned `MAESTRO_VERSION=2.8.0`).

## 8. Architecture Book + inbox

- [x] 8.1 Update `docs/mobile/architecture-book/features.md` — the user-calendars entry gains the
      overflow menu, the rename dialog, and the sync name-convergence rule (including the
      no-full-upsert constraint, which is the kind of thing only prose can carry — R-1).
- [x] 8.2 Append a dated entry to `docs/mobile/architecture-book/architecture-changelog.md`.
- [x] 8.3 Add a `docs/react-native-migration/inbox/` note tagged `(HUMAN: …)` for the device-only
      checks: Rename/Delete menu and the dialog on real iOS and Android, VoiceOver/TalkBack labels
      and focus order, the error announcement, Dynamic Type, and minimum touch targets. It must not
      block this ticket.

## 9. Local green + archive dry run

- [x] 9.1 `npx tsc --noEmit` and `npm run lint` green in `mobile/`.
- [x] 9.2 `npm test -- --coverage --maxWorkers=4` in `mobile/` — suite green and the coverage gate
      met (note: a ticket-named worktree path makes a bare `jest <module>` pattern match the whole
      suite, hence `--maxWorkers=4` throughout).
- [x] 9.3 **Dry-run the archive early, not at the end**: `npx openspec validate mobile-calendar-rename`
      and a `--no-validate`-free `openspec archive` dry check. Only `archive` validates delta headers,
      and this change uses `REMOVED` + `ADDED` + `MODIFIED` — a header that does not match the live
      spec byte-for-byte fails there and nowhere earlier.
- [x] 9.4 Confirm `git diff --name-only origin/main...HEAD` touches nothing under `app/`, nothing
      under `mobile/src/api/generated/`, and no `openapi/openapi.json`.
