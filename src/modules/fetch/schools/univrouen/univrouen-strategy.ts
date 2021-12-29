import { ReplaceUrlRenamer } from "../../renamers/replace-url-renamer"
import { SchoolStrategy } from "../../strategies/school-strategy"

const univrouenStrategy = new SchoolStrategy({
  school: "univrouen",
  urlRenamers: [
    new ReplaceUrlRenamer(
      "http://ade-as.univ-rouen.fr:8080/",
      "http://adecampus.univ-rouen.fr/",
    ),
  ],
  eventPipes: [],
})

export default univrouenStrategy
