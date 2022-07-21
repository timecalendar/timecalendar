import nbWeeksRenamer from "modules/fetch/renamers/nb-weeks-renamer"
import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

const genericStrategy = new SchoolStrategy({
  school: "generic",
  urlRenamers: [nbWeeksRenamer],
  eventPipes: [],
})

export default genericStrategy
