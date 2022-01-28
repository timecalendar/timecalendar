import { IcalFetcher } from "modules/fetch/fetchers/ical-fetcher"
import { SchoolStrategy } from "../../strategies/school-strategy"

const univamuStrategy = new SchoolStrategy({
  school: "univamu",
  fetcher: new IcalFetcher(true),
})

export default univamuStrategy
