## Context

`POST /calendars` currently accepts the submitted URL and optional school identity, asks
`FetchService` to select/transform a strategy, fetches and parses iCal, rejects zero events,
and lets Nest serialize whichever exception escaped. The mobile `calendar-sources` seam
types every generated error as `ApiError<unknown>`, injects a temporary `"Dev import"`
school/name, and renders one retry/report state. It cannot tell a login page from an
upstream outage.

The 2026-08-25 production investigation provides safe host/path-level evidence for the
required schools. Tours login/short links, Réunion timetable UI, Montpellier encrypted
direct links, UBE portal/encrypted links, Lyon 2 encrypted data links, and Rennes
`/direct/` links are unsupported inputs. Rennes also has a legitimate new host that the
old strategy misses. Saint-Étienne zero-byte responses and Bordeaux INP/Toulouse 3 server
failures are upstream incidents. Empty but valid calendars outside those known shapes
remain ambiguous and must not be globally relabeled as an outage.

The submitted URL can contain a login, password, encrypted blob, or timetable resource
identifier. Today it can reach the development API console, `calendar_failure.url`, raw
serialized error text, a metric hostname, mobile feedback parameters, and Crashlytics via
an untyped error. The new recovery path must expose only bounded keys at every diagnostic
edge. The raw URL remains necessary only in memory for the immediate upstream request and
in the calendar row after a successful import.

## Goals / Non-Goals

**Goals:**

- distinguish unsupported link shapes from retryable upstream outages before presenting
  recovery;
- cover the nine named school modes and match valid Rennes new-host exports;
- keep classification policy server-owned and mobile copy FR/EN-owned;
- return a stable typed error contract that the generated client and feature data seam can
  narrow without parsing messages;
- prohibit source URLs, credentials, query values, school database IDs, and timetable
  resource IDs from failure persistence, logs, metrics, Crashlytics, and feedback context;
- preserve useful bounded diagnostics with school code, failure classification, help key,
  and retryability;
- provide deterministic automated UI/contract/privacy proofs and a non-blocking device
  checklist for the no-KVM host.

**Non-Goals:**

- authenticating to school portals, accepting user credentials, scraping protected pages,
  resolving encrypted portal state, or disabling TLS verification;
- solving generic ADE date-window normalization, accepting empty calendars, or changing
  sync retry/circuit policy;
- adding a remote help-content service, opening school URLs from the recovery panel, or
  changing native/store configuration;
- changing the Flutter application or unrelated school strategies.

## Decision 1 — Classify through one server-owned, value-blind recovery catalog

Add a pure calendar-import recovery module used by calendar creation before fetch and by
the fetch error boundary after an attempt. Its public domain values are closed unions:

- classification: `unsupported_link`, `upstream_unavailable`, `invalid_calendar`, or
  `unknown`;
- help key: one allowlisted key per required school/mode plus bounded generic keys;
- retryable: derived from classification, never accepted from exception text.

Catalog rules match a normalized URL only by lower-cased hostname, pathname shape, and the
*presence/name* of known query parameters. They never copy, return, persist, or log query
values. A known valid export shape takes precedence over a broad host rule. The catalog
then uses the resolved school code (from `schoolId` through `SchoolRepository`, or a
host-derived safe match) to choose help without returning the database ID.

The initial catalog covers:

| School/help cohort | Recognition and result |
| --- | --- |
| Rennes (`univrennes1`) | Add `planning.univ-rennes.fr` to strategy matching; `/direct/` or login/UI shapes are `unsupported_link`; valid export paths continue to fetch |
| Tours (`univtours`) | Known login and short-link/UI shapes are `unsupported_link`; HTML/login or known empty short-link outcomes retain the Tours export-help key |
| Réunion | Timetable UI shapes on `emploidutemps.univ-reunion.fr` are `unsupported_link` |
| Montpellier (`umontpellier`) | Encrypted/direct web-UI shapes on `proseconsult.umontpellier.fr` are `unsupported_link` |
| UBE (`univbourgogne`) | Portal/encrypted UI shapes on `plannings.ube.fr` are `unsupported_link` |
| Lyon 2 (`univlyon2`) | Encrypted `data`/web-UI shapes are `unsupported_link` |
| Saint-Étienne (`univstetienne`) | Zero-byte/known empty upstream responses are `upstream_unavailable` |
| Bordeaux INP (`bordeauxinp`) | TLS and 5xx provider failures are `upstream_unavailable`; TLS verification stays enabled |
| Toulouse 3 (`univtoulouse3`) | Provider 5xx failures are `upstream_unavailable` |

Post-fetch mapping sees only structured facts produced at the fetch boundary: response
kind/status family, content kind, parser outcome, and empty-body/empty-calendar state. It
does not inspect a raw error message for URLs. Authentication-required or returned HTML
becomes `unsupported_link`; timeout/DNS/TLS/5xx and the named empty-body incidents become
`upstream_unavailable`; non-iCal content becomes `invalid_calendar`; all else is
`unknown`. An empty, structurally valid VCALENDAR is not globally called an outage; only a
cataloged school/shape such as the Tours short-link case receives specific guidance.

Alternatives rejected:

- Client-only matching duplicates policy and cannot reliably distinguish a provider
  response from a pasted page.
- Exception-message parsing is unstable and can itself propagate secrets.
- Treating every zero-event feed as unsupported or unavailable would mislabel legitimate
  pre-rentrée calendars, an explicitly unresolved product policy.

## Decision 2 — Return one typed, closed recovery error body

Calendar creation failures that are safe to explain return the existing non-2xx status
with a documented `CalendarImportErrorDto` body:

```ts
{
  code: "calendar_import_failed"
  classification: "unsupported_link" | "upstream_unavailable" |
    "invalid_calendar" | "unknown"
  helpKey: CalendarImportHelpKey
  retryable: boolean
}
```

The body contains no URL, hostname, database ID, resource ID, exception message, or
credential. `@ApiUnprocessableEntityResponse`/`@ApiBadRequestResponse` (as appropriate for
the existing status mapping) documents the DTO so OpenAPI and Orval generate a reusable
type. The feature data seam catches `ApiError<unknown>`, validates the body with a total
pure type guard, and falls back to the generic unknown recovery model on malformed,
legacy, network, timeout, or untyped errors. UI never imports generated types.

The mobile create seam is extended to accept the selected school context and sends the
real `schoolId` (or a bounded fallback school name/name) instead of `"Dev import"`. That
identity is request data required for calendar ownership/classification, not telemetry;
all logging and diagnostic sinks redact request bodies.

Alternatives rejected:

- Returning localized prose from the server couples language selection to the backend and
  makes copy changes contract changes.
- Returning school code plus a generic category makes every client reconstruct the help
  matrix; an allowlisted `helpKey` is the stable contract.
- Encoding errors in a successful 2xx response obscures failure semantics and complicates
  the existing mutation.

## Decision 3 — Keep localization and recovery actions in the mobile feature

`calendar-sources/data` maps the typed API error to a small domain recovery model. The
screen renders an accessible alert heading/body and actions from flat typed i18n keys.
Every required school has complete EN and FR title/instruction copy that tells the student
where to obtain a public iCal export or, for outage cohorts, that the school service is
currently unavailable. Copy must never advise entering credentials or bypassing login.

Retry is shown only when `retryable` is true (upstream/unknown network cases). Unsupported
and invalid shapes keep the URL input editable and provide a localized correction action
that focuses the field. Report remains available after an operational failure, but it
passes only `classification` and `helpKey`; it no longer forwards `calendarUrl` or
`schoolId`. Crashlytics receives a newly constructed sanitized error whose message contains
only those bounded keys and the static feature context, never the original `ApiError`.

Component tests switch the real i18n instance between EN and FR and cover at least one
unsupported school and one outage school, retry visibility, correction/focus behavior,
unknown fallback, and accessibility live-region/role semantics. A mail-safe Maestro flow
uses a deterministic E2E server fixture or endpoint behavior to exercise visible recovery
without contacting a university or sending feedback. Device-only screen-reader, large
text, and both-platform visual checks are recorded in a `(HUMAN: …)` inbox note.

Alternatives rejected:

- Keeping a universal Retry invites repeated requests for links that can never succeed.
- Forwarding the attempted URL to feedback repeats the sensitive-data leak the recovery
  design is meant to remove.

## Decision 4 — Make diagnostics bounded and scrub retained raw failures

Calendar-sync metrics drop the source-domain label and use only `school`,
`classification`, `help_key`, `status`, and `action` (plus another explicitly allowlisted
bounded error-kind label if needed). No metric or trace attribute receives a URL/host/path,
query value, raw exception text, or database/resource ID. Development `customFetch`
logging records method, route template/path, and status only; it never prints request or
response bodies for calendar creation.

Replace new `CalendarFailure` writes with safe fields for school code, classification,
help key, retryable, and a bounded error kind. A migration scrubs existing `url` and raw
`error` values rather than copying them into the new columns, and prevents subsequent raw
writes. The implementation may retain redacted compatibility columns only if a database
constraint makes non-redacted content impossible; the entity/repository API must not
accept a URL or `Error` object. Migration tests seed synthetic credential/resource-bearing
values, run `up`, and prove no forbidden substring survives; `down` may restore schema
shape with redacted placeholders but must never reconstruct sensitive data.

This privacy migration makes rollback to an older writer unsafe if that writer can store
raw failures. Deployment notes therefore require either rolling forward the classifier
fix or pairing any server rollback with the migration's safe compatibility path; privacy
must not be disabled as a rollback shortcut.

Alternatives rejected:

- Hashing full URLs still creates a stable identifier for private feeds and prevents
  neither credential ingestion nor linkage.
- Retaining raw rows until ordinary expiry leaves the known exposure in place.
- Storing raw exception stacks/messages can embed Axios request configuration and URLs.

## Decision 5 — Extend current mobile architecture without a new ADR

The server classifier is a new server domain module. Mobile continues to use the existing
`calendar-sources/data` generated-client boundary, feature UI, Firebase seam, and flat
typed FR/EN catalogs. The typed error mapping and privacy rule are reusable current-state
contracts, so implementation updates `data.md`, `features.md`, and the Architecture Book
changelog. This does not introduce a costly-to-reverse mobile dependency or ownership
pattern and therefore does not earn an ADR. If implementation requires a new cross-feature
error framework or a different API ownership boundary, the Applier must stop and add an
ADR before proceeding.

## Risks / Trade-offs

- **[School portals change paths yearly]** → Keep rules pure, table-driven, and covered by
  sanitized host/path fixtures; unknown shapes fall back safely instead of guessing.
- **[A broad rule rejects a valid export]** → Give explicit export shapes precedence and
  test both supported and unsupported examples for every cataloged host.
- **[Upstream response details are lost]** → Retain bounded status-family/error-kind
  diagnostics; use live, consented reproduction outside telemetry when deeper diagnosis is
  necessary.
- **[Typed error metadata is absent on an older server]** → Mobile's total parser renders
  the generic unknown state and never crashes or exposes the raw body.
- **[Privacy migration complicates server rollback]** → Verify forward/backward schema
  behavior in PostgreSQL and prohibit rollback paths that re-enable raw failure writes.
- **[No local emulator/simulator proof]** → Make Jest and CI E2E deterministic; inbox
  irreducible device checks without blocking implementation.

## Migration Plan

1. Add the pure recovery catalog/classifier and structured fetch outcomes with focused
   server tests, including valid Rennes new-host exports and all named failure cohorts.
2. Add the safe persistence shape and migration; prove synthetic sensitive values are
   scrubbed and rollback never restores them.
3. Expose the typed controller error DTO, regenerate OpenAPI and Orval, and prove drift is
   clean.
4. Thread real selected-school context through the mobile data seam, add total typed-error
   mapping, sanitized Crashlytics/feedback behavior, FR/EN recovery UI, and component tests.
5. Update reusable Architecture Book guidance, add the non-blocking device inbox note, and
   add/extend the mail-safe Maestro recovery flow.
6. Run focused server/mobile tests, local type/lint/coverage gates, OpenSpec validation,
   contract regeneration/no-diff verification, and the labeled CI proof required for
   native recovery states.

Rollback removes the UI consumption first while preserving generic fallback, but it must
not restore raw diagnostics. The classifier/API can roll forward independently of mobile
because older clients ignore the structured body. Schema rollback is permitted only when
its tested compatibility path keeps sensitive fields redacted.

## Open Questions

None for implementation. If a named school's current export-vs-UI path cannot be derived
from the committed sanitized investigation evidence and existing strategy tests, the
Applier must escalate that school fixture to the Founding Engineer rather than probe a
private URL, guess a resource identifier, or broaden the matcher.
