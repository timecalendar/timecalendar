import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

/**
 * Université Lyon 1 asked us (2026-08) to hit their calendar servers at most
 * once per hour per calendar, so this strategy declares no fetcher, no event
 * pipes and no URL renamers of its own — only the interval.
 *
 * It is not inert beyond that, though. `FetchService.transformUrl` applies
 * *every* registered strategy's URL renamers to a calendar that matches no
 * strategy, and only the matched one once it does. Lyon 1 URLs matched nothing
 * before this file existed, so they were running through univstetienne's
 * host-agnostic `&projectId=-1` -> `&projectId=3` rewrite. Registering here
 * stops that: we now fetch the projectId the user's own export URL carries.
 * That is the intended reading of an ADE URL — `-1` means "the current
 * project", and `3` is a St-Étienne-specific id — but it *is* a change, so it
 * is pinned by a test in fetch.service.test.ts rather than left implicit.
 */
const univlyon1Strategy = new SchoolStrategy({
  school: "univlyon1",
  match: ["univ-lyon1.fr"],
  minSyncIntervalMinutes: 60,
})

export default univlyon1Strategy
