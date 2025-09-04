import { HomeLayout } from "@/modules/shared/components/layouts/HomeLayout"
import { getSchools } from "modules/school/data/requests/schools"
import { SchoolsListingPage } from "modules/school/pages/SchoolsListingPage"

export default async function EcolesPage() {
  const schools = await getSchools()

  return (
    <HomeLayout>
      <SchoolsListingPage schools={schools} />
    </HomeLayout>
  )
}
