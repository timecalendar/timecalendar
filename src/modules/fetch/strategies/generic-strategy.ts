import nbWeeksRenamer from "../renamers/nb-weeks-renamer"
import { SchoolStrategy } from "./school-strategy"

const genericStrategy = new SchoolStrategy({
  school: "generic",
  urlRenamers: [nbWeeksRenamer],
  eventPipes: [],
})

export default genericStrategy
