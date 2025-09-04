import { getSchool } from "@/modules/school/data/requests/schools"
import { Metadata } from "next"

export async function generateSchoolMetadata(
  seoUrl: string,
): Promise<Metadata> {
  const school = await getSchool(seoUrl)

  if (!school) {
    return {}
  }

  const universityName = school.name

  return {
    title: `Emploi du temps ${universityName} - TimeCalendar`,
    description: `Consultez votre emploi du temps ${universityName} facilement avec TimeCalendar. Vos cours, TD et CM toujours à jour sur mobile et bientôt sur web.`,
    keywords: [
      "emploi du temps",
      school.name.toLocaleLowerCase(),
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
      canonical: school.seoUrl,
    },
  }
}
