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
import { EXPORT_GUIDE_PROVIDER_SLUG_PATTERN } from "modules/export-guide/models/export-guide.model"

@Injectable()
export class SchoolMapper {
  toSchoolForList(
    { assistant, fallbackAssistant, ...school }: School,
    catalogueVersion: string,
  ): SchoolForList {
    const configuredAssistant = getSchoolAssistant(assistant)
    const legacyAssistant =
      configuredAssistant ?? ensureNotNull(getSchoolAssistant("generic"))
    if (!EXPORT_GUIDE_PROVIDER_SLUG_PATTERN.test(assistant))
      throw new Error("Invalid export-guide provider slug")
    return {
      ...school,
      imageUrl: S3_PUBLIC_BUCKET_CLIENT_URL + school.imageUrl,
      imageUrlDark: school.imageUrlDark
        ? S3_PUBLIC_BUCKET_CLIENT_URL + school.imageUrlDark
        : null,
      assistant: legacyAssistant,
      fallbackAssistant: getSchoolAssistant(fallbackAssistant) ?? undefined,
      exportGuide: {
        providerSlug: assistant,
        requireProgramme: legacyAssistant.requireCalendarName,
        requireConnect: legacyAssistant.requireIntranetAccess,
        catalogueVersion,
      },
    }
  }

  toSchoolForSeo(
    school: School,
    catalogueVersion: string,
    profile?: SchoolProfile,
  ): SchoolForSeo {
    const schoolForList = this.toSchoolForList(school, catalogueVersion)

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
