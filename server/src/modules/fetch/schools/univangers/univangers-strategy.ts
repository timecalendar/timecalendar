import { parseFromDescriptionPipe } from "modules/fetch/pipes/parse-from-description-pipe"
import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

const univangersStrategy = new SchoolStrategy({
  school: "univangers",
  match: ["univ-angers.fr"],
  eventPipes: [
    parseFromDescriptionPipe([
      {
        field: "title",
        regex: /^Matière : (.*)$/,
        removeFromDescription: true,
      },
      {
        field: "teachers",
        regex: /^Personnel : (.*)$/,
        removeFromDescription: true,
      },
    ]),
  ],
})

export default univangersStrategy
