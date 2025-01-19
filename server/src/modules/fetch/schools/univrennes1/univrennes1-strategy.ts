import { IcalFetcher } from "modules/fetch/fetchers/ical-fetcher"
import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

const univrennes1Strategy = new SchoolStrategy({
  school: "univrennes1",
  match: ["univ-rennes1.fr"],
  fetcher: new IcalFetcher({ withRetries: true }),
})

export default univrennes1Strategy
