import { SchoolProfile } from "modules/school/models/entities/school-profile.entity"
import { schoolFactory } from "modules/school/factories/school.factory"
import { PartialForFactory } from "modules/shared/types/partial-for-factory"
import { factoryToEntity } from "modules/shared/utils/typeorm/id-to-entity"
import { AppFactory } from "test-utils/factories/app-factory"
import { factoryBuilder } from "test-utils/factories/factory-builder"

export class SchoolProfileFactory extends AppFactory<SchoolProfile> {}

export const schoolProfileFactory = factoryBuilder(() => [
  SchoolProfile,
  SchoolProfileFactory.define(
    ({ associations }) =>
      ({
        campuses: [
          { name: "Campus Principal", location: "Paris, France" },
          { name: "Campus Annexe", location: "Lyon, France" },
        ],
        formations: ["Informatique", "Game Design", "Marketing Digital"],
        description:
          "Une école d'excellence dans le domaine du gaming et de l'informatique.",
        studentCount: 1200,
        domains: ["Gaming", "Informatique", "Design"],
        excellenceTitle: "Excellence en Gaming",
        excellenceDescription:
          "Nous formons les futurs leaders de l'industrie du gaming.",
        tags: ["gaming", "esport", "développement"],
        campusLocationContext:
          "Situés au coeur des principales métropoles françaises",
        school: associations.school || factoryToEntity(schoolFactory()),
      }) as PartialForFactory<SchoolProfile> as SchoolProfile,
  ),
])
