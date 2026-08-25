## Context

Calendar creation and update both reach `FetchService.fetchEvents`, which resolves a school
strategy and transforms the source URL immediately before calling its fetcher. The original
URL is stored on the calendar and is not overwritten by the transformed value. This is the
right seam for a rolling window: creation uses today's dates, every later eligible sync
recomputes them, and the user's source remains recoverable.

The generic strategy currently rewrites `nbWeeks` to
`firstDate=2000-01-01&lastDate=2038-01-01`. It does not touch URLs that already carry an
explicit pair, which is why copied ADE links expire. School strategies compose after the
generic renamers unless `inheritGenericUrlRenamers` is false. Notable contracts are
Université Bourgogne's generic opt-out, Université Savoie Mont Blanc's last-date-only
special case, St-Étienne's project rewrite, and Lyon 1's 60-minute minimum sync interval.

## Goals / Non-Goals

**Goals:**

- Repair structurally valid ADE iCal exports with explicit, narrow, expired, or `nbWeeks`
  date windows at every upstream fetch.
- Bound upstream query span while retaining useful history and future schedule coverage.
- Preserve school-specific transformation and fetch-cadence behavior.
- Make recognition, date arithmetic, composition, and repeat-sync behavior deterministic
  and testable.

**Non-Goals:**

- Accept arbitrary ADE web UI, HTML, or non-iCal links.
- Change the product rule that an empty fetched calendar fails creation.
- Persist a rewritten URL or add a database field/configurable policy.
- Change sync scheduling, public APIs, generated clients, migrations, deploy config, or
  legacy Flutter.

## Decision 1 — Normalize only recognized ADE iCal export shapes

Add a dedicated URL renamer that parses with `URL`/`URLSearchParams` and changes a URL only
when all of these are true:

- protocol is HTTP(S), after the existing `webcal` conversion;
- path is an ADE planning iCal endpoint (`anonymous_cal.jsp` or `direct_cal.jsp` under the
  planning modules path);
- `calType=ical` is present; and
- either both `firstDate` and `lastDate` are present, or `nbWeeks` is present.

For an eligible URL, delete `nbWeeks`, set one canonical value for each date key, and retain
the values of all other query parameters. A missing half-pair is left alone unless
`nbWeeks` is also present. Invalid URLs and lookalike/UI URLs are no-ops and remain subject
to the existing fetcher's validation.

**Why:** structural parsing handles parameter order, encoding, fragments, and a date key in
first position without expanding the client-side acceptance surface. Rewriting any URL that
happens to contain the parameter names would mutate non-ADE providers. Regex replacement
was considered and rejected because it cannot robustly distinguish those cases or
canonicalize duplicate keys.

## Decision 2 — Use a rolling UTC date window of minus/plus 12 calendar months

For current UTC date `D`, emit:

- `firstDate = D - 12 calendar months`
- `lastDate = D + 12 calendar months`

Format both as `yyyy-MM-dd`, clamp leap-day arithmetic to the last valid day of the target
month, and treat the ADE range as inclusive. Inject the clock (or expose a pure helper) so
tests pin ordinary dates, month/year boundaries, and 29 February without changing the
process clock.

**Why:** one year of retained history avoids making recent semesters disappear when a sync
replaces calendar content, while one future year covers the next academic cycle. The range
contains at most 731 dates. By comparison, 2000-01-01 through 2038-01-01 contains 13,881
dates: the new selectable span is about 5.3% as large (roughly 19 times smaller). It is
about 26 times wider than a four-week link, an intentional cost to stop a copied narrow
export expiring. Actual response bytes are not guaranteed to scale linearly—ADE projects
usually expose only their active academic data and event density varies—but the server-side
query horizon is now finite and reviewable.

A fixed academic-year window was rejected because it drops a large block of history at one
annual boundary. A shorter past window was rejected because sync replaces, rather than
merges, the stored upstream content. Keeping 2000–2038 was rejected because it provides no
meaningful load bound; a configurable/database policy was rejected as unnecessary state.

## Decision 3 — Run the bounded renamer at the generic fetch-time seam

Place the ADE window renamer after `webcal` conversion and use it for both explicit pairs
and the existing `nbWeeks` workaround. Remove the 2000–2038 expansion. Keep transformation
ephemeral: `Calendar.url` continues to store the exact user input, while each
`FetchService.fetchEvents` call derives its current fetch URL.

Also make the no-matching-strategy transformation list include the generic strategy exactly
once, followed by the non-generic school strategies. Today generic is applied twice in this
fallback. Its old renamers happen to be idempotent, but a clock-dependent renamer must not
sample two dates if a call crosses UTC midnight. Preserve the existing fallback application
of school renamers and pin that behavior with tests.

**Why:** changing `CalendarSyncService` creation/update paths separately would duplicate
policy and risk drift. Persisting normalized dates would recreate the expiry bug. Sampling
the clock once per fetch and applying generic once makes a fetch internally consistent.

## Decision 4 — Preserve school exceptions through existing composition

- A strategy with `inheritGenericUrlRenamers: false` remains entirely outside generic ADE
  normalization (notably Université Bourgogne).
- A last-date-only URL remains untouched by generic normalization, so Université Savoie
  Mont Blanc can retain its existing incomplete-pair repair.
- School renamers still run after generic normalization, so St-Étienne's project-specific
  rewrite and other school transforms remain authoritative.
- Lyon 1 inherits the generic date policy, but strategy resolution and
  `minSyncIntervalMinutes: 60` are unchanged. Date normalization does not initiate an extra
  request; it only changes the URL of an already-due request.

**Why:** a new global pre-strategy rewrite would bypass explicit opt-outs. Replacing each
school's renamer individually would duplicate policy and miss calendars resolved only by URL.

## Decision 5 — Prove behavior below the public API boundary

Add pure renamer tests for recognition/no-op cases, query preservation, duplicate date
canonicalization, `nbWeeks`, rolling dates, and leap-day clamping. Add real-strategy-list
tests for generic ADE, Bourgogne, Savoie Mont Blanc, St-Étienne, and Lyon 1. At the calendar
sync service level, use the real transformation path with a mocked fetcher and an injected
clock/fake time to show creation and a later sync use recomputed dates while the stored URL
does not change. Retain/extend the Lyon 1 batch-sync regression showing repeated client syncs
within an hour make one upstream fetch and a post-hour sync makes the second.

The server suites run in `ci-build-deploy.yml`, so these focused tests are the CI proof. A
native Maestro flow would depend on a live third-party ADE service and be flaky; create a
`docs/react-native-migration/inbox/` note tagged `(HUMAN: …)` for one post-deploy import and
resync check on a real device.

## Risks / Trade-offs

- **[Old events beyond 12 months disappear after the next successful replacement sync]** →
  Keep a full year of history, document the retention implication, and pin the window as a
  named policy constant so a future product decision can adjust it deliberately.
- **[URL serialization changes byte representation]** → Preserve semantic query values and
  the fragment; never persist the transformed URL. Tests compare parsed parameters where
  ordering is not contractual.
- **[An ADE variant uses a different export path or omits `calType=ical`]** → Leave it
  unchanged rather than broadening acceptance silently; add a representative fixture before
  expanding the recognizer.
- **[Generic composition changes an exception]** → Cover opt-out, partial-pair, project
  rewrite, unmatched fallback, and Lyon 1 with the real registered strategy list.
- **[The wider window increases load versus a four-week URL]** → Accept the bounded
  26-times date-horizon increase to make the calendar durable; keep the 19-times reduction
  versus the old workaround and retain existing 30/60-minute fetch cadence controls.

## Migration Plan

1. Ship the pure parser/renamer and replace the generic `nbWeeks` expansion.
2. Ship strategy and sync regression coverage plus the Architecture Book update and human
   verification inbox note in the same PR.
3. Deploy normally; no data migration or backfill is needed. Existing stored URLs begin
   using the rolling window on their next eligible fetch.
4. Roll back by reverting the renamer change. Stored URLs were never mutated, so rollback
   restores prior behavior without data repair.

## Open Questions

None. The 12-month past/future bounds are deliberately named and documented so later
telemetry or product evidence can support a separate adjustment.
