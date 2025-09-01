import { ReplaceUrlRenamer } from "modules/fetch/renamers/replace-url-renamer"
import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

const univstetienneStrategy = new SchoolStrategy({
  school: "univstetienne",
  match: ["univ-st-etienne.fr"],
  urlRenamers: [
    new ReplaceUrlRenamer(
      "&projectId=-1",
      "&projectId=3", // 2025-2026
    ),
  ],
  eventPipes: [],
})

export default univstetienneStrategy
