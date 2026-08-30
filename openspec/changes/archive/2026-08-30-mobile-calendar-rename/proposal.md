# Mobile calendar rename and name convergence

## Why

A student's calendar is named by whatever the import produced — in production the dominant value is
the school's *formation* label, and a large share of rows are empty or whitespace (TIM-274). The app
has no way to fix that: "Mes calendriers" lists a name it cannot edit, and a whitespace name renders
as the bare placeholder "Calendar".

TIM-390 landed the server half — `PATCH /v1/calendars/:token` is in the committed OpenAPI and the
generated RN client already exposes `useCalendarV1ControllerRenameCalendar`. This change spends that
contract: one overflow menu per row on both platforms, one shared controlled rename dialog, and name
convergence on the sync path so every installation holding the token lands on the same name.

The token is a capability — possession authorizes rename — so a rename is global. That makes the
convergence half non-optional: without it, the renaming device and every other device holding the
same token disagree forever.

## What Changes

- **One overflow menu on both platforms.** Each row's trailing affordance becomes a `MenuView`
  (the existing `@/components/chrome` seam) carrying **Rename** and **Delete**. Android's standalone
  trash `Pressable` is removed. Android needs the `menuRef.current?.show()` + `accessibilityActions`
  idiom already proven in `calendar-view-menu.tsx`'s `CalendarAndroidViewMenu`; iOS opens the menu
  natively on press.
- **One shared controlled rename dialog** — a React Native `Modal`, not iOS `Alert.prompt` plus a
  separate Android path. It starts from the trimmed current name, validates the 100-character
  normalized maximum locally, and holds pending / failure / retry / cancel **without dismissing**, so
  the user's typing survives an offline save. Local state changes only after the server responds.
- **`PATCH /v1/calendars/:token` from a data-layer seam.** A new `useRenameCalendar()` in
  `data/user-calendars/` wraps the generated mutation (B-1: generated hooks live in `data/` only),
  then persists **the server's returned name**, not the typed input — the server owns normalization,
  so echoing its response is what makes two devices agree.
- **A narrow local write, `updateName(id, name)`** — a single-column `UPDATE`, deliberately not
  `upsert`.
- **Sync convergence.** `POST /calendars/sync` already returns `CalendarForPublic` beside each
  calendar's events. After the existing transactional event replace, the orchestrator writes back
  only the names that actually changed, through `updateName`. It must **not** upsert a full
  `user_calendars` row: `fromCalendarForPublic` hard-codes `visible: true`, so a full upsert would
  silently unhide a calendar the student hid. That is the correctness crux of this change.
- **Effective display name.** `trim(stored)` when non-empty, otherwise the localized fallback — and
  the fallback string becomes **"My timetable" / "Mon emploi du temps"** instead of today's
  "Calendar" / "Calendrier". Applied in the list rows and the dialog.
- **A dedicated E2E calendar + Maestro rename round trip.** Renaming mutates shared server state, so
  the flow gets its own seeded calendar rather than mutating `e2e-smoke-calendar` out from under the
  other eleven flows.

## Capabilities

### Modified Capabilities

- `mobile-user-calendars`: the row's delete affordance becomes an overflow menu carrying Rename and
  Delete on both platforms; the screen gains a rename dialog, the effective-display-name rule, and
  their coverage obligations.
- `mobile-calendar-sync`: the orchestrator applies returned calendar names after the event replace,
  through a narrow name-only write, preserving `visible` and every other local-only field.
- `mobile-e2e`: a rename round-trip flow that proves the server, not just the local row, converged.
- `e2e-server-lifecycle`: the seed gains a second, dedicated token-addressable calendar for that flow.

## Impact

- `mobile/src/features/calendar-sources/data/user-calendars/` — `updateName` in `repository.ts`;
  new `rename.ts` (`useRenameCalendar`); new pure `effective-name.ts`; barrel exports.
- `mobile/src/features/calendar-sources/ui/user-calendars-screen.tsx` — the row's menu replaces the
  iOS-only `MenuView` / Android trash fork; dialog wiring.
- `mobile/src/features/calendar-sources/ui/rename-calendar-dialog.tsx` — new controlled dialog.
- `mobile/src/features/calendar/data/sync/sync.ts` — the name write-back after `replaceAll`.
- `mobile/src/i18n/locales/{en,fr}.json` — rename keys; `userCalendars.namePlaceholder`'s **value**
  changes.
- `server/src/scripts/seed-e2e-calendar.ts` — a second seeded calendar (test-only; no migration, no
  production data).
- `mobile/.maestro/rename-seed.yaml`, `mobile/.maestro/user-calendar-rename.yaml` — new.
- `docs/mobile/architecture-book/features.md` + `architecture-changelog.md` — the rename surface.

## Out of scope

- Per-device aliases, rename history/audit, ownership or permissions beyond token possession,
  duplicate-name detection.
- Transactional coordination between the calendar-source metadata write and the event replace —
  deliberately two failure domains (design D3).
- The onboarding / manual-import journey (TIM-391) and the OpenAPI or RN client regeneration
  (TIM-390, already landed).
- Any change under `app/` (Flutter). No database migration, no production backfill.

## Sensitive surfaces touched

- `mobile/src/api/generated/` — **consumed only**, never regenerated.
- The `@/db` `user_calendars` seam — the `visible`-preservation rule above.
- `mobile/.maestro/` and the E2E seed.

## Pre-existing drift found while scoping (not fixed here)

The committed `mobile-user-calendars` spec requires an **iOS swipe-to-delete** and a **row-level
`accessibilityActions` delete path**. Neither exists in `user-calendars-screen.tsx` — there is no
`Swipeable` and no `accessibilityAction` anywhere in `features/calendar-sources/`. This change
supersedes that requirement with one describing the shape that will actually ship, and states the
gap rather than propagating it. The broader documentation reconciliation is TIM-393's.
