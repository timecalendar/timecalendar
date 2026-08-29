## Why

The Activity feature (timetable-change history) has been hard-disabled in Flutter since it
shipped. [TIM-275](https://paperclip.lyrolab.fr/TIM/issues/TIM-275) established the reason was
server capacity, not a product defect: the only read contract,
`POST /calendar-logs/search`, returns **every** matching log inside the one-year retention
window with no cursor, no limit, and no response bound. React Native 4.0 revives Activity, so
the read path has to be bounded before anything consumes it.

Three further defects make the existing contract unfit as-is:

- Its request DTO validates each *value* as a string but never asserts `tokens` is an array, so
  a bare string `{"tokens": "abc"}` passes validation, spreads to zero characters, and returns a
  silent empty success — indistinguishable from "no changes".
- It echoes `calendarToken` back to the caller. The token is a bearer capability; the consumer
  already identifies calendars by server ID, so returning it is pure leakage surface.
- Nothing caps how many tokens one request may resolve.

This change adds the bounded contract and fixes the array validation, without disturbing the
Flutter client that still calls the unversioned route.

Authoritative specification:
`docs/react-native-migration/05-tech-specs/activity-revival.md` (architecture decisions 1–4
and 10, API behavior, Security and privacy, Verification strategy → Server tests).
Delivery ticket: [TIM-395](https://paperclip.lyrolab.fr/TIM/issues/TIM-395), ticket 2 of epic
[TIM-389](https://paperclip.lyrolab.fr/TIM/issues/TIM-389).

## What Changes

- **Add `POST /v1/calendar-logs/search`** as a path-level controller route (`@Controller("v1/calendar-logs")`)
  on the existing `CalendarLogModule`. No global NestJS versioning, no other endpoint moves.
- **Bound every request.** `tokens` required and validated as an array of non-empty strings,
  deduplicated before the cap, at most 100 unique; `limit` an integer 1–100 defaulting to 50;
  `unreadSince` an optional ISO-8601 timestamp; `cursor` an optional opaque server-issued value.
- **Paginate by snapshot-bound keyset.** The first page captures a database `asOf`; every page is
  ordered `createdAt DESC, id DESC` and constrained to `createdAt <= asOf`. The server reads one
  extra row to decide whether `nextCursor` exists; the final page returns `nextCursor: null`. A
  log inserted mid-scroll can neither duplicate nor displace a row inside the snapshot.
- **Omit `calendarToken` from the v1 response.** `CalendarLogV1` is
  `{ id, calendarId, calendarName, calendarChange, createdAt, updatedAt }`.
- **Return an exact unread count on the first page** when `unreadSince` is supplied:
  rows where `createdAt > unreadSince AND createdAt <= asOf`. Following pages omit the field and
  never run the count query.
- **Fix the legacy DTO.** `GetCalendarLogsDto` gains `@IsArray()`. The bare-string caller changes
  from silent empty success to 400; every valid array request keeps its exact response shape,
  `calendarToken` included. The committed OpenAPI schema for that path is unchanged (the Swagger
  plugin already emits `type: array` from the TypeScript type).
- **Add bounded telemetry** — page row count, unread-count duration, first-page/cursor outcome —
  with labels drawn only from closed enums. No label derives from a token, calendar, user, event,
  or cursor.
- **Regenerate and commit `openapi/openapi.json`** and the mechanical Orval output under
  `mobile/src/api/generated/`, which the required mobile CI gate compares against the spec.

## Capabilities

### New Capabilities

- `server-calendar-log-search`: the server's calendar-log read contract — the bounded v1 search
  endpoint (validation, keyset pagination, snapshot semantics, unread count, privacy posture) and
  the compatibility rules the unversioned endpoint keeps.

### Modified Capabilities

<!-- None. No existing capability spec covers the calendar-log read endpoints;
     `server-calendar-log-retention` covers only the daily prune job. -->

## Impact

- **`server/src/modules/calendar-log/`** — new v1 controller, service method, request/response
  DTOs, cursor codec, metrics service, and repository query methods. `CalendarLogModule` gains
  the controller and providers. Existing controller, service, mapper, and repository methods are
  additive-only apart from the legacy DTO's `@IsArray()`.
- **`openapi/openapi.json` (sensitive)** — the committed server↔client contract; server CI fails
  on drift. The v1 path and DTOs are additive; the legacy path stays byte-identical.
- **`mobile/src/api/generated/` (sensitive)** — regenerated Orval output only, no hand-written
  mobile code. Required because touching `openapi/**` triggers `ci-mobile.yml`, whose first step
  regenerates the client and fails on any diff. See design D8.
- **`server/src/migrations/` (sensitive)** — **untouched by default.** An index migration is added
  only if [TIM-394](https://paperclip.lyrolab.fr/TIM/issues/TIM-394)'s query-plan evidence proves
  the existing `calendar.token`, `calendar_log(calendarId, createdAt)`, and
  `calendar_log(createdAt)` indexes cannot meet the frozen budget. See design D7.
- **No production deploy act.** Deploying the server image is a separate Founding-Engineer-owned
  rollout ticket created after ticket 8.

## Out of Scope

- Enabling global NestJS versioning or moving unrelated endpoints under `/v1`.
- A GET collection carrying tokens in the query string — tokens are bearer capabilities and must
  never appear in a URL.
- Rate limiting, a kill switch, retention changes, change-detection changes, notification
  delivery.
- Regenerating Flutter clients or touching `app/`.
- Hand-written mobile code: the SQLite cache (ticket 3), the refresh coordinator (ticket 4), and
  the Activity screen (ticket 5).

## Close gate

This change may be implemented and reviewed against the specification's provisional budgets, but
it **may not close** until [TIM-394](https://paperclip.lyrolab.fr/TIM/issues/TIM-394) freezes the
performance gates and this change's measured numbers are checked against them. If the PR is
otherwise green while TIM-394 is not `done`, the Reviewer parks TIM-395 `blocked` on TIM-394
rather than merging on provisional budgets. This is a real dependency, not a human merge gate.
