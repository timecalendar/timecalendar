import hyperplanningDescriptionPipe from "src/modules/fetch/pipes/hyperplanning-description-pipe"
import { SchoolStrategy } from "src/modules/fetch/strategies/school-strategy"

const univlehavreStrategy = new SchoolStrategy({
  school: "univlehavre",
  eventPipes: [hyperplanningDescriptionPipe],
})

export default univlehavreStrategy
