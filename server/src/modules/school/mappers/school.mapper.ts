import { Injectable } from "@nestjs/common"
import { S3_PUBLIC_BUCKET_CLIENT_URL } from "config/constants"
import { SchoolForList } from "modules/school/models/dto/find-schools-rep.dto"
import {
  SchoolForSeo,
  SchoolProfileGet,
} from "modules/school/models/dto/school-for-seo.dto"
import { SchoolProfile } from "modules/school/models/entities/school-profile.entity"
import { getSchoolAssistant } from "modules/school/models/school-assistant.model"
import { School } from "modules/school/models/school.entity"
import ensureNotNull from "modules/shared/utils/types/ensure-not-null"

@Injectable()
export class SchoolMapper {
  toSchoolForList({
    assistant,
    fallbackAssistant,
    ...school
  }: School): SchoolForList {
    return {
      ...school,
      imageUrl: S3_PUBLIC_BUCKET_CLIENT_URL + school.imageUrl,
      assistant: ensureNotNull(getSchoolAssistant(assistant)),
      fallbackAssistant: getSchoolAssistant(fallbackAssistant) ?? undefined,
    }
  }

  toSchoolForSeo(school: School, profile?: SchoolProfile): SchoolForSeo {
    const schoolForList = this.toSchoolForList(school)

    return {
      ...schoolForList,
      profile: profile ? this.toSchoolProfileData(profile) : undefined,
    }
  }

  private toSchoolProfileData(profile: SchoolProfile): SchoolProfileGet {
    return {
      campuses: profile.campuses,
      formations: profile.formations,
      description: profile.description,
      studentCount: profile.studentCount,
      domains: profile.domains,
      excellenceTitle: profile.excellenceTitle,
      excellenceDescription: profile.excellenceDescription,
      tags: profile.tags,
      campusLocationContext: profile.campusLocationContext,
    }
  }
}
