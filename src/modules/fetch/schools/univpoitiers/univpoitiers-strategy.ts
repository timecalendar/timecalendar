import { IcalFetcher } from "src/modules/fetch/fetchers/ical-fetcher"
import { ReplaceUrlRenamer } from "../../renamers/replace-url-renamer"
import { SchoolStrategy } from "../../strategies/school-strategy"

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
