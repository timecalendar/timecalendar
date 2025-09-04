"use client"

import { SchoolForList } from "@timecalendar/api-client"
import { SchoolsGrid } from "modules/school/components/SchoolsGrid"
import { SchoolsHero } from "modules/school/components/SchoolsHero"

interface SchoolsListingPageProps {
  schools: SchoolForList[]
}

export function SchoolsListingPage({ schools }: SchoolsListingPageProps) {
  return (
    <>
      <SchoolsHero />
      <SchoolsGrid schools={schools} />
    </>
  )
}
