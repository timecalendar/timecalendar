import ParseTeachersPipe from "modules/fetch/pipes/parse-teachers-pipe"
import sortLocationPipe from "modules/fetch/pipes/sort-location-pipe"
import esieeGetEventTypePipe from "modules/fetch/schools/esiee/esiee-get-event-type-pipe"
import esieeGetUnitNamePipe from "modules/fetch/schools/esiee/esiee-get-unit-name-pipe"
import esieeParseDescriptionPipe from "modules/fetch/schools/esiee/esiee-parse-description-pipe"
import { ESIEE_SCHOOL } from "modules/fetch/schools/esiee/esiee.constants"
import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

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
