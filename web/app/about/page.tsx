import { HomeLayout } from "modules/shared/components/layouts/HomeLayout"
import { AboutPage } from "modules/about/pages/AboutPage"

export const metadata = {
  title: "À propos - TimeCalendar",
  description:
    "Découvrez TimeCalendar, votre interface simple et intuitive pour vos emplois du temps universitaires.",
}

function About() {
  return (
    <HomeLayout>
      <AboutPage />
    </HomeLayout>
  )
}

export default About
