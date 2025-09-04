import { generateSchoolMetadata } from "@/app/universites/[seoSlug]/metadata"
import { getSchool } from "@/modules/school/data/requests/schools"
import { SchoolPage } from "modules/school/pages/SchoolPage"
import { HomeLayout } from "modules/shared/components/layouts/HomeLayout"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export type Props = {
  params: Promise<{
    seoSlug: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoSlug } = await params
  return generateSchoolMetadata(`/ecoles/${seoSlug}`)
}

export default async function SchoolPageRoute({ params: _params }: Props) {
  const params = await _params
  const school = await getSchool(`/ecoles/${params.seoSlug}`)
  if (!school) {
    return notFound()
  }

  return (
    <HomeLayout>
      <SchoolPage school={school} />
    </HomeLayout>
  )
}
