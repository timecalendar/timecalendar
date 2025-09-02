"use client"

import { SchoolHero } from "modules/school/components/SchoolHero"
import { SchoolCampuses } from "modules/school/components/SchoolCampuses"
import { SchoolValue } from "modules/school/components/SchoolValue"
import { SchoolTutorial } from "modules/school/components/SchoolTutorial"
import { SchoolFormations } from "modules/school/components/SchoolFormations"
import { SchoolFAQ } from "modules/school/components/SchoolFAQ"
import { SchoolAbout } from "modules/school/components/SchoolAbout"
import { SchoolCTA } from "modules/school/components/SchoolCTA"

interface SchoolPageProps {
  universitySlug: string
}

export function SchoolPage(_props: SchoolPageProps) {
  // For now hardcoded for Paris Nanterre, will be dynamic later
  const universityData = {
    name: "Université Paris Nanterre",
    slug: "universite-paris-nanterre",
    logo: "https://arscan.parisnanterre.fr/wp-content/uploads/2019/06/logo-u.jpg", // Placeholder
    campuses: [
      { name: "Campus de Nanterre", location: "Nanterre (principal)" },
      { name: "Campus Ville-d'Avray", location: "Ville-d'Avray" },
      { name: "Campus Saint-Cloud", location: "Saint-Cloud" },
      { name: "Campus La Défense", location: "La Défense" },
    ],
    formations: [
      "Licence Droit",
      "Licence Économie",
      "Master Lettres Modernes",
      "Master Sciences Politiques",
      "Licence Psychologie",
      "Master Droit Public",
    ],
    description:
      "Située à proximité du quartier d'affaires de La Défense, l'Université Paris Nanterre accueille chaque année plus de 30 000 étudiants. Elle est reconnue dans les domaines du droit, de l'économie, des lettres, des sciences sociales et du sport.",
    studentCount: "30 000",
    domains: ["Droit", "Économie", "Lettres", "Sciences sociales", "Sport"],
  }

  return (
    <>
      <SchoolHero university={universityData} />
      <SchoolValue universityName={universityData.name} />
      <SchoolTutorial universityName={universityData.name} />
      <SchoolFAQ universityName={universityData.name} />
      <SchoolCampuses
        campuses={universityData.campuses}
        universityName={universityData.name}
      />
      <SchoolFormations
        formations={universityData.formations}
        universityName={universityData.name}
      />
      <SchoolAbout university={universityData} />
      <SchoolCTA universityName={universityData.name} />
    </>
  )
}
