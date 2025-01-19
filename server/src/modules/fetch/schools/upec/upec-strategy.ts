import parseTeachersPipe from "modules/fetch/pipes/parse-teachers-pipe"
import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

const upecStrategy = new SchoolStrategy({
  school: "upec",
  match: ["u-pec.fr"],
  eventPipes: [parseTeachersPipe(/^([A-Z-]{2,} )+[A-Z-]{2,}$/)],
})

export default upecStrategy
