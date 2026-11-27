import {
  EGRESS_RELAY_CLIENT_ID,
  EGRESS_RELAY_CLIENT_SECRET,
  POITIERS_RELAY_ORIGIN,
} from "config/constants"
import { IcalFetcher } from "modules/fetch/fetchers/ical-fetcher"
import { ReplaceUrlRenamer } from "modules/fetch/renamers/replace-url-renamer"
import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

const univpoitiersStrategy = new SchoolStrategy({
  school: "univpoitiers",
  match: ["univ-poitiers.fr"],
  urlRenamers: [
    new ReplaceUrlRenamer(
      "http://upplanning.appli.univ-poitiers.fr",
      "https://upplanning.appli.univ-poitiers.fr",
    ),
  ],
  // upplanning drops DigitalOcean addresses: fetch through the egress relay on
  // devmain (platform terraform/envs/infra/timecalendar-egress.tf).
  fetcher: new IcalFetcher({
    withRetries: true,
    relay: {
      host: "upplanning.appli.univ-poitiers.fr",
      path: "/jsp/custom/modules/plannings/anonymous_cal.jsp",
      origin: POITIERS_RELAY_ORIGIN,
      clientId: EGRESS_RELAY_CLIENT_ID,
      clientSecret: EGRESS_RELAY_CLIENT_SECRET,
    },
  }),
  eventPipes: [],
})

export default univpoitiersStrategy
