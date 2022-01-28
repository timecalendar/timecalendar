import ParseTeachersPipe from "modules/fetch/pipes/parse-teachers-pipe"
import sortLocationPipe from "modules/fetch/pipes/sort-location-pipe"
import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"
import esieeGetEventTypePipe from "./esiee-get-event-type-pipe"
import esieeGetUnitNamePipe from "./esiee-get-unit-name-pipe"
import esieeParseDescriptionPipe from "./esiee-parse-description-pipe"
import { ESIEE_SCHOOL } from "./esiee.constants"

const esieeStrategy = new SchoolStrategy({
  school: ESIEE_SCHOOL,
  urlRenamers: [],
  eventPipes: [
    esieeGetUnitNamePipe,
    esieeGetEventTypePipe,
    esieeParseDescriptionPipe,
    sortLocationPipe,
    ParseTeachersPipe(/^[A-Z- ]+\ [A-Z-]+\.$/),
  ],
})

export default esieeStrategy
