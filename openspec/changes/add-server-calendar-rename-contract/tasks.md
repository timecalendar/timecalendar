## 0. Prerequisites

- [x] 0.1 Start the two dependencies the server test suite and the OpenAPI generator both need,
      from the repository root: `bin/server-compose.sh up -d postgres redis`. If the default ports
      are taken, publish alternates and keep `DATABASE_URL`/`REDIS_URL` in sync on every server
      command (see `docs/agent-dev-environment.md` §4). Never rewrite the shared symlinked `.env`.
- [x] 0.2 Dry-run the archive validation early so a delta-header mistake surfaces now, not behind
      the merge gate: `openspec validate add-server-calendar-rename-contract --strict` (and
      `openspec status`). The change adds one new capability (`server-calendar-naming`, all
      `## ADDED Requirements`) and modifies one existing capability
      (`server-contact-submission`, `## MODIFIED Requirements` repeating the full requirement).

## 1. Shared name normalization (server)

- [x] 1.1 Add `server/src/modules/calendar/helpers/calendar-name.ts` exporting
      `CALENDAR_NAME_MAX_LENGTH = 100`, `normalizeCalendarName(value: unknown): string`
      (`typeof value === "string" ? value.trim() : ""`), and the class-transformer trim used by the
      DTOs (`typeof value === "string" ? value.trim() : value` — non-strings pass through so
      `@IsString()` can reject them; see design D2). Do not coerce non-strings in the DTO transform.
- [x] 1.2 Unit-test the helper (`calendar-name.test.ts`): undefined/null → `""`, whitespace-only →
      `""`, surrounding whitespace trimmed, a non-string passes through the DTO transform
      unchanged, and the exported constant is 100.

## 2. Create normalizes and bounds the name

- [x] 2.1 In `server/src/modules/calendar-sync/models/dto/create-calendar.dto.ts`, keep `name`
      optional and add the trim transform plus `@MaxLength(CALENDAR_NAME_MAX_LENGTH)`. Decorator
      order must leave transform-before-validate intact so the limit measures the trimmed value.
      Do not touch `url`, `schoolId`, `schoolName`, or `customData`.
- [x] 2.2 In `server/src/modules/calendar-sync/services/calendar-sync.service.ts`, persist
      `normalizeCalendarName(name)` instead of the raw `name` when building the calendar passed to
      `sync()`. This is the last line before a NOT NULL column — it must not be skipped because the
      DTO already trims.
- [x] 2.3 Extend `server/src/modules/calendar-sync/services/calendar-sync.service.test.ts`:
      creating **without** `name` persists `""` (this fails today against the not-null column, so
      it is the regression proof), and a name with surrounding whitespace is stored trimmed.
- [x] 2.4 Extend `server/src/modules/calendar-sync/controllers/calendar-sync.controller.test.ts`:
      `POST /calendars` without `name` returns 201 and stores `""`; a 101-character trimmed name
      returns 400 and creates nothing; a 100-character name surrounded by whitespace returns 201
      and stores the trimmed value; the existing Flutter-shaped payload
      (`{ url, schoolName, name }` and the `schoolId` variant) still returns 201 unchanged.

## 3. `PATCH /v1/calendars/:token`

- [x] 3.1 Add `server/src/modules/calendar/models/dto/update-calendar.dto.ts` — `UpdateCalendarDto`
      with a **required** `name: string`: `@IsString()`, the shared trim transform, and
      `@MaxLength(CALENDAR_NAME_MAX_LENGTH)`. No `@IsOptional()`.
- [x] 3.2 Add `renameCalendar(token, name)` to
      `server/src/modules/calendar/services/calendar.service.ts` exactly as designed (D3):
      `findOneByToken` (its `findOneOrFail` produces the 404), then
      `this.repository.update(calendar.id, { name })`, then
      `this.calendarHelper.forPublic({ ...calendar, name })`. **Do not** add a new repository
      method, do not use `save()`, and do not re-read the calendar.
- [x] 3.3 Add `server/src/modules/calendar/controllers/calendar-v1.controller.ts`:
      `@Controller("v1/calendars")` + `@ApiTags("Calendars")`, one `@Patch(":token")` handler
      taking `@Param("token")` and `@Body() UpdateCalendarDto`. Annotate for the contract:
      `@ApiOperation`, `@ApiParam({ name: "token" })`,
      `@ApiOkResponse({ type: CalendarForPublic })`, `@ApiBadRequestResponse`,
      `@ApiNotFoundResponse`. Add **no** logging, metric, or span (design D5).
- [x] 3.4 Register the new controller in `server/src/modules/calendar/calendar.module.ts` next to
      the existing `CalendarController`. Leave `CalendarController` and its unversioned route alone.
- [x] 3.5 Add `server/src/modules/calendar/controllers/calendar-v1.controller.test.ts` (supertest,
      `createTestApp({ imports: [CalendarModule] })`, `calendarFactory`) covering: rename returns
      200 with `CalendarForPublic` carrying the new name; the trimmed value is what is stored;
      renaming to `""` succeeds and clears; missing `name` → 400; non-string `name` → 400; a
      101-character trimmed name → 400 with the stored name unchanged; two calendars renamed to the
      same value both succeed; unknown token → 404 whose body contains no `id`, `token`, `name`,
      `schoolName`, `createdAt` **and** leaves the existing calendar untouched.
- [x] 3.6 Add the `lastUpdatedAt` invariant test (in the controller suite or
      `calendar.service.test.ts`): capture `lastUpdatedAt` and `updatedAt` before the rename, and
      assert afterwards that `lastUpdatedAt` is identical while `updatedAt` advanced, and that the
      200 response's `lastUpdatedAt` is the pre-rename value. This is the guard against a future
      refactor to `save()`.

## 4. Additive `calendarName` on contact

- [x] 4.1 Add `@IsString() @IsOptional() calendarName?: string` to
      `server/src/modules/contact/models/dto/send-message.dto.ts`. Leave `gradeName` exactly as it
      is.
- [x] 4.2 Forward it in `server/src/modules/contact/services/contact.service.ts` as its own key in
      the `data` map passed to `removeUndefinedValues`. Add no trimming here —
      `buildContactMetas` already drops values that normalize to empty (design D6).
- [x] 4.3 Extend `server/src/modules/contact/controllers/contact.controller.test.ts`: a request
      with **both** `gradeName` and `calendarName` forwards both as distinct keys; a request with
      only `gradeName` (the Flutter shape) is unchanged from today; a request omitting
      `calendarName` produces no `calendarName` key; a whitespace-only `calendarName` is dropped
      before Crisp.

## 5. Regenerate the contract and the mobile client

- [x] 5.1 Regenerate the committed spec from `server/`:
      `DATABASE_URL=… REDIS_URL=… npm run generate:openapi` (it builds first — the swagger CLI
      plugin only injects schemas at compile time). **Never hand-edit `openapi/openapi.json`.**
- [x] 5.2 Inspect the spec diff: it must add the `/v1/calendars/{token}` `patch` operation, an
      `UpdateCalendarDto` schema with `maxLength: 100`, `calendarName` on `SendMessageDto`, and
      `maxLength` on `CreateCalendarDto.name` — and change nothing else. An unrelated diff hunk
      means the generator ran against the wrong build or environment; fix that, don't commit it.
- [x] 5.3 Regenerate the RN client from `mobile/`: `npm run generate`. Confirm the diff is confined
      to `mobile/src/api/generated/` (the new `Calendars` PATCH hook + the new/updated models) and
      that `mobile/src/api/mutator.ts` needs no change.
- [x] 5.4 `cd mobile && npx tsc --noEmit` — the regenerated client must typecheck with no consumer
      changes. Do **not** add a consumer: Tickets 2 and 3 own that and must not regenerate this
      output.
- [x] 5.5 Prove no Flutter file changed: `git status --porcelain app/` must be empty, and
      `git diff --name-only origin/main...HEAD -- app/` must print nothing.

## 6. Gates green locally

- [ ] 6.1 `cd server && npm test` (or the targeted suites for calendar, calendar-sync and contact
      first, then the full run) — all green with the compose dependencies up.
- [x] 6.2 `cd server && npm run lint` and the repo's format check; `cd mobile && npm run lint`.
- [ ] 6.3 Re-run `npm run generate:openapi` and `npm run generate` once more after all edits and
      confirm `git diff --exit-code openapi/openapi.json mobile/src/api/generated` is clean — this
      is the local reproduction of both CI drift gates (`ci-build-deploy.yml` for the spec,
      `ci-mobile.yml` for the client).

## 7. Documentation

- [x] 7.1 Update `docs/mobile/architecture-book/data.md` "Committed-spec seam": record that the
      contract now carries exactly one path-level `/v1` route (`PATCH /v1/calendars/{token}`), that
      NestJS global versioning is deliberately not enabled, and that every other calendar route
      stays unversioned. Keep it to the contract fact — the token-shared-rename and
      name-convergence ADR belongs to the epic's Ticket 4, not here.
- [x] 7.2 Append a dated entry to `docs/mobile/architecture-book/architecture-changelog.md` for
      that seam note (migration-approach §7).
- [x] 7.3 Do **not** add an ADR in this change: Ticket 4 owns the architecture decisions record for
      this epic, and a speculative ADR number here would collide with it.

## 8. Definition of Done

- [ ] 8.1 Walk `docs/mobile/architecture-book/definition-of-done.md` and record why the client-side
      items do not apply: no user-facing text, no a11y surface, no Maestro flow and no device pass
      — this change ships server contracts and generated types only. Machine-checkable items
      (typecheck, lint, tests, no drift) must actually be green.
- [ ] 8.2 Confirm the diff touches only: `server/src/modules/{calendar,calendar-sync,contact}/**`,
      `openapi/openapi.json`, `mobile/src/api/generated/**`, the two docs files, and this OpenSpec
      change. In particular **no** `server/src/migrations/` file — if one appears necessary, stop
      and escalate to the Founding Engineer rather than adding it.
- [ ] 8.3 Flag the sensitive surfaces in the PR body for the Reviewer: `openapi/openapi.json` and
      `mobile/src/api/generated/` (the server↔client contract, consumed by Flutter and web as well
      as React Native) and the calendar/contact server modules.
