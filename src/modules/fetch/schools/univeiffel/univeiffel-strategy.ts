import ParseTeachersPipe from "src/modules/fetch/pipes/parse-teachers-pipe"
import { SchoolStrategy } from "src/modules/fetch/strategies/school-strategy"

const univeiffelStrategy = new SchoolStrategy({
  school: "univeiffel",
  eventPipes: [ParseTeachersPipe(/^([a-zA-Z-]{2,} )+[A-Z][a-zA-Z-]+$/)],
})

export default univeiffelStrategy
