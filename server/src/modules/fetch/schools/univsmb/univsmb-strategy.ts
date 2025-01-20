import { IcalFetcher } from "modules/fetch/fetchers/ical-fetcher"
import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

const univsmbRenamer = (url: string) => {
  if (url.indexOf("grenet.fr") === -1) return url
  if (url.indexOf("&firstDate=") !== -1) return url
  url = url.replace(
    /&lastDate=([0-9]{4}-[0-9]{2}-[0-9]{2})/,
    "&firstDate=2019-08-26&lastDate=$1",
  )
  return url
}

const univsmbStrategy = new SchoolStrategy({
  school: "univsmb",
  match: ["grenet.fr"],
  urlRenamers: [{ rename: univsmbRenamer }],
  eventPipes: [],
  fetcher: new IcalFetcher({ withRetries: true, useProxy: true }),
})

export default univsmbStrategy
