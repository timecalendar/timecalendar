// eslint-disable-next-line no-restricted-imports
import { createMMKV } from "react-native-mmkv"

const store = createMMKV({ id: "pager-experiment" })

export const pagerExperiment = {
  spec: "",
  rest: true,
  box: false,
  nogd: false,
  aos: false,
}

function load(value: string) {
  const flags = new Set(value.split(","))
  pagerExperiment.spec = value
  pagerExperiment.rest = !flags.has("norest")
  pagerExperiment.box = flags.has("box")
  pagerExperiment.nogd = flags.has("nogd")
  pagerExperiment.aos = flags.has("aos")
}

load(store.getString("spec") ?? "")
console.log(`CALENDAR_PAGING experiment loaded spec=${pagerExperiment.spec}`)

export function applyPagerExperiment(spec: string | undefined) {
  const value = spec === "none" ? "" : (spec ?? "")
  if (value === (store.getString("spec") ?? "")) return
  store.set("spec", value)
  console.log(`CALENDAR_PAGING experiment stored spec=${value} (restart)`)
}

export function pagerDiag(message: string) {
  console.log(`CALENDAR_PAGING diag ${message}`)
}
