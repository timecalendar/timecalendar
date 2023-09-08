import parseTeachersPipe from "modules/fetch/pipes/parse-teachers-pipe"
import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

const univorleansStrategy = new SchoolStrategy({
  school: "univorleans",
  eventPipes: [parseTeachersPipe(/^[A-Z *-]+$/)],
})

export default univorleansStrategy
