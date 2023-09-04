import { IcalFetcher } from "modules/fetch/fetchers/ical-fetcher"
import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

const univamuStrategy = new SchoolStrategy({
  school: "univamu",
  fetcher: new IcalFetcher({ withRetries: true }),
})

export default univamuStrategy
