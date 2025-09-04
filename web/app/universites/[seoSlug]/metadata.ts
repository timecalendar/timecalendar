import { getSchool } from "@/modules/school/data/requests/schools"
import { Metadata } from "next"
import { env } from "next-runtime-env"
import { ENV_VARS } from "@/lib/constants/env-vars"

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
    description: `Accédez facilement à votre emploi du temps ${universityName} depuis l'application mobile.`,
    keywords: [
      "emploi du temps",
      universityName.toLocaleLowerCase(),
      "écoles françaises",
      ...(school.profile?.campusLocationContext
        ? [
            "universités " +
              school.profile.campusLocationContext.toLocaleLowerCase(),
          ]
        : []),
      "universités France",
      "planning étudiant",
      "calendrier cours",
      "TimeCalendar",
      "ENT université",
      "emploi du temps étudiant",
      "formations supérieures",
      "établissements enseignement supérieur",
    ],
    openGraph: {
      title: `Emploi du temps ${universityName} - TimeCalendar`,
      description: `Accédez facilement à votre emploi du temps ${universityName} depuis l'application mobile.`,
      type: "website",
      locale: "fr_FR",
      images: school.imageUrl ? [{ url: school.imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `Emploi du temps ${universityName} - TimeCalendar`,
      description: `Accédez facilement à votre emploi du temps ${universityName} depuis l'application mobile.`,
      images: school.imageUrl ? [school.imageUrl] : undefined,
    },
    alternates: {
      canonical: `${env(ENV_VARS.NEXT_PUBLIC_FRONTEND_URL)}${school.seoUrl}`,
    },
  }
}
