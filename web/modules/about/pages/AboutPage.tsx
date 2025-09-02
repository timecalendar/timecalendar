import { AboutBeta } from "modules/about/components/AboutBeta"
import { AboutHero } from "modules/about/components/AboutHero"
import { AboutProcess } from "modules/about/components/AboutProcess"

export function AboutPage() {
  return (
    <>
      <AboutHero />
      <AboutProcess />
      <AboutBeta />
    </>
  )
}
