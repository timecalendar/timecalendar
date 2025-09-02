import { SchoolPage } from "modules/school/pages/SchoolPage"
import { HomeLayout } from "modules/shared/components/layouts/HomeLayout"
import { Metadata } from "next"

interface SchoolPageProps {
  params: Promise<{
    universitySlug: string
  }>
}

export async function generateMetadata({
  params: _params,
}: SchoolPageProps): Promise<Metadata> {
  const params = await _params

  // For now, hardcoded for Paris Nanterre, but will be dynamic later
  const universityName = "Université Paris Nanterre"

  return {
    title: `Emploi du temps ${universityName} - TimeCalendar`,
    description: `Consultez votre emploi du temps ${universityName} facilement avec TimeCalendar. Vos cours, TD et CM toujours à jour sur mobile et bientôt sur web.`,
    keywords: [
      "emploi du temps",
      "université paris nanterre",
      "calendrier cours",
      "planning étudiant",
      "TimeCalendar",
      "ENT nanterre",
      "cours université",
      "licence droit",
      "licence économie",
      "master lettres",
    ],
    openGraph: {
      title: `Emploi du temps ${universityName} - TimeCalendar`,
      description: `Accédez à vos cours ${universityName} en un clic. Plus besoin de naviguer dans l'ENT compliqué !`,
      type: "website",
      locale: "fr_FR",
    },
    twitter: {
      card: "summary_large_image",
      title: `Emploi du temps ${universityName} - TimeCalendar`,
      description: `Consultez vos cours ${universityName} facilement avec TimeCalendar`,
    },
    alternates: {
      canonical: `/school/${params.universitySlug}`,
    },
  }
}

export default async function SchoolPageRoute({
  params: _params,
}: SchoolPageProps) {
  const params = await _params

  return (
    <HomeLayout>
      <SchoolPage universitySlug={params.universitySlug} />
    </HomeLayout>
  )
}
