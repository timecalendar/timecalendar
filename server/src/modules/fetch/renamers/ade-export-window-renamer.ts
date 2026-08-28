import { getAdeExportWindow } from "modules/fetch/renamers/ade-export-window"
import { UrlRenamer } from "modules/fetch/renamers/url-renamer"

const ADE_ICAL_PATH =
  /\/jsp\/custom\/modules\/plannings\/(?:anonymous_cal|direct_cal)\.jsp$/

export class AdeExportWindowRenamer implements UrlRenamer {
  constructor(private readonly currentDate: () => Date = () => new Date()) {}

  rename(url: string) {
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return url
    }

    if (
      !["http:", "https:"].includes(parsedUrl.protocol) ||
      !ADE_ICAL_PATH.test(parsedUrl.pathname) ||
      parsedUrl.searchParams.get("calType") !== "ical"
    ) {
      return url
    }

    const hasExplicitPair =
      parsedUrl.searchParams.has("firstDate") &&
      parsedUrl.searchParams.has("lastDate")
    if (!hasExplicitPair && !parsedUrl.searchParams.has("nbWeeks")) {
      return url
    }

    const { firstDate, lastDate } = getAdeExportWindow(this.currentDate())
    parsedUrl.searchParams.delete("nbWeeks")
    parsedUrl.searchParams.set("firstDate", firstDate)
    parsedUrl.searchParams.set("lastDate", lastDate)
    return parsedUrl.toString()
  }
}

const adeExportWindowRenamer = new AdeExportWindowRenamer()

export default adeExportWindowRenamer
