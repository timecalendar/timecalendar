## Context

`CalendarSyncService` sends both new-calendar creation and later syncs through
`FetchService.fetchEvents`. The fetch service currently resolves a school strategy, runs generic
and school URL renamers, and immediately invokes the selected fetcher. Its generic renamers convert
`webcal` and normalize recognized ADE export windows, but malformed values and known HTML/UI pages
still reach `IcalFetcher`, where Axios performs the outbound request and the iCalendar parser later
fails or returns no events.

New-calendar errors are already captured below that boundary: `CalendarSyncService.fetchEvents`
returns the thrown error as a failed result, `sync` writes the original submitted URL and serialized
error to `calendar_failure`, then rethrows. Empty parsed results separately become `No events found`.
Keeping validation inside `FetchService` therefore avoids outbound I/O without bypassing either
existing failure behavior.

The bad-link evidence is platform-specific. ADE export and UI URLs can share an origin, and a path
such as `/calendar` can be a valid feed on unrelated providers. Toulouse 3 also already has an
existing `celcat` export-guide provider, while the school's selected provider is stored in the
server-owned `school.assistant` column rather than the catalogue.

## Goals / Non-Goals

**Goals:**

- Reject malformed/unsupported sources and the named proven UI shapes before any fetcher call.
- Keep the recognizer pure, explicit, host-bound, deterministic, and easy to extend from evidence.
- Return one bounded client-safe error without reflecting the submitted URL.
- Preserve valid ADE/Celcat fetches, URL transformations, school strategy behavior, retries,
  cadence, parsing, empty-feed rejection, and new-calendar failure recording.
- Correct Toulouse 3's persisted provider mapping through a reversible, narrowly guarded migration.

**Non-Goals:**

- Infer whether an arbitrary HTTP(S) response is a feed from its filename or path.
- Reject generic `/calendar`, `/direct`, root, or `.aspx` paths on unlisted hosts.
- Rewrite a UI page into a guessed export URL, follow a redirector, or scrape timetable HTML.
- Change endpoint DTOs, response schemas, the mobile client, empty-calendar policy, sync scheduling,
  retry policy, telemetry dimensions, or stored calendar URLs.
- Modify `mobile/**`, deployment/infrastructure, or legacy Flutter.

## Decision 1 — Validate once at the shared fetch boundary

Add a pure source-classification module beside the fetch service and call it at the beginning of
`FetchService.fetchEvents`, before strategy resolution and `transformUrl`. The classifier returns an
accepted parsed source or a bounded rejection reason; the service turns every rejected reason into
the same `BadRequestException("Unsupported calendar URL")`.

This is earlier than every `SchoolStrategy.fetchEvents` call, including custom fetchers and retrying
`IcalFetcher` instances. It also covers create and resync without duplicating controller or
`CalendarSyncService` checks. `getMinSyncIntervalMinutes` remains classification-free because it
does no outbound work and existing stored calendars still need strategy cadence resolution before
their next attempted sync.

Alternatives considered:

- DTO validation was rejected because stored calendars and non-controller sync entries must receive
  the same rule, and a DTO decorator cannot express the host/path table cleanly.
- Validation inside `IcalFetcher` was rejected because school strategies may use another fetcher.
- Validation after URL transformation was rejected because it would classify derived bytes rather
  than the submitted source and couple the rule to renamer order.

## Decision 2 — Use structural parsing plus an explicit exact-match table

Parse with the platform `URL` implementation. Accept only `http:`, `https:`, and `webcal:`; the last
remains accepted so the generic strategy can convert it to HTTPS. Relative, empty, malformed, and
other-scheme values reject. The classifier lowercases the parsed hostname, treats an explicit
default port as canonical URL behavior, and never uses substring/suffix matching for host identity.

After syntax/scheme validation, compare pathname only within the exact known hostname. Query and
fragment values do not make an otherwise proven UI endpoint into a feed. Encode the evidence as
data-driven rules, with no generic path fallback:

| Platform / school | Exact host | Rejected UI pathname |
| --- | --- | --- |
| Lyon 1 ADE portal | `edt.univ-lyon1.fr` | `/`, `/jsp/standard/index.jsp` |
| UBE ADE portal | `plannings.ube.fr` | `/`, `/jsp/standard/index.jsp` |
| Montpellier ADE direct UI | `proseconsult.umontpellier.fr` | `/`, `/direct`, `/direct/` |
| Rennes ADE portal/direct UI | `planning.univ-rennes.fr` | `/`, `/jsp/standard/index.jsp`, `/direct`, `/direct/` |
| Toulouse 3 Celcat UI | `edt.univ-tlse3.fr` | `/calendar`, `/calendar/`, `/calendar/default.aspx` |

Matching is exact after URL parsing; there is no `includes`, wildcard subdomain, or generic
`/calendar` rule. A later expansion requires a concrete fixture and focused positive/negative tests.
In particular, ADE
`/jsp/custom/modules/plannings/{anonymous_cal,direct_cal}.jsp?calType=ical...` and non-UI Celcat
export paths on the same origins remain eligible.

Alternatives considered:

- Fetching and checking `Content-Type` was rejected because the requirement is to avoid known-waste
  outbound work and HTML servers frequently mislabel responses.
- File-extension allowlisting was rejected because valid feeds in this repository include dynamic
  JSP endpoints without `.ics`.
- Broad path or hostname substring matching was rejected because it would turn a known-zero-success
  optimization into a compatibility break for unrelated or lookalike providers.

## Decision 3 — Reuse the existing HTTP error and failure-storage path

Throw a Nest `BadRequestException` with the stable literal `Unsupported calendar URL`. Do not include
the input, hostname, internal classifier reason, or a guessed recovery link in the public message.
Existing clients already tolerate non-2xx calendar-create errors, so no DTO or OpenAPI response
shape changes are needed.

Do not catch this exception in `FetchService`. `CalendarSyncService` continues to serialize it for a
new-calendar `calendar_failure` using the original `Calendar.url`; the stored failure URL remains the
full submitted source under the accepted repository policy. Existing-calendar behavior remains the
ordinary failed-sync path and does not create a new failure row. The event-count gate stays after a
successful parse, so a syntactically valid eventless feed still fails as `No events found`.

Alternative: return separate public messages for malformed, portal, direct UI, and Celcat UI.
Rejected because clients have no typed recovery contract for those variants and detailed
classification would increase compatibility and disclosure surface without changing the action.

## Decision 4 — Update only Toulouse 3's persisted provider row

Add one TypeORM data migration whose `up` updates `school.assistant` from `generic` or the legacy
`univtoulouse3` value to `celcat` only where `school.code = 'univtoulouse3'`. Guarding the prior value
prevents overwriting an operator correction or a future provider. Its `down` changes that row back
to `generic` only if it is still `celcat`; it does not touch catalogue content, school identity, or
other rows.

Exercise `up` and `down` against the real worker-isolated Postgres test database with Toulouse 3 and
unrelated control rows. Assert affected-row state, preservation of unrelated schools, idempotent
guards, and restoration of the worker schema/data after the test. The school table is small, and the
single guarded update adds no schema object or long-lived lock beyond the migration transaction.

Alternatives considered:

- Changing the initial export-guide catalogue was rejected because `celcat` already exists and the
  mismatch is the school-to-provider reference.
- Runtime special-casing in the mapper was rejected because the database is the source of truth and
  every school projection already preserves its raw configured provider.
- Live/manual SQL was rejected because it would bypass the committed migration and rollback proof.

## Decision 5 — Prove both the negative and preserved positive paths

Classifier unit tests cover every table entry, query/fragment variants, malformed/relative/empty
inputs, rejected schemes, hostname lookalikes, unrelated hosts with the same path, and accepted
HTTP(S)/`webcal`. `FetchService` tests use the existing fetcher mock to assert each rejected source
throws with zero fetcher calls. Positive cases show representative ADE exports on affected ADE
origins still reach the bounded-window transformation/fetch path and a non-UI Celcat export on the
Toulouse origin still reaches the fetcher/parser path.

`CalendarSyncService` integration coverage proves a rejected creation writes one
`calendar_failure` containing the original URL, creates no calendar/content, and leaves the fetcher
untouched. Retain the existing empty-event test and ADE creation/resync test rather than replacing
their assertions. A dedicated CI-proof test or named focused suite must bind the literal rule matrix
to the pre-fetch spy, so deleting or moving the guard cannot leave only pure-classifier tests green.

Update `docs/mobile/architecture-book/calendar.md` and its change log with the reusable server
boundary and links to the classifier/tests. No ADR is warranted: this is a local safety correction
at an existing owned seam, not a costly-to-reverse architecture choice. No human/device QA note is
needed for backend-only behavior with deterministic service-level proof.

## Risks / Trade-offs

- **[A university changes its UI route]** → Fail open for unknown HTTP(S) paths; add or remove an
  exact rule only with new evidence and paired positive/negative fixtures.
- **[A valid feed reuses one listed UI pathname]** → Keep the table to zero-success shapes and prove
  known exports on the same host remain accepted; rollback is a data-only rule removal.
- **[`webcal` parsing differs from HTTP URL parsing]** → Test it directly and leave conversion owned
  by the existing generic renamer.
- **[The migration overwrites a newer school configuration]** → Guard both code and expected prior
  assistant values; the down migration also refuses to overwrite a value changed after deployment.
- **[A stable error obscures internal categories]** → Accept that trade-off for compatibility and
  privacy; tests and code keep bounded internal classifier reasons without emitting source data.

## Migration Plan

1. Land the pure classifier, pre-fetch service guard, and negative/positive regression coverage.
2. Land the Toulouse 3 provider data migration and its real-database round-trip test in the same PR.
3. Update the Architecture Book, run server local-green checks, regenerate OpenAPI from built Nest
   output, and require the committed contract to remain byte-identical.
4. Deploy through the normal server migration path. No backfill or live manual action is required;
   new invalid submissions fail immediately, while an existing stored UI source fails on its next
   otherwise-due attempt without outbound I/O.
5. Roll back with the normal migration down path plus application revert. The classifier never
   mutates stored calendar URLs, and the guarded provider down migration affects only an unchanged
   Toulouse 3 `celcat` row.

## Open Questions

None. Unknown URL shapes deliberately remain eligible until evidence supports another exact rule.
