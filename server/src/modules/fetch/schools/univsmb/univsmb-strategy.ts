import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

const univsmbRenamer = (url: string) => {
  if (url.indexOf("ade6-usmb-ro.grenet.fr") === -1) return url
  if (url.indexOf("&firstDate=") !== -1) return url
  url = url.replace(
    /&lastDate=([0-9]{4}-[0-9]{2}-[0-9]{2})/,
    "&firstDate=2019-08-26&lastDate=$1",
  )
  return url
}

const univsmbStrategy = new SchoolStrategy({
  school: "univsmb",
  match: ["ade6-usmb-ro.grenet.fr"],
  urlRenamers: [{ rename: univsmbRenamer }],
  eventPipes: [],
})

export default univsmbStrategy
