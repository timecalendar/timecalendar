# Calendar naming and manual import epic

**Date:** 2026-08-30  
**Paperclip:** [TIM-274](https://paperclip.lyrolab.fr/TIM/issues/TIM-274)  
**Status:** Ready to split into implementation tickets  
**Products:** React Native mobile app and server

## Summary

React Native asks the student for their institution and programme before a manual calendar
import. The programme becomes the calendar's user-facing name. The student then sees a short
intranet instruction screen followed by one import screen offering both QR scanning and iCal URL
pasting.

The server accepts an optional name during calendar creation and exposes a capability-token rename
endpoint. A rename is shared by every installation holding the same calendar token. React Native
refreshes that shared name during ordinary calendar synchronization without overwriting local-only
calendar settings.

The target onboarding path is:

```text
School -> Programme -> Connect to intranet -> Import by QR or iCal URL
                                      |
                                      +-- future assistant insertion point
```

The assistant is not part of this epic. The Connect screen proceeds directly to manual import.

## Why this exists

The calendar `name` began as the name of a formation selected from a list. React Native currently
imports a raw URL using the hard-coded values `Dev import` for both `name` and `schoolName`. The
selected school is not passed into creation, QR import has no visible onboarding entry point, and
the listed-school path opens a dormant group picker that does not create a calendar.

Calendar names now have two concrete purposes:

1. They distinguish calendars for students who hold several programmes or several calendar feeds.
2. They provide programme context when support receives repeated import failures from the same
   cohort.

Production data confirms that names are useful but cannot be treated as clean identifiers:

- 444,028 live calendars have 77,025 distinct stored names.
- 80,685 names are empty and 119,511 contain only whitespace.
- Existing names include URLs and values longer than the new input limit.
- The most common meaningful values look like programme names.
- No production school currently exposes configured school groups.

Existing rows remain untouched. The app derives a safe display label at read time.

## Vocabulary

| Product term | Stored/API concept | Meaning |
| --- | --- | --- |
| Institution / Établissement | `schoolId` or `schoolName` | The university or school providing the calendar. |
| Programme / Formation | `calendar.name` | The student's course of study, used as the calendar label. |
| Calendar name | `calendar.name` | The generic name used after onboarding and in calendar management. |

Onboarding uses **Nom de formation** in French and **Programme name** in English. Longer accessible
copy may use **Programme of study**. Calendar management uses the generic **Calendar name** label.

## Goals

- Collect the institution and programme during the normal React Native import journey.
- Show the institution's intranet link when the server provides one.
- Make QR and iCal URL import discoverable from one manual-import screen.
- Send real institution and programme metadata when creating a calendar.
- Permit students to skip the programme without inventing or persisting a fake name.
- Let a token holder rename a calendar, including clearing its name.
- Converge renamed server names across installations during normal synchronization.
- Give support optional programme context on failed-import reports.
- Preserve all existing Flutter request contracts without changing Flutter code.

## Out of scope

- Any Flutter UI, model, generated client, or behavioral change.
- The school-specific assistant that extracts a calendar from an intranet.
- School-group selection, group discovery, or group-based iCal generation.
- Enabling an assistant or group flow for any production school.
- Backfilling, trimming, or otherwise rewriting existing production names.
- Per-device aliases, calendar ownership, user accounts, or rename permissions beyond possession of
  the calendar token.
- Duplicate-name detection or calendar lifecycle coupling.
- Rename history or an audit log.
- Automatically discovering an intranet URL for an unlisted institution.
- Moving existing endpoints under `/v1` or introducing global NestJS API versioning.
- Removing the legacy contact `gradeName` field.
- Assistant/chat integration.

## User journeys

### Listed institution

1. The student selects an institution from the server-provided list.
2. The import draft holds the selected `SchoolForList`, including `id`, display name, and nullable
   `intranetUrl`.
3. The student enters a programme name or uses the native Skip action.
4. The Connect screen explains that the student must open their institution's intranet. When
   `intranetUrl` is a valid HTTP(S) URL, the screen shows an external-link action labelled with the
   institution name.
5. Continue opens the manual import screen.
6. The student either scans the QR code shown by the institution or pastes its iCal URL.
7. React Native creates the calendar with `schoolId` and the programme name. It does not send a
   duplicate `schoolName`.

### Unlisted institution

1. The student chooses the existing “institution not listed” action.
2. The institution step becomes a free-text **Institution name** field instead of bypassing school
   collection.
3. Institution name is required in this normal UI path, trimmed, and limited to 100 characters.
4. The student enters or skips the programme name.
5. The Connect screen shows the generic instructions without an intranet button because the app has
   no trusted URL.
6. Manual import offers QR scanning and iCal URL pasting.
7. React Native creates the calendar with the entered `schoolName` and no `schoolId`.

Collecting both values is intentional: institution identifies the calendar provider, while
programme identifies the student's cohort and distinguishes their calendars. A listed institution
is not requested twice because its server record already supplies its name.

### Direct routes and recovery

Development links, external links, tests, and restored navigation may open the QR or URL route
without an import draft. These routes remain usable. They create with `name: ""` and
`schoolName: ""` rather than redirecting or crashing.

A failed import keeps the in-memory institution and programme draft so the student can retry or
switch between QR and URL entry. A successful import or leaving the import journey clears the
draft. An app restart also clears it by design.

### Rename

1. Every calendar row exposes the same overflow menu on iOS and Android.
2. The menu contains Rename and Delete. Android no longer uses a standalone trash action.
3. Rename opens one shared, app-themed React Native dialog on both platforms.
4. The dialog starts with the trimmed current name and supports pending, failure, retry, and
   cancellation states without dismissing prematurely.
5. A successful server response updates the local row immediately.
6. Other installations receive the new name on their next successful synchronization.

## UX requirements

### Programme step

- The field label is **Nom de formation** / **Programme name**.
- The placeholder is an example such as **L3 Informatique**. Placeholder text is never persisted.
- Leading and trailing whitespace is ignored.
- Unicode, accents, and emoji are accepted.
- The maximum normalized length is 100 characters.
- Empty input is allowed through an explicit native Skip action.
- Skip is a quiet trailing native-stack header action, not a second primary button. It uses the
  platform header treatment, translated text, an accessible label, and at least the platform's
  normal 44-point iOS or 48-dp Android target.
- The primary Continue action remains available for a non-empty valid value.

### Effective display name

Every calendar-name surface derives the label as follows:

```text
trim(stored name) when non-empty
otherwise “Mon emploi du temps” / “My timetable”
```

This rule handles empty and whitespace-only production values without a backfill. Stored values are
not silently replaced with the fallback.

### Connect screen

The screen follows the useful behavior of Flutter's
`app/lib/modules/assistant/screens/connect_screen.dart`:

- Explain that the student should connect to their institution's website on a computer or device
  browser and open their timetable.
- Show an external-link button only when the selected institution has a valid HTTP(S)
  `intranetUrl`.
- Always provide Back and Continue actions.
- Continue goes directly to manual import for this epic.
- Keep the navigation boundary explicit so a later project can insert the assistant between
  Connect and manual import without changing the preceding screens.

### Manual import screen

The screen follows the useful behavior of Flutter's
`app/lib/modules/import_ical/screens/import_ical/import_ical_screen.dart`:

- Explain that the student can scan the QR code displayed by the institution or paste the iCal
  link.
- Offer both Scan QR code and Paste an iCal link from the same screen.
- Reuse the existing React Native QR and URL entry routes for camera permissions, validation,
  loading, failure reporting, and creation. The new screen orchestrates those routes instead of
  duplicating their logic.

## Architecture decisions

### 1. One ephemeral import draft

The onboarding import flow owns one feature-scoped, in-memory draft:

```ts
type CalendarImportDraft = {
  institution:
    | { kind: "listed"; school: SchoolForList }
    | { kind: "unlisted"; schoolName: string }
  calendarName: string
}
```

The exact implementation may use React context or an equivalent feature-local provider. It must
not introduce a new global store or persist the draft in MMKV. Carrying institution and programme
in one draft prevents a stale persisted school from being combined with a later URL import.

The existing selected-school/group persistence is not a source of truth for calendar creation.
Entering the unlisted path clears any old persisted selection that could be consumed by legacy RN
code. Removing the unused group implementation is a separate cleanup.

### 2. Creation remains backward compatible

The existing `POST /calendars` endpoint stays in place. Flutter payloads remain valid. React Native
sends one institution representation:

- Listed: `{ url, schoolId, name }`
- Unlisted: `{ url, schoolName, name }`
- Direct route without a draft: `{ url, schoolName: "", name: "" }`

The server normalizes creation with `(name ?? "").trim()` before persistence. `name` remains
optional in the request because older clients omit it, while the database column remains non-null.
New create and rename requests enforce a 100-character normalized maximum. Existing longer values
remain valid stored data and continue to render.

No database migration or production backfill is required.

### 3. Rename is a token-authorized shared mutation

The new contract is:

```http
PATCH /v1/calendars/:token
Content-Type: application/json

{ "name": "L3 Informatique" }
```

Behavior:

- `name` is required and must be a string.
- The server trims it, accepts an empty result, and rejects normalized values over 100 characters.
- A valid token returns `200` with `CalendarForPublic` containing the stored name.
- An unknown token returns `404` without revealing any additional calendar data.
- Rename updates normal entity metadata such as `updatedAt`, but never changes `lastUpdatedAt`,
  which represents successful upstream calendar refresh time.
- Duplicate names are accepted and last write wins.

The endpoint is intentionally the first path-level `/v1` calendar endpoint. Existing unversioned
GET, create, and sync endpoints remain unchanged for compatibility. This epic does not enable
NestJS global versioning.

The token is a capability: possession grants read, sync, and rename access. There is no separate
authenticated owner. A rename is therefore global for all devices holding that token.

### 4. OpenAPI remains the client contract

Server decorators generate the committed `openapi/openapi.json`. The React Native Orval client and
schemas are regenerated from that contract. Generated Dart/Flutter API files are not regenerated
or edited.

### 5. Sync converges server names without replacing local preferences

`POST /calendars/sync` already returns calendar metadata with each calendar's events. React Native
continues replacing events as it does today, then applies returned names through a narrow
calendar-source repository operation such as `updateName(id, name)`.

The sync path must not upsert a complete `user_calendars` row. The existing public-calendar mapper
defaults `visible` to true, so a full upsert could silently unhide a locally hidden calendar.

Event replacement and name refresh are intentionally not one cross-feature transaction. If events
succeed and the metadata write fails, existing calendar data remains usable and the next sync
retries convergence. Local database failures use the existing recoverable error-reporting pattern.

### 6. One controlled rename dialog

Both platforms use the same controlled React Native dialog rather than iOS `Alert.prompt` plus a
separate Android implementation. A controlled dialog can keep user input visible while an
asynchronous request is pending or fails. It also gives both platforms the same validation,
accessibility, retry behavior, and automated test surface.

The entry menu remains native through the existing cross-platform `MenuView` capability.

### 7. Support gets an additive field

`POST /contact` accepts a new optional `calendarName` field. React Native includes the normalized
programme name when reporting a failed import and omits it when empty. The server forwards it to
Crisp as a distinct metadata field.

The legacy optional `gradeName` field remains accepted and forwarded for Flutter compatibility.
Neither client needs to copy one field into the other. Contact-request payload redaction remains in
place because institution, programme, calendar URL, and user message may contain personal data.

## Error behavior

| Situation | Expected behavior |
| --- | --- |
| Programme omitted | Continue through Skip; create with `name: ""`. |
| Programme over 100 characters | Keep the screen open and show inline validation. |
| Existing stored name is whitespace | Display the localized timetable fallback. |
| Existing stored name is over 100 characters | Display it; require a value of at most 100 characters if the user chooses to rename it. |
| Invalid or missing intranet URL | Show generic Connect copy without an external-link button. |
| Direct QR/URL route has no draft | Import with empty name and school name. |
| Calendar create fails | Keep the draft and entered URL available for retry and support reporting. |
| Rename is offline or server fails | Keep the dialog/input open, preserve the old local name, and offer retry/cancel. |
| Rename token is unknown | Show the same recoverable rename failure surface; do not remove the local calendar automatically. |
| Sync metadata write fails after events | Keep the previous local name and repair on a later sync. |

## Security and privacy

- Calendar tokens are bearer capabilities carried in the URL path. The new endpoint must not add
  token or request-body values to explicit application logs, analytics, or crash metadata.
- Existing token entropy and by-token access are reused. Account authentication, ownership, token
  rotation, and endpoint-specific rate limiting are not introduced here.
- Only HTTP(S) institution URLs may be opened. Invalid or unsupported schemes render no link.
- Institution and programme names are sent to Crisp only as part of the student's explicit support
  action.
- Calendar names are user-provided display text. They are rendered as text and never interpreted as
  markup or a URL.

## Compatibility

| Consumer | Result |
| --- | --- |
| React Native | Uses formation naming, manual import shell, rename, and sync convergence. |
| Flutter | Continues using unversioned create/sync and optional `gradeName`; no files change. |
| Existing calendars | No backfill; client fallback handles blank and whitespace names. |
| Shared/imported token | Rename affects every holder after local update or sync. |
| Existing server clients | Existing unversioned routes and optional create name stay valid. |

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Anyone with a token can rename globally. | A shared token holder can surprise other holders. | State the capability model clearly; last write wins; defer ownership/per-device aliases. |
| `/v1/calendars/:token` is inconsistent with existing unversioned calendar routes. | Future contributors may duplicate routing styles. | Record that this is path-level versioning only and defer a coherent API-wide migration. |
| Old names do not satisfy new validation. | An existing long name cannot be saved unchanged from Rename. | Continue displaying old data; apply the limit only to new writes; explain validation in the dialog. |
| Whitespace names look blank. | Rows may appear unnamed without a backfill. | Use the trimmed effective-display-name rule everywhere. |
| Durable selected-school state is stale. | A missing-school import could be attributed to a previous school. | Use one ephemeral import draft and clear legacy selection on the unlisted path. |
| Metadata sync overwrites `visible`. | A hidden calendar could reappear. | Update only the name, never upsert the full server DTO during sync. |
| Non-atomic event/name writes diverge briefly. | A new name may appear one sync later after a local write failure. | Preserve last-good state, report the failure, and retry on the next sync. |
| Connect has no link for an unlisted school. | The screen may feel less actionable. | Show useful generic instructions and always allow Continue to manual import. |
| The roadmap and canonical specs describe navigation that the app no longer implements. | Tickets can satisfy stale acceptance criteria. | Reconcile touched specs and roadmap in an explicit documentation ticket. |
| QR camera permissions vary by platform. | Manual import can be blocked. | Reuse the tested QR route and retain iCal URL as an alternative on the same screen. |

## Verification strategy

### Server tests

- Creating without `name` persists and returns `""`.
- Creating trims a supplied name and rejects a normalized value over 100 characters.
- Existing Flutter-shaped create and contact payloads remain accepted.
- `PATCH /v1/calendars/:token` renames, trims, clears with `""`, rejects missing/non-string/long
  input, and returns 404 for an unknown token.
- Rename returns `CalendarForPublic` and does not change `lastUpdatedAt`.
- Contact accepts and forwards `calendarName` and continues accepting `gradeName` independently.
- Generated OpenAPI includes the additive contracts.

### React Native unit and integration tests

- Listed and unlisted institution paths construct the correct draft.
- Unlisted school entry cannot accidentally reuse a previously selected school.
- Programme Continue, native Skip, whitespace, Unicode, and the 100-character boundary behave as
  specified.
- Connect shows a safe intranet link only when available and valid.
- Manual import exposes both QR and URL routes.
- Creation sends exactly one of `schoolId` or `schoolName`, plus normalized `name`.
- Direct QR and URL routes remain usable without a draft.
- Failed import retains context and sends optional `calendarName` to support.
- Empty/whitespace names use the translated fallback in all calendar-list and dialog surfaces.
- Rename validates locally, handles pending/failure/retry, and updates local state only after server
  success.
- Sync updates names while preserving `visible` and other local fields.
- A failed local metadata update preserves last-good data and records a recoverable error.

### Maestro and device checks

- Add a dedicated seeded calendar for a real rename round trip.
- Rename it, restart the app, synchronize, and confirm the server name remains visible.
- Confirm Rename/Delete menu behavior and the controlled dialog on iOS and Android.
- Confirm VoiceOver/TalkBack labels, focus order, Dynamic Type/font scaling, error announcement, and
  minimum touch targets for Programme Skip and Rename.
- Confirm external intranet links and QR camera permission behavior on both platforms.
- Keep live iCal creation as unit/integration plus manual verification until CI owns a stable `.ics`
  fixture endpoint.

## Delivery plan and proposed Paperclip tickets

These are ticket candidates only. This document does not create them.

### Ticket 1 — Server calendar naming and token rename contract

**Outcome:** The server safely stores optional create names, exposes the versioned rename mutation,
and supports additive programme context in contact reports.

**Scope:**

- Normalize and validate `CreateCalendarDto.name` while preserving optionality.
- Add `PATCH /v1/calendars/:token` and its update DTO/service/repository behavior.
- Preserve `lastUpdatedAt` during rename and return `CalendarForPublic`.
- Add optional `calendarName` to contact while preserving `gradeName`.
- Update server tests and committed OpenAPI.
- Regenerate only the React Native client/schema output.

**Not in scope:** global API versioning, auth/ownership, rate limiting, DB migration, backfill, or
Flutter generation.

**Acceptance:** all server behaviors and compatibility cases in this specification are automated;
OpenAPI exposes both new fields/paths; no Flutter files change.

### Ticket 2 — React Native programme and manual-import journey

**Outcome:** A student can move from institution through programme and intranet guidance to a
discoverable QR-or-link import, with accurate creation/support metadata.

**Scope:**

- Replace the normal group-picker navigation with the ephemeral import draft.
- Collect a free-text institution for the unlisted path.
- Add Programme, Connect, and combined manual-import screens.
- Reuse existing QR and URL route behavior.
- Wire `schoolId`/`schoolName`, `name`, and support `calendarName`.
- Apply the effective-display-name fallback.
- Add translations, accessibility, unit/integration tests, and manual device criteria.

**Not in scope:** assistant implementation, group cleanup, server-driven group selection, or
Flutter changes.

**Dependency:** Ticket 1, because the generated contract and server normalization must be stable.

### Ticket 3 — React Native rename and synchronization convergence

**Outcome:** Students can rename any held calendar, and all installations converge on the shared
server name without losing local preferences.

**Scope:**

- Use the cross-platform overflow menu for Rename and Delete.
- Add the controlled rename dialog and generated PATCH mutation.
- Add a narrow local repository name update.
- Refresh names from sync responses while preserving `visible`.
- Add unit/integration coverage, a dedicated e2e seed, Maestro round trip, and device criteria.

**Not in scope:** per-device aliases, audit history, ownership, or transactional coordination
between calendar-source metadata and event replacement.

**Dependency:** Ticket 1.

### Ticket 4 — Reconcile naming/import specifications and architecture documentation

**Outcome:** Canonical OpenSpec requirements, the RN migration roadmap, and architecture decisions
describe the implemented flow and its deliberate compatibility boundaries.

**Scope:**

- Update the touched onboarding, school-selection, iCal, QR, user-calendar, sync, feedback, and
  identity-persistence requirements without preserving stale group/navigation behavior.
- Record the import draft, token-shared rename, path-level `/v1`, and eventual name convergence
  decisions in the architecture book.
- Correct roadmap claims that QR/source navigation and group selection are currently complete.
- Link the final implementation tickets and verification evidence.

**Not in scope:** unrelated migration-roadmap cleanup or implementation changes.

**Dependency:** It may start alongside Tickets 1–3, but final acceptance follows their implemented
contracts and evidence.

## Delivery order

```text
Ticket 1 ──┬──> Ticket 2
           └──> Ticket 3

Ticket 4 can begin in parallel and closes after Tickets 1–3 settle their contracts.
```

No Paperclip ticket should be issued until this technical specification is reviewed and the ticket
bodies are explicitly approved.
