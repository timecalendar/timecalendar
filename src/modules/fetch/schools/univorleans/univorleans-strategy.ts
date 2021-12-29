import ParseTeachersPipe from "src/modules/fetch/pipes/parse-teachers-pipe"
import { SchoolStrategy } from "src/modules/fetch/strategies/school-strategy"

const univorleansStrategy = new SchoolStrategy({
  school: "univorleans",
  eventPipes: [ParseTeachersPipe(/^[A-Z \*-]+$/)],
})

export default univorleansStrategy
