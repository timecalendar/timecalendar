## Context

The server owns three surfaces this change touches.

**Creation.** `POST /calendars` → `CalendarSyncController.createCalendar` → `CalendarSyncService`
`createCalendar`, which mints a `nanoid()` token and calls `sync()` with the request's `name`
verbatim. `Calendar.name` is `@Column()` (non-null) and the underlying column is
`character varying NOT NULL` with no default, so `name: undefined` is a not-null violation, not an
empty name. Validation is global: `configure-main-app.ts` installs `CustomValidationPipe` with
`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` — so class-transformer runs on
every request body and a `@Transform` on a DTO property is the normalization boundary.

**Read by token.** `GET /calendars/by-token/:token` → `CalendarService.findCalendarByToken` →
`CalendarRepository.findOneByToken` (`findOneOrFail`, relation `school`) → `CalendarHelper.forPublic`
→ `CalendarForPublic` (`PickType(Calendar, [id, token, name, schoolName, schoolId, lastUpdatedAt,
createdAt])`). A missing token raises TypeORM's `EntityNotFoundError`, which the global
`TypeOrmExceptionFilter` maps to `404`. That is the exact path the rename endpoint reuses.

**Contact.** `POST /contact` → `ContactService.sendMessage` builds a flat `data` map through
`removeUndefinedValues` and hands it to `CrispClient.createConversation`, whose `buildContactMetas`
already drops any value that trims to empty. Metadata keys are therefore purely additive.

The epic spec
(`docs/react-native-migration/05-tech-specs/calendar-naming-and-manual-import.md`, decisions 2, 3,
4 and 7) fixes the wire shapes; this design fixes how they land in this codebase.

## Goals / Non-Goals

**Goals**

- Make `name` genuinely optional on create, normalized identically on every write path.
- Add one token-authorized rename mutation whose success shape is the existing `CalendarForPublic`
  and whose failure shape is the existing 404, with no new information disclosure.
- Keep `lastUpdatedAt` meaning exactly one thing: the last successful upstream calendar refresh.
- Keep every existing Flutter and web request valid, byte for byte.
- Emit both contracts through the normal generated pipeline so the RN client is typed, not
  hand-written.

**Non-Goals**

- No NestJS global versioning (`app.enableVersioning`) and no relocation of existing routes.
- No ownership, authentication, token rotation, or per-endpoint rate limiting.
- No migration, no backfill, no rewrite of existing stored names.
- No client behaviour: display fallback, the rename dialog, and sync convergence are Tickets 2–3.

## Decisions

### D1 — `/v1` is a path prefix on a second controller, not NestJS versioning

`PATCH /v1/calendars/:token` is served by a new `CalendarV1Controller` declared
`@Controller("v1/calendars")` inside the existing `CalendarModule`, alongside the unversioned
`CalendarController`. Two alternatives were rejected:

- **`app.enableVersioning({ type: VersioningType.URI })`** — global versioning applies a default
  version to *every* controller. Existing clients (Flutter release builds in the field, the web
  app) call unversioned paths; opting each existing controller out with `@Version(VERSION_NEUTRAL)`
  is more edits and more risk than one extra controller, for zero benefit while exactly one route
  is versioned.
- **A `@Patch("/v1/calendars/:token")` escape hatch on the existing `@Controller("calendars")`** —
  a route whose path contradicts its controller prefix is the kind of thing that reads as a typo
  and gets "fixed" later.

The cost is recorded honestly: the API now has two routing styles. The epic defers a coherent
API-wide versioning migration, and Ticket 4 records that deferral in the architecture
documentation. Nothing in this change may be read as a commitment to version anything else.

### D2 — One shared normalizer; trim at validation, `?? ""` at persistence

A new `modules/calendar/helpers/calendar-name.ts` exports:

- `CALENDAR_NAME_MAX_LENGTH = 100`
- `normalizeCalendarName(value: unknown): string` — `typeof value === "string" ? value.trim() : ""`
- a `TrimCalendarName` transform used by the DTOs — `typeof value === "string" ? value.trim() : value`

The two functions differ deliberately. The **DTO transform must pass non-strings through
unchanged** so that `@IsString()` can reject them with a `400`; coercing a number to `""` there
would silently accept `{ "name": 42 }`. The **service normalizer must collapse anything
absent/invalid to `""`** because it is the last line before a NOT NULL column.

Validation order on each DTO is transform-then-validate (class-transformer runs before
class-validator), so `@MaxLength(CALENDAR_NAME_MAX_LENGTH)` measures the **trimmed** value. A
101-character string with surrounding spaces is rejected; a 100-character string with surrounding
spaces is accepted and stored trimmed.

`@MaxLength` counts **UTF-16 code units** (`String.prototype.length`). That is the same unit React
Native's `TextInput maxLength` and a JS client-side check use, so client and server agree exactly —
including for emoji, which cost 2. Grapheme-cluster counting would make the client's inline
validation disagree with the server's `400`. `CALENDAR_NAME_MAX_LENGTH` is exported so the limit
has one definition on the server side of the seam, and the generated OpenAPI carries `maxLength`
into the client contract.

### D3 — Rename reads by token, then updates by id, through the existing repository method

```ts
async renameCalendar(token: string, name: string): Promise<CalendarForPublic> {
  const calendar = await this.repository.findOneByToken(token) // EntityNotFoundError → 404
  await this.repository.update(calendar.id, { name })
  return this.calendarHelper.forPublic({ ...calendar, name })
}
```

- **Reuse `CalendarRepository.update(id, Partial<Calendar>)`.** It already exists and does exactly
  what is needed. Do **not** add a `updateName`/`renameByToken` repository method; there is nothing
  for it to encapsulate.
- **`lastUpdatedAt` is preserved by construction**, not by a guard: the partial contains only
  `name`, and `lastUpdatedAt` is a plain column written solely by `recordSyncAttempt` on the sync
  path. `updatedAt` is TypeORM's `@UpdateDateColumn` and is bumped by `update()`, which is the
  ordinary entity metadata the spec asks for. A test pins both halves of this so a future refactor
  toward `save()` (which would carry the whole loaded entity) cannot silently change it.
- **No second read.** Every field of `CalendarForPublic` except `name` is unchanged by the update,
  and the already-loaded entity carries its `school` relation, so spreading the new name onto it
  produces exactly what a re-read would. This also keeps the response consistent under concurrent
  renames without introducing a lock: last write wins, and each caller sees the name it wrote.
- **Duplicate names are accepted.** No uniqueness check anywhere.

### D4 — The 404 reuses the existing not-found path and adds no disclosure

An unknown token hits `findOneOrFail` → `EntityNotFoundError` → `TypeOrmExceptionFilter` → `404`,
identical to `GET /calendars/by-token/:token` today. The filter's message names the entity type
(`Calendar`), which is a fact about the API, not about any calendar. Crucially the update runs
**after** the lookup, so an unknown token performs no write and the response body carries no
calendar field. A test asserts the 404 body exposes no `id`, `token`, `name`, `schoolName` or
`createdAt`.

Timing is not treated as a disclosure channel here: token possession is already the read
capability, so a rename attempt reveals nothing a `GET` would not.

### D5 — The endpoint adds no logging, metrics, or tracing

The security requirement ("must not add the token or request-body values to application logs,
analytics, or crash metadata") is met by **adding nothing**: no logger call, no metric, no span
attribute in the rename path. This is a negative requirement, so it is stated in the spec and
enforced by review of the diff rather than by an assertion — there is no observability call to
assert the absence of. The existing global HTTP instrumentation is unchanged and already sanitizes
paths.

### D6 — `calendarName` is a plain additive contact field

`SendMessageDto` gains `@IsString() @IsOptional() calendarName?: string`, and `ContactService`
adds `calendarName: message.calendarName` to the `data` map it passes to `removeUndefinedValues`.
No trimming is added at this layer: `buildContactMetas` already drops values that trim to empty,
which is the behaviour the existing `server-contact-submission` spec requires and the reason a
whitespace-only programme name will not reach Crisp as an empty meta.

`gradeName` is untouched — same decorators, same forwarding, same position. Neither field is
derived from the other, so a Flutter client sending only `gradeName` and an RN client sending only
`calendarName` both produce exactly one metadata key. A test sends both in one request and asserts
both arrive independently.

### D7 — No migration; the column stays NOT NULL

Making creation write `""` is precisely what lets the NOT NULL column stand. Existing rows —
including the 119,511 whitespace-only and the over-100-character names — remain valid stored data.
The 100-character rule is a **write-time** rule only: a rename of an existing over-length name
requires the user to shorten it, and the epic's error table accepts that. If any part of the
implementation appears to need a `server/src/migrations/` change, that is a signal the design was
misread — stop and escalate to the Founding Engineer rather than adding one.

## Risks / Trade-offs

- **Two routing styles in one API.** Mitigated by scoping `/v1` to exactly one route, recording the
  deferral, and keeping every existing path untouched (D1).
- **A token holder can rename globally.** Deliberate: the token is the capability, there is no
  ownership model, and last write wins. Stated in the spec so no reader mistakes it for an
  oversight.
- **Old names fail new validation.** By design — the limit binds new writes only. The client shows
  the stored value and only enforces the limit when the user chooses to rename.
- **Contract regeneration is a sensitive, two-repo step.** Both CI drift checks (server spec, mobile
  client) are the safety net; the tasks below run each generator in the documented way rather than
  hand-editing either artifact.

## Migration Plan

None. No schema change, no data change, no client cutover — all three contract changes are
additive and every existing request stays valid. The change is reversible by reverting the diff.

## Open Questions

None. The epic spec fixes the wire shapes; the decisions above fix the implementation.
