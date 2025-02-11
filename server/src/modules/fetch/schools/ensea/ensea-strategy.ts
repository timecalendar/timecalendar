import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

export const enseaRenamer = (url: string) => {
  if (url.indexOf("ensea.fr") === -1) return url
  if (!url.startsWith("http://")) {
    url = `http://${url}`
  }
  url = url.replace("direct/ade.ensea.fr/", "")
  return url
}

const enseaStrategy = new SchoolStrategy({
  school: "ensea",
  match: ["ensea.fr"],
  urlRenamers: [{ rename: enseaRenamer }],
  eventPipes: [],
})

export default enseaStrategy
