import hyperplanningDescriptionPipe from "modules/fetch/pipes/hyperplanning-description-pipe"
import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

const univlehavreStrategy = new SchoolStrategy({
  school: "univlehavre",
  match: ["univ-lehavre.fr"],
  eventPipes: [hyperplanningDescriptionPipe],
})

export default univlehavreStrategy
