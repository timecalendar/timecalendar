# 04 — Existing calendars silently remain on last year's timetable

## Symptom

Recently active users can continue seeing old events—or no new events—because their
stored ADE source URL has an explicit end date in the past. An empty/error sync preserves
last-good content and the app does not distinguish “unchanged” from “source stale.”

## Evidence

- 19,573 non-deleted calendars were accessed in the preceding seven days.
- 2,897 (14.8%) contain an explicit `lastDate` earlier than the current date.
- Largest affected cohorts:

| School | Active 7d | Expired explicit window | Share |
|---|---:|---:|---:|
| AMU | 1,448 | 1,316 | 90.9% |
| Lyon 1 | 424 | 386 | 91.0% |
| UBO/Brest | 401 | 277 | 69.1% |
| INP Toulouse | 186 | 159 | 85.5% |
| Bordeaux INP | 100 | 98 | 98.0% |
| Saint-Étienne | 146 | 54 | 37.0% |
| No school attached | 6,286 | 573 | 9.1% |

- AMU's older `ade-web-consult` academic-year source still serves old events but not the
  new year; new-year exports use `agenda-web-consult`. Widening the old host alone cannot
  manufacture the new academic-year resource.
- In the 24-hour change-log signal, Tours, Saint-Étienne, Bordeaux INP and Lyon 2 had zero
  calendars with successful changes; AMU had only six despite 1,448 active calendars.
  These zeros are not proof alone, but align with the URL and live-feed evidence.
- `POST /calendars/sync` returns last-good public calendar content after caught per-calendar
  sync failures. This preserves offline usefulness but does not carry a stale-source
  warning to the client.

## Root cause

ADE embeds a bounded academic/week window in the exported URL. TimeCalendar stores that
URL as calendar identity and reuses it indefinitely. The generic fetch strategy widens
`nbWeeks`, but not explicit date pairs, so the calendar ages out even while its token is
still actively used.

For AMU, annual host/project movement is a second root cause: the old resource can remain
technically reachable while containing only the prior academic year. The application has
no first-class model for “source moved,” “source expired,” or “waiting for publication.”

## Impact

- 2,897 recently active calendars are deterministically exposed to stale-window behavior.
- Users may trust last year's timetable because old content is intentionally retained
  after failure and no visible freshness warning accompanies it.
- Schools with very high affected shares—AMU, Lyon 1, INP Toulouse and Bordeaux INP—can
  experience near-cohort-wide failure during rentrée.
- Blind background retries add upstream traffic and service load without recovering a
  moved academic-year source.

## Potential solutions

1. **Normalize date windows dynamically at fetch time, not by bulk rewriting stored
   URLs.** This recovers most expired-window calendars while keeping private stored URLs
   untouched and recomputing the range each sync. It does not solve moved hosts/projects.
2. **Introduce a stale-source state and recovery contract.** Track last successful fetch,
   last content change, repeated empty/error class and detectable expired window; preserve
   last-good events but show “may be out of date” with a safe re-add path. More product and
   contract work, but removes the silent-failure mode.
3. **Provide AMU-specific academic-year migration guidance.** Prompt affected users to
   obtain a new export from the new host; investigate whether a deterministic server-side
   mapping exists without guessing resource ids. Clear and safe, but requires user action
   where identity cannot be mapped.
4. **Use a controlled backfill only for proven deterministic mappings.** A server migration
   or bulk URL rewrite could recover cohorts quickly, but is human-gated, privacy-sensitive
   and hard to roll back; never infer new resource identifiers.

Follow-ups: [TIM-189](/TIM/issues/TIM-189) and [TIM-191](/TIM/issues/TIM-191).
