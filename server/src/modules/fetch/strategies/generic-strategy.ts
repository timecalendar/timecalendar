import adeExportWindowRenamer from "modules/fetch/renamers/ade-export-window-renamer"
import webcalRenamer from "modules/fetch/renamers/webcal-renamer"
import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

const genericStrategy = new SchoolStrategy({
  school: "generic",
  urlRenamers: [webcalRenamer, adeExportWindowRenamer],
  eventPipes: [],
})

export default genericStrategy
