import nbWeeksRenamer from "modules/fetch/renamers/nb-weeks-renamer"
import webcalRenamer from "modules/fetch/renamers/webcal-renamer"
import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

const genericStrategy = new SchoolStrategy({
  school: "generic",
  urlRenamers: [nbWeeksRenamer, webcalRenamer],
  eventPipes: [],
})

export default genericStrategy
