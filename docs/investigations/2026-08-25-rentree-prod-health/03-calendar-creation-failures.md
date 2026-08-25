# 03 — Calendar creation fails at rentrée scale

## Symptom

New students frequently cannot add a timetable. Failures rose with rentrée traffic and
now approach or exceed successful creation volume on peak days.

## Evidence

### Volume

| UTC day | Successful creations | Failure rows |
|---|---:|---:|
| 2026-08-11 | 55 | 50 |
| 2026-08-17 | 155 | 141 |
| 2026-08-20 | 404 | 138 |
| 2026-08-21 | 255 | 325 |
| 2026-08-23 | 292 | 337 |
| 2026-08-24 | 457 | 567 |
| 2026-08-25 (partial at 18:15 UTC) | 513 | 360 |

The moving seven-day window contains 2,456 created calendars and 2,112 failure rows for
1,007 distinct submitted URLs. Failure rows can repeat for one URL.

### Leading hosts and failure classes

| Host | Distinct failed URLs | Failure rows | Dominant recorded errors | Diagnosis/live evidence |
|---|---:|---:|---|---|
| `agenda-web-consult.univ-amu.fr` | 280 | 427 | 295 timeouts; 131 no events | A sampled narrow December week returned zero; the same source over a wider range returned 71 events |
| `ade.univ-tours.fr` | 204 | 603 | 595 no events | Login links return HTML; sampled short links returned an empty VCALENDAR; zero school creations in 7d |
| `adecampus.univ-rouen.fr` | 84 | 205 | 188 no events | A four-week export was empty before rentrée; the same source later returned 81 events |
| `edt.univ-lyon1.fr` | 48 | 81 | 81 no events | Narrow/expired windows are common; any remedy must retain the one-fetch/hour policy |
| `planning.univ-st-etienne.fr` | 35 | 95 | 93 no events | Sampled variants returned HTTP 200 with a zero-byte body; changing project id did not help |
| `planning.univ-rennes.fr` | 27 | 111 | 56 no events; 55 HTTP 500 | New host is not matched by the `univ-rennes1.fr` strategy; users also paste `/direct/` web UI links |
| `plannings.ube.fr` | 26 | 42 | 42 no events | Common submissions are portal/encrypted web UI links rather than iCal exports |
| `emploidutemps.univ-reunion.fr` | 23 | 44 | 38 no events; 6 HTTP 500 | Common link shape is the timetable web UI, not an export |
| `edt.univ-tlse3.fr` | 19 | 27 | 25 HTTP 500 | Upstream/server variant failure |
| `upplanning.appli.univ-poitiers.fr` | 18 | 32 | 23 HTTP 500 | Upstream/server variant failure |
| `www.emploisdutemps.uha.fr` | 16 | 28 | 9 timeouts; 11 resets | Intermittent upstream/network failure |
| `proseconsult.umontpellier.fr` | 12 | 24 | 24 no events | Encrypted direct web UI link, not a reusable iCal export |
| `ade.univ-brest.fr` | 7 | 15 | 14 no events | One-week sample returned zero; a wider window returned 167 events |
| `mon-edt.u-pec.fr` | 7 | 13 | 11 no events | Mixed empty-window and timeout behavior |
| `planning.u-bordeaux.fr` | 6 | 7 | 7 TLS certificate failures | Certificate chain cannot be verified; do not “fix” by disabling TLS verification |
| invalid/non-HTTP submissions | 50 | 123 | invalid URL/mixed | Includes non-URL schemes, QR redirectors and unrelated web pages |

No sampled failing URL used `projectId=-1`; the Saint-Étienne `-1 → 3` renamer is not the
general cause.

## Root causes and open hypotheses

1. **Confirmed generic date-window defect.** ADE export URLs often encode the week visible
   in the browser. The generic `nbWeeksRenamer` widens `nbWeeks=N` to a fixed range, but no
   generic renamer replaces an explicit `firstDate`/`lastDate` pair. Legitimate calendars
   are rejected as “No events found” before teaching begins.
2. **Confirmed wrong link class.** Several schools expose web UI, login, encrypted portal
   or short-link URLs that are not reusable iCal feeds. The current onboarding validates
   URL syntax, not feed capability, and gives no school-specific export instructions.
3. **Confirmed upstream/host failures.** Saint-Étienne returned empty bodies; Bordeaux INP,
   Toulouse 3, Poitiers and Rennes returned HTTP 500 in sampled/recorded cases; Bordeaux's
   certificate chain fails validation.
4. **Host/strategy drift.** Rennes moved to `planning.univ-rennes.fr`, while its strategy
   matches only `univ-rennes1.fr`. AMU's academic-year service moved from
   `ade-web-consult` to `agenda-web-consult`.
5. **Timeout/retry amplification.** AMU accounted for 295 ten-second timeouts in the fresh
   seven-day aggregation even though originating live checks from a developer network
   answered in roughly 1.5–2.5 seconds. Egress path, upstream throttling and concurrency
   remain open; 15 sequential retries can turn one failure into 150 seconds of work.
6. **Product-policy ambiguity.** An empty but structurally valid feed can be legitimate
   before courses are published. Rejecting every zero-event calendar makes creation
   brittle; accepting all empty feeds risks storing login/dead links as valid calendars.

## Impact

- At least 1,007 distinct submitted URLs failed in seven days; each can represent a new
  student unable to onboard or repeated attempts by the same student.
- Tours is the clearest school-wide incident: 649 recently active calendars, zero new
  calendars in seven days and zero changed-calendar logs in 24 hours.
- AMU and Rouen have the largest new-host failure volumes. Students receive a generic
  error even when the source is valid but the selected week is empty.
- Repeated ten-second failures consume API capacity and contribute to the restart
  incident.

## Potential solutions

1. **Normalize explicit ADE windows to a bounded, recomputed range.** Apply at creation
   and each sync, with school exceptions and payload/load tests. A rolling window such as
   recent past through the academic year is safer than 2000–2038; longer windows improve
   discovery but increase provider payload and parser work.
2. **Classify link shape and provide school-specific recovery.** Recognize login/web UI,
   encrypted portal, export and redirector shapes before long retries. Return localized
   instructions and support Rennes' new host. This improves user actionability but
   requires maintained per-school knowledge.
3. **Adopt per-domain timeout, retry and circuit policies.** Retry only transient cases,
   cap aggregate deadlines and concurrency, and distinguish DNS/TLS/HTTP/empty-body
   failures. This protects the service but may reduce tolerance of flaky providers.
4. **Define an empty-calendar product state.** Consider accepting a valid VCALENDAR with
   zero events as “waiting for publication,” with background recheck and visible status,
   while still rejecting HTML/login/dead formats. Better pre-rentrée experience, but
   requires a lifecycle and stale-source UX rather than a one-line backend relaxation.
5. **Escalate genuine upstream faults without weakening security.** Share sanitized
   evidence with schools; never disable TLS verification or bypass authentication.

Follow-ups: [TIM-189](/TIM/issues/TIM-189) and [TIM-190](/TIM/issues/TIM-190).
