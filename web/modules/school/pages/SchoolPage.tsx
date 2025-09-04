"use client"

import { SchoolForSeo } from "@timecalendar/api-client"
import { SchoolAbout } from "modules/school/components/SchoolAbout"
import { SchoolCampuses } from "modules/school/components/SchoolCampuses"
import { SchoolCTA } from "modules/school/components/SchoolCTA"
import { SchoolFAQ } from "modules/school/components/SchoolFAQ"
import { SchoolFormations } from "modules/school/components/SchoolFormations"
import { SchoolHero } from "modules/school/components/SchoolHero"
import { SchoolTutorial } from "modules/school/components/SchoolTutorial"
import { SchoolValue } from "modules/school/components/SchoolValue"

interface SchoolPageProps {
  school: SchoolForSeo
}

export function SchoolPage({ school }: SchoolPageProps) {
  console.log(school)

  return (
    <>
      <SchoolHero school={school} />
      <SchoolValue universityName={school.name} />
      <SchoolTutorial universityName={school.name} />
      <SchoolFAQ universityName={school.name} />
      <SchoolCampuses school={school} />
      <SchoolFormations school={school} />
      <SchoolAbout school={school} />
      <SchoolCTA schoolName={school.name} />
    </>
  )
}
