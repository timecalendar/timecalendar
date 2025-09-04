import { PickType } from "@nestjs/swagger"
import { SchoolProfile } from "modules/school/models/entities/school-profile.entity"
import { SchoolForList } from "./find-schools-rep.dto"

export class SchoolProfileGet extends PickType(SchoolProfile, [
  "campuses",
  "formations",
  "description",
  "studentCount",
  "domains",
  "excellenceTitle",
  "excellenceDescription",
  "tags",
  "campusLocationContext",
] as const) {}

export class SchoolForSeo extends SchoolForList {
  profile?: SchoolProfileGet
}
