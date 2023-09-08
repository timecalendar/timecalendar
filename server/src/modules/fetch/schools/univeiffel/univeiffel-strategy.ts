import parseTeachersPipe from "modules/fetch/pipes/parse-teachers-pipe"
import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

const univeiffelStrategy = new SchoolStrategy({
  school: "univeiffel",
  eventPipes: [parseTeachersPipe(/^([a-zA-Z-]{2,} )+[A-Z][a-zA-Z-]+$/)],
})

export default univeiffelStrategy
