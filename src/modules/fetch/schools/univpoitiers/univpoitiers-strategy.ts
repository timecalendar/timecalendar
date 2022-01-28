import { IcalFetcher } from "modules/fetch/fetchers/ical-fetcher"
import { ReplaceUrlRenamer } from "modules/fetch/renamers/replace-url-renamer"
import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

const univpoitiersStrategy = new SchoolStrategy({
  school: "univpoitiers",
  urlRenamers: [
    new ReplaceUrlRenamer(
      "http://upplanning.appli.univ-poitiers.fr",
      "https://upplanning.appli.univ-poitiers.fr",
    ),
  ],
  fetcher: new IcalFetcher(true),
  eventPipes: [],
})

export default univpoitiersStrategy
