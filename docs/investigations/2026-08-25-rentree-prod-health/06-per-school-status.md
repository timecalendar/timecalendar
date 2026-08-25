# 06 — Per-school production status

## Symptom

The production incident is not uniform. Some schools continue to produce frequent
calendar changes, while others have cohort-scale expired URLs, high creation failure
counts or no sign of changed timetable data.

## Evidence

The table is a 2026-08-25 approximately 18:15 UTC snapshot. “Active” means accessed in
the prior seven days. “Changes” means distinct calendars with at least one `calendar_log`
row in 24 hours. Failure counts are distinct submitted URLs matched to a known primary
hostname; `—` is unavailable/not safely attributable, not zero. Live results are the
small targeted samples from the originating investigation; most schools were not probed
again to avoid rentrée load.

| School code | Active 7d | Creations 7d | Failed URLs 7d | Expired window | Changes 24h | Live sample | Verdict |
|---|---:|---:|---:|---:|---:|---|---|
| `(no school)` | 6,286 | 1,036 | — | 573 | 574 | Not sampled | Mixed/unclassifiable; large stale cohort |
| `univrouen` | 2,563 | 333 | 84 | 0 | 348 | Four-week empty sample later returned 81 events | Operating, creation degraded by narrow windows |
| `univamu` | 1,448 | 3 | 288 | 1,316 | 6 | Narrow new-host window 0; wider range 71; old host lacks new year | Critical: stale cohort plus new-host timeouts |
| `univsmb` | 902 | 90 | 2 | 0 | 30 | Not sampled | Operating |
| `uha` | 787 | 216 | 16 | 1 | 54 | Recorded resets/timeouts | Operating but upstream/network degraded |
| `esiee` | 721 | 7 | — | 0 | 1 | Not sampled | Low change signal; monitor |
| `univeiffel` | 655 | 45 | 1 | 0 | 10 | Not sampled | Operating, low change signal |
| `univrennes1` | 654 | 67 | 27 | 2 | 27 | New host web UI/HTTP 500; strategy matches old host only | Degraded; host/strategy and link-shape work needed |
| `univtours` | 649 | 0 | 204 | 0 | 0 | Login HTML or empty VCALENDAR | Critical/broken for new creation and updates |
| `upec` | 593 | 75 | 7 | 0 | 9 | Mixed no-events/timeouts | Degraded; monitor |
| `univlyon1` | 424 | 31 | 48 | 386 | 5 | Not resampled | Critical stale cohort; respect one fetch/hour |
| `umontpellier` | 405 | 34 | 12 | 0 | 1 | Encrypted web UI link, not reusable export | Degraded import guidance needed |
| `ubo` | 401 | 82 | 7 | 277 | 7 | One-week sample 0; wider range 167 | Critical stale cohort; normalization likely effective |
| `insastrasbourg` | 384 | 57 | 2 | 1 | 19 | Not sampled | Operating |
| `univrennes2` | 320 | 43 | — | 0 | 5 | Not sampled | Operating, low change signal |
| `ifepsa` | 304 | 37 | — | 0 | 10 | Not sampled | Operating |
| `univpoitiers` | 292 | 89 | 18 | 0 | 22 | Primary host recorded HTTP 500 | Operating with creation degradation |
| `unistra` | 287 | 30 | 1 | 0 | 40 | Not sampled | Operating |
| `parisnanterre` | 206 | 20 | 4 | 0 | 7 | Not sampled | Operating, some invalid/empty hosts |
| `inptoulouse` | 186 | 11 | — | 159 | 2 | Not sampled | Critical stale cohort |
| `univstetienne` | 146 | 0 | 35 | 54 | 0 | All sampled variants returned zero-byte bodies | Critical upstream/source failure |
| `uco` | 142 | 28 | 3 | 0 | 18 | Not sampled | Operating |
| `univbourgogne` | 136 | 20 | 26 | 0 | 18 | Portal/encrypted links dominate failures | Operating calendars; onboarding degraded |
| `univorleans` | 122 | 20 | 6 | 0 | 10 | Recorded timeouts | Operating with intermittent degradation |
| `bordeauxinp` | 100 | 0 | 6 | 98 | 0 | Sampled variants returned HTTP 500 | Critical stale/upstream failure |
| `univnantes` | 71 | 12 | 3 | 0 | 5 | Not sampled | Operating |
| `univgrenoble` | 58 | 16 | 1 | 27 | 4 | Not sampled | Mixed; stale cohort |
| `uca` | 55 | 13 | 3 | 0 | 7 | Not sampled | Operating |
| `univubs` | 51 | 14 | 4 | 0 | 4 | Not sampled | Operating with no-event failures |
| `univlille` | 27 | 1 | — | 0 | 0 | Not sampled | Quiet; insufficient signal |
| `univangers` | 23 | 3 | 1 | 0 | 4 | Not sampled | Operating |
| `univlyon2` | 22 | 0 | — | 0 | 0 | Encrypted `data` sample returned empty | Broken/unsupported source shape |
| `agrosupdijon` | 21 | 2 | — | 0 | 0 | Not sampled | Quiet; monitor with UBE changes |
| `univlehavre` | 18 | 4 | 4 | 0 | 1 | Not sampled | Low volume, degraded |
| `univlorraine` | 18 | 3 | 2 | 0 | 0 | Not sampled | Quiet; insufficient signal |
| `ensicaen` | 12 | 3 | 1 | 0 | 4 | Not sampled | Operating |
| `efrei` | 12 | 2 | — | 0 | 1 | Not sampled | Low volume |
| `ubordeaux` | 11 | 3 | 6 | 0 | 0 | TLS certificate failure on sampled planning host | Degraded; attribution overlaps Bordeaux INP |
| `univtoulon` | 11 | 1 | — | 0 | 0 | Not sampled | Quiet; insufficient signal |
| `univparisdiderot` | 10 | 1 | 1 | 0 | 1 | Not sampled | Low volume |
| `univtoulouse3` | 10 | 0 | 19 | 1 | 1 | Primary host returned HTTP 500 | Broken for new creation |
| `univfcomte` | 9 | 2 | — | 0 | 0 | Not sampled | Quiet; insufficient signal |
| `bdxmontaigne` | 9 | 1 | — | 2 | 0 | Not sampled | Quiet; stale risk |
| `unilim` | 4 | 0 | 1 | 0 | 0 | Not sampled | Broken/insufficient signal |
| `univantilles` | 4 | 1 | — | 0 | 0 | Not sampled | Insufficient signal |
| `iutrodez` | 2 | 0 | — | 0 | 0 | Not sampled | Insufficient signal |
| `upsaclay` | 2 | 0 | 6 | 0 | 0 | Sampled sources returned no events | Degraded, very low linked cohort |

## Root causes and open hypotheses

- **Expired date windows** explain most of AMU, Lyon 1, UBO, INP Toulouse and Bordeaux
  INP exposure.
- **Wrong link shape or host drift** is strongest for Tours, Rennes, Montpellier, UBE,
  Réunion and Lyon 2.
- **Upstream failure** is strongest for Saint-Étienne, Bordeaux INP, Toulouse 3 and parts
  of Poitiers/Rennes.
- **Low/zero change logs alone remain an open signal.** A stable timetable can legitimately
  produce no `calendar_log`, so school verdicts combine volume, failures, expired windows
  and live samples rather than equating zero with outage.

## Impact

The highest-priority cohorts are AMU, Tours, Lyon 1, UBO/Brest, Rouen, Rennes and
Saint-Étienne: together they combine large active populations with either creation
failure, stale-window prevalence or no evidence of updated sources. Small cohorts with
zero changes remain observable risks but should not displace those population-scale
incidents.

## Potential solutions

1. **Use this matrix as a triage queue, refreshed from safe aggregate queries.** Prioritize
   active population × failure/stale share; add uncertainty labels instead of fabricating
   school joins.
2. **Ship generic date-window normalization first.** It covers several large cohorts with
   one bounded mechanism and avoids school-by-school URL storage changes.
3. **Maintain school-specific source status and help.** Encode moved hosts, supported link
   shapes, outage state and rate limits without including private feed URLs.
4. **Add a school-alive dashboard signal.** Combine successful fetch (including unchanged),
   last content change, creation outcome and upstream status. `calendar_log` alone is too
   narrow.
5. **Create an operating cadence for rentrée.** Review the top cohort matrix daily during
   peak weeks, then reduce frequency outside rentrée; this costs operational attention but
   detects annual ADE host/project changes early.

Implementation and operations follow-ups are indexed in [README.md](README.md).
