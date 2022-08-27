import { PickType } from "@nestjs/swagger"
import { SchoolGroup } from "modules/school-group/models/school-group.entity"

export class SetSchoolGroupDto extends PickType(SchoolGroup, [
  "groups",
  "icalUrl",
] as const) {}
