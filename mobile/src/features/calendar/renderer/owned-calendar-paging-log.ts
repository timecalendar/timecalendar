import { isDevVariant } from "@/config/variant"

// Development and perf builds only: the `mobile/perf/` harness reads these
// lines from logcat to time page crossings and count page mounts.
const enabled = isDevVariant()
const counters = { pageMounts: 0, renders: 0, slots: 0, buildMs: 0 }

function countRender(kind: "page" | "slot"): void {
  if (kind === "page") counters.renders += 1
  else counters.slots += 1
}

function addPresentTime(elapsedMs: number): void {
  counters.buildMs += elapsedMs
}

function resetDiagnostics(): void {
  counters.renders = 0
  counters.slots = 0
  counters.buildMs = 0
}

function countPageMount(): number {
  counters.pageMounts += 1
  return counters.pageMounts
}

export const pagingLog = {
  now: (): number => (enabled ? performance.now() : 0),
  commit(center: number, elapsedMs: number): void {
    if (!enabled) return
    console.log(
      `CALENDAR_PAGING commit center=${center} ms=${elapsedMs.toFixed(1)} pageRenders=${counters.renders} slotRenders=${counters.slots} presentMs=${counters.buildMs.toFixed(1)}`,
    )
    resetDiagnostics()
  },
  render(kind: "page" | "slot"): void {
    if (enabled) countRender(kind)
  },
  present(elapsedMs: number): void {
    if (enabled) addPresentTime(elapsedMs)
  },
  settle(index: number): void {
    if (enabled) console.log(`CALENDAR_PAGING settle page=${index}`)
  },
  mount(pageKey: string): void {
    if (enabled)
      console.log(
        `CALENDAR_PAGING mount page=${pageKey} total=${countPageMount()}`,
      )
  },
}
