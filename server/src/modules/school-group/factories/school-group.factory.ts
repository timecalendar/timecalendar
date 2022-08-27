import { SchoolGroup } from "modules/school-group/models/school-group.entity"
import { schoolFactory } from "modules/school/factories/school.factory"
import { PartialForFactory } from "modules/shared/types/partial-for-factory"
import { factoryToEntity } from "modules/shared/utils/typeorm/id-to-entity"
import { AppFactory } from "test-utils/factories/app-factory"
import { factoryBuilder } from "test-utils/factories/factory-builder"

export class SchoolGroupFactory extends AppFactory<SchoolGroup> {}

export const schoolGroupFactory = factoryBuilder(() => [
  SchoolGroup,
  SchoolGroupFactory.define(
    ({ associations }) =>
      ({
        groups: [],
        icalUrl: "http://timecalendar.app/ical?project=1",
        school: associations.school || factoryToEntity(schoolFactory()),
      } as PartialForFactory<SchoolGroup> as SchoolGroup),
  ),
])
