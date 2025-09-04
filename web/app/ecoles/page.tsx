import { HomeLayout } from "@/modules/shared/components/layouts/HomeLayout"
import { getSchools } from "modules/school/data/requests/schools"
import { SchoolsListingPage } from "modules/school/pages/SchoolsListingPage"
import { Metadata } from "next"
import { env } from "next-runtime-env"
import { ENV_VARS } from "@/lib/constants/env-vars"

export const metadata: Metadata = {
  title: "Universités et écoles - TimeCalendar | Emploi du temps étudiant",
  description:
    "Découvrez toutes les universités et écoles françaises compatibles avec TimeCalendar. Accédez facilement à votre emploi du temps universitaire depuis l'application mobile.",
  keywords: [
    "emploi du temps",
    "écoles françaises",
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
    title: "Universités et écoles - TimeCalendar",
    description:
      "Découvrez toutes les universités et écoles françaises compatibles avec TimeCalendar. Accédez facilement à votre emploi du temps universitaire depuis l'application mobile.",
    type: "website",
    locale: "fr_FR",
    url: `${env(ENV_VARS.NEXT_PUBLIC_FRONTEND_URL)}/ecoles`,
    images: [
      {
        url: `${env(ENV_VARS.NEXT_PUBLIC_FRONTEND_URL)}/assets/images/logo.png`,
        width: 600,
        height: 600,
        alt: "TimeCalendar - Emploi du temps universitaire",
      },
    ],
    siteName: "TimeCalendar",
  },
  twitter: {
    card: "summary_large_image",
    title: "Universités et écoles - TimeCalendar",
    description:
      "Découvrez toutes les universités et écoles françaises compatibles avec TimeCalendar. Accédez facilement à votre emploi du temps universitaire depuis l'application mobile.",
    images: [
      `${env(ENV_VARS.NEXT_PUBLIC_FRONTEND_URL)}/assets/images/logo.png`,
    ],
    site: "@samuelprak_",
  },
  alternates: {
    canonical: `${env(ENV_VARS.NEXT_PUBLIC_FRONTEND_URL)}/ecoles`,
  },
}

export default async function EcolesPage() {
  const schools = await getSchools()

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Écoles et Universités - TimeCalendar",
    description:
      "Découvrez toutes les universités et écoles françaises compatibles avec TimeCalendar",
    url: `${env(ENV_VARS.NEXT_PUBLIC_FRONTEND_URL)}/ecoles`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: schools.length,
      itemListElement: schools.map((school, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "EducationalOrganization",
          name: school.name,
          url: `${env(ENV_VARS.NEXT_PUBLIC_FRONTEND_URL)}${school.seoUrl}`,
          image: school.imageUrl,
          description: `Emploi du temps ${school.name} disponible sur TimeCalendar. Accédez facilement à votre planning universitaire.`,
        },
      })),
    },
    provider: {
      "@type": "Organization",
      name: "TimeCalendar",
      url: env(ENV_VARS.NEXT_PUBLIC_FRONTEND_URL),
    },
  }

  return (
    <HomeLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <SchoolsListingPage schools={schools} />
    </HomeLayout>
  )
}
