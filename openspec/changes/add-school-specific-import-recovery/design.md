## Context

`POST /calendars` currently fetches and parses the submitted URL during creation. A
failure is saved to `calendar_failure`, then the original Nest exception escapes. The
server does not distinguish an ADE HTML/login/web-UI URL from a valid feed whose university
host is down. `IcalUrlScreen` likewise exposes only `isError`, records the rejected object,
and renders one generic retry state.

The rentrée investigation established two actionable categories:

- **Unsupported link shape:** Tours login/`.shu` links; Réunion and Montpellier encrypted
  `direct` links; UBE `portal`/`encryptedUrl`; Lyon 2 encrypted `data`; Rennes’ `direct`
  web UI. A retry cannot make these into iCal feeds.
- **Upstream unavailable:** recognized feed requests for Saint-Étienne return an empty
  body, while Bordeaux INP and Toulouse 3 return HTTP 500. The submitted shape can be
  correct, but TimeCalendar cannot fetch it now.

Rennes also moved from the matcher’s `univ-rennes1.fr` suffix to
`planning.univ-rennes.fr`, so a valid feed on the new host currently misses its strategy.
The mobile create DTO still uses temporary `schoolName: "Dev import"`; classification
therefore must work from URL host/path without requiring a selected school id.

Constraints: the server remains the authority; no protected-page scraping or auth bypass;
the committed OpenAPI/Orval seam remains authoritative; user copy is FR/EN client-owned;
and source URLs may carry passwords, encrypted values, resource ids, or calendar tokens.

## Goals / Non-Goals

**Goals:**

- deterministically recognize every school/failure mode named by TIM-190;
- distinguish `unsupported_link` from `upstream_unavailable` at the API boundary;
- provide stable school/help metadata for localized recovery;
- add Rennes’ new host to strategy matching without weakening host matching;
- eliminate request/response-body logging in the mobile API seam and persist only bounded,
  sanitized server diagnostics for new creation failures;
- make expected recovery states accessible, testable, and non-noisy in Crashlytics;
- preserve generic behavior for unknown hosts/errors.

**Non-Goals:**

- logging in to, decrypting, or scraping ADE web pages;
- automatically repairing dead short links or university outages;
- accepting empty calendars, widening `firstDate`/`lastDate`, migrating stale calendars,
  changing retry/concurrency policy, or solving the broader AMU timeout issue;
- changing the legacy Flutter client or introducing a native dependency;
- changing database schema or purging historical `calendar_failure` rows.

## Decision 1 — Classify with a pure server-owned host/path registry

Add a pure import-source classifier under the fetch/calendar-sync domain. It parses with
`URL`, lowercases the hostname, and compares exact hosts or dot-boundary-safe suffixes plus
path/query-key *names*. It never returns or records query values. Its table carries
`school`, link-shape matchers, and the stable remediation `help` category.

The minimum matrix is:

| School id | Recognized evidence | Classification / help |
| --- | --- | --- |
| `rennes` | `planning.univ-rennes.fr/direct/...` | `unsupported_link` / `export_ical` |
| `rennes` | a direct iCal endpoint on the new host | normal fetch; Rennes strategy matches |
| `tours` | login/my-planning HTML or `.shu` short link | `unsupported_link` / `export_or_renew_link` |
| `reunion` | encrypted `direct` web-UI shape | `unsupported_link` / `export_ical` |
| `montpellier` | `proseconsult.umontpellier.fr` encrypted `direct` shape | `unsupported_link` / `export_ical` |
| `ube` | `plannings.ube.fr/portal/...` or `encryptedUrl` | `unsupported_link` / `export_ical` |
| `lyon2` | recognized Lyon 2 host with encrypted `data` web-UI shape | `unsupported_link` / `export_ical` |
| `saint_etienne` | recognized feed shape fails/returns no events | `upstream_unavailable` / `retry_later` |
| `bordeaux_inp` | recognized feed shape fails | `upstream_unavailable` / `retry_later` |
| `toulouse3` | `edt.univ-tlse3.fr` feed shape fails | `upstream_unavailable` / `retry_later` |

Preflight unsupported shapes before outbound fetch. After a fetch/parse failure, map only
recognized school feed hosts to the upstream category; unknown hosts retain the existing
generic exception behavior. This avoids claiming every empty third-party feed is a school
outage.

Alternatives rejected: client-only URL rules would duplicate server authority and become
stale; matching query values would inspect secret material; scraping/login automation is
explicitly out of scope; treating all `No events found` as outage would misclassify valid
empty calendars and unrelated feeds.

## Decision 2 — Publish a closed, body-safe error contract

Document `CalendarImportErrorDto` as the 422/502 error response for calendar creation:

```text
code:   unsupported_link | upstream_unavailable
school: rennes | tours | reunion | montpellier | ube | lyon2 |
        saint_etienne | bordeaux_inp | toulouse3
help:   export_ical | export_or_renew_link | retry_later
```

Use HTTP 422 for a recognized unsupported input shape and 502 for a recognized upstream
failure. The body contains no free-form upstream message and never echoes the URL. The
success `{ token }` response and unknown-error behavior remain compatible.

The controller explicitly documents both responses so OpenAPI generation produces a
generated DTO and typed mutation error body. The implementation regenerates
`openapi/openapi.json` first and `mobile/src/api/generated/` second, never hand-edits
either, and runs both drift gates.

Alternatives rejected: localized server prose couples API and UI language; a single 400
does not express retryability; arbitrary message parsing is brittle; returning suggested
URLs risks leaking or fabricating credentials/resource ids.

## Decision 3 — Map recovery in the mobile data seam, not the screen

Extend the calendar-sources create/add data seam to recognize `ApiError` plus the generated
error DTO and return/throw a small domain `ImportRecovery` value. A pure exhaustive mapper
turns the closed server tuple into a typed recovery kind, school identifier, translation
key, and action policy. The screen renders the key through `t()` and does not inspect
generated DTOs.

- `unsupported_link`: explain the named school’s export/copy steps, keep the input editable,
  and offer an edit/try-again action rather than a blind network retry.
- `upstream_unavailable`: explain that the named school service is unavailable and expose
  retry.
- unknown API/network/local persistence failure: retain the generic retryable error.

FR and EN catalogs own all school-specific prose. Exhaustiveness and catalog parity make a
new server enum fail loudly during implementation instead of silently falling back.

Alternatives rejected: translating in the server; branching inline in JSX; or presenting
all errors as retryable.

## Decision 4 — Expected recovery is not Crashlytics noise; diagnostics are bounded

Recognized `unsupported_link` and `upstream_unavailable` responses are expected product
states and are not sent to Crashlytics. Unknown failures are still recorded, but the app
must create a sanitized diagnostic containing only context, error class, and HTTP status;
it must not pass an `ApiError.body`, submitted URL, request body, or response body.

The shared mobile `customFetch` development log is reduced to method/path/status only.
This removes request bodies (source URLs) and response bodies (including calendar tokens
or resource ids) for every generated operation, a safer reusable seam contract.

On the server, new `calendar_failure` rows use the existing `url` column for the parsed
hostname only and serialize an allowlisted diagnostic (`name`, `code`, `school`, `help` as
applicable), never the source URL, query, stack, upstream response, or free-form message.
Metrics remain bounded to school/domain/category labels. No schema migration is required;
historical-row retention is explicitly separate.

Alternatives rejected: redacting selected query keys is denylist-based and will miss new
credentials; hashing full URLs still permits correlation of secret resource identifiers;
dropping all diagnostics would remove useful school-health signals.

## Decision 5 — Prove the vertical slice without live university dependencies

Server unit/service tests use synthetic URLs with placeholder query values and mocked
fetches; no real credentials/resource ids enter fixtures. They cover every matrix row,
Rennes positive/negative matching, status/body serialization, unknown fallback, and
sanitized persistence/metrics.

Mobile data tests mock `customFetch` and drive the real generated mutation; UI tests mock
the data seam and assert localized accessible guidance, edit vs retry actions, and
Crashlytics policy. A Maestro flow uses a synthetic, secret-free recognized web-UI URL to
exercise one deterministic unsupported-link round trip against the local server on both CI
platforms after the PR receives `run-e2e`; no university host is contacted because
classification happens before fetch. Component/server tests cover outage variants without
making flaky production calls.

The no-KVM host runs only server/mobile non-device checks. A migration inbox note tagged
`(HUMAN: …)` records VoiceOver/TalkBack, large text, native behavior, and real-school
recovery checks on physical devices; it is evidence for the required QA stage, not an
implementation blocker.

## Risks / Trade-offs

- **[School changes another host/path]** → unknown shapes safely fall back to the generic
  state; keep the registry pure/table-driven and add evidence-backed fixtures.
- **[A recognized host has a legitimate empty feed]** → classify upstream only after a
  valid feed shape fails, keep the wording temporary, and avoid claiming the URL is wrong.
- **[Broad host matching creates false positives]** → use parsed hostname boundary
  matching and explicit paths/query-key names, never substring matching on the whole URL.
- **[Contract rollout briefly mixes client/server versions]** → old clients already
  treat non-2xx bodies generically; new clients retain generic fallback for old servers.
- **[Sanitized failure rows reduce forensic detail]** → retain hostname, stable category,
  school, and timestamps; use aggregate health signals rather than secret URLs.
- **[Copy becomes stale]** → server sends stable categories, while client-owned FR/EN
  copy can evolve without changing classification semantics.

## Migration Plan

1. Add classifier/error DTO and tests, wire calendar creation, and add Rennes host matching.
2. Regenerate/verify `openapi/openapi.json`, then regenerate/verify the mobile client.
3. Add mobile mapping/UI/i18n/telemetry changes and deterministic test coverage.
4. Update Architecture Book and create the `(HUMAN: …)` device QA note.
5. Run focused local server/mobile checks, strict OpenSpec validation, and the CI proof;
   route the completed PR through the required QA stage.

Deployment needs no schema migration, feature flag, credential, or console action. Old
clients remain compatible. Roll back with a normal revert of server, contract, generated
client, mobile, and docs changes together; classified failures then return to the prior
generic state.

## Open Questions

None blocking. Exact school-facing sentences should be refined during implementation
against the investigation evidence, without adding guessed URLs or steps that bypass
authentication.
