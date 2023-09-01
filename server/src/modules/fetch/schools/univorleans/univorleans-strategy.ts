import ParseTeachersPipe from "modules/fetch/pipes/parse-teachers-pipe"
import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

const univorleansStrategy = new SchoolStrategy({
  school: "univorleans",
  eventPipes: [ParseTeachersPipe(/^[A-Z *-]+$/)],
})

export default univorleansStrategy
