import { ReplaceUrlRenamer } from "modules/fetch/renamers/replace-url-renamer"
import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

const univrouenStrategy = new SchoolStrategy({
  school: "univrouen",
  match: ["univ-rouen.fr"],
  urlRenamers: [
    new ReplaceUrlRenamer(
      "http://ade-as.univ-rouen.fr:8080/",
      "http://adecampus.univ-rouen.fr/",
    ),
  ],
  eventPipes: [],
})

export default univrouenStrategy
