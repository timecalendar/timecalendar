import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

/**
 * Université Lyon 1 asked us (2026-08) to hit their calendar servers at most
 * once per hour per calendar, so this strategy exists only to raise the
 * minimum sync interval. Everything else is the generic behaviour.
 */
const univlyon1Strategy = new SchoolStrategy({
  school: "univlyon1",
  match: ["univ-lyon1.fr"],
  minSyncIntervalMinutes: 60,
})

export default univlyon1Strategy
