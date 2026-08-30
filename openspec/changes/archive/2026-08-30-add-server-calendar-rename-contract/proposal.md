## Why

The calendar naming and manual-import epic
(`docs/react-native-migration/05-tech-specs/calendar-naming-and-manual-import.md`, Ticket 1) needs
three server contracts before any React Native screen can be built. None of them exists today:

1. **`name` is optional in the DTO but not in the database.** `CreateCalendarDto.name` is
   `@IsOptional()`, yet `calendar."name"` is `character varying NOT NULL` with **no default**
   (`1660316168685-FirstMigration.ts`), and `CalendarSyncService.createCalendar` passes the raw
   value straight through. Omitting `name` therefore violates the not-null constraint instead of
   storing an empty name. The epic requires a student to be able to skip the programme step, so
   optionality has to become real — `(name ?? "").trim()` before persistence.
2. **There is no way to rename a calendar.** The only calendar-name write is creation. The epic's
   Rename feature (Ticket 3) needs a token-authorized mutation that is shared by every installation
   holding the same calendar token.
3. **Support reports carry no programme context.** `POST /contact` accepts the legacy Flutter
   `gradeName` only. React Native needs to attach the normalized programme name to a failed-import
   report without either client having to copy one field into the other.

Production data (444,028 calendars, 77,025 distinct names, 80,685 empty and 119,511
whitespace-only, plus names longer than the new limit) means the new 100-character rule can only
apply to **new writes**. Existing rows stay untouched and keep rendering; the client derives a safe
display label at read time. No migration and no backfill.

This change is Ticket 1 of the epic. Tickets 2 and 3 consume the generated client it produces and
must not regenerate it.

## What Changes

- **Create normalizes the name.** `CreateCalendarDto.name` stays optional but is trimmed at the
  validation boundary and rejected when the normalized value exceeds 100 characters.
  `CalendarSyncService.createCalendar` persists `(name ?? "").trim()`, so a create without `name`
  stores and returns `""` instead of failing the not-null constraint. Existing Flutter-shaped
  payloads keep working unchanged.
- **New `PATCH /v1/calendars/:token`.** A token-authorized rename returning `200` with
  `CalendarForPublic`. `name` is required and must be a string; the server trims it, accepts an
  empty result, and rejects a normalized value over 100 characters. An unknown token returns `404`
  revealing no calendar data. The rename bumps ordinary entity metadata (`updatedAt`) but **never**
  `lastUpdatedAt`, which means "last successful upstream refresh". Duplicate names are accepted;
  last write wins.
- **Additive `calendarName` on contact.** `SendMessageDto` gains an optional `calendarName`,
  forwarded to Crisp as its own metadata key. The legacy optional `gradeName` stays accepted and
  forwarded independently — neither field is derived from the other, and the existing
  empty-value/redaction behaviour is unchanged.
- **Contract regeneration.** `openapi/openapi.json` is regenerated from the server decorators, then
  `mobile/src/api/generated/` is regenerated from that spec with Orval. Both are generated
  artifacts and are never hand-edited.
- **NOT changed:** no NestJS global API versioning and no move of the existing unversioned
  `GET /calendars/by-token/:token`, `POST /calendars` or `POST /calendars/sync`; no auth,
  ownership, token rotation or endpoint-specific rate limiting; no database migration and no
  production backfill; no removal of `gradeName`; no `app/` (Flutter) file, including generated
  Dart output; no React Native UI consuming these contracts.

## Capabilities

### New Capabilities

- `server-calendar-naming`: how the server stores, normalizes, validates and mutates a calendar's
  user-facing name — optional-but-normalized creation, the token-authorized rename mutation and its
  `lastUpdatedAt` preservation, and the shared 100-character limit that applies to new writes only.

### Modified Capabilities

- `server-contact-submission`: the privacy-bounded Crisp metadata set gains an optional
  `calendarName` field, forwarded independently of the legacy `gradeName`.

## Impact

- **Code (server):** `modules/calendar-sync/models/dto/create-calendar.dto.ts` (trim + max length),
  `modules/calendar-sync/services/calendar-sync.service.ts` (persist the normalized name),
  new `modules/calendar/helpers/calendar-name.ts` (shared constant + normalizer), new
  `modules/calendar/models/dto/update-calendar.dto.ts`, new
  `modules/calendar/controllers/calendar-v1.controller.ts` (`PATCH /v1/calendars/:token`),
  `modules/calendar/services/calendar.service.ts` (`renameCalendar`),
  `modules/calendar/calendar.module.ts` (register the new controller),
  `modules/contact/models/dto/send-message.dto.ts` and
  `modules/contact/services/contact.service.ts` (`calendarName`).
- **Contract (sensitive):** `openapi/openapi.json` gains the `/v1/calendars/{token}` path and an
  `UpdateCalendarDto` schema, plus the `calendarName` property on `SendMessageDto`.
  `mobile/src/api/generated/` gains the matching mutation hook and model. Both are regenerated,
  never hand-edited; CI fails on drift in either direction.
- **Tests:** the create and rename HTTP surfaces (`calendar-sync.controller.test.ts`, a new
  `calendar-v1.controller.test.ts`), the rename service behaviour including the `lastUpdatedAt`
  invariant (`calendar.service.test.ts`), create normalization at the service level
  (`calendar-sync.service.test.ts`), and contact forwarding (`contact.controller.test.ts`).
- **Docs:** `docs/mobile/architecture-book/data.md` records the one path-level `/v1` route now in
  the committed contract. The epic's ADR for token-shared rename and eventual name convergence is
  Ticket 4's deliverable, not this change's.
- **Dependencies / schema / native:** none. No migration, no new package.
- **Risk:** the contract is a sensitive surface consumed by Flutter, web and React Native — every
  change here is additive, and the Flutter-shaped create/contact payloads are covered by explicit
  regression tests. Anyone holding a calendar token can rename globally; that is the epic's
  deliberate capability model (no ownership), recorded in the design.
