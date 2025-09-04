import { createApiInstance } from "@/modules/shared/utils/create-api-instance"
import { SchoolsApi } from "@timecalendar/api-client"
import { cache } from "react"

export const getSchools = cache(async () => {
  const schools = await createApiInstance(SchoolsApi).findSchools()
  return schools.data.schools
})

export const getSchool = cache(async (seoUrl: string) => {
  const schools = await createApiInstance(SchoolsApi).searchSchools({ seoUrl })
  if (schools.data?.length === 0) return null
  return schools.data[0]
})
