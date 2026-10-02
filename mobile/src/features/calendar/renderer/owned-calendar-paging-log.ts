import { isDevVariant } from "@/config/variant"

// Development and perf builds only: the `mobile/perf/` harness reads these
// lines from logcat to time page crossings and count page mounts.
const enabled = isDevVariant()
const counters = { pageMounts: 0, renders: 0, slots: 0, buildMs: 0 }

function countRender(kind: "column" | "slot"): void {
  if (kind === "column") counters.renders += 1
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
      `CALENDAR_PAGING commit center=${center} ms=${elapsedMs.toFixed(1)} columnRenders=${counters.renders} slotRenders=${counters.slots} presentMs=${counters.buildMs.toFixed(1)}`,
    )
    resetDiagnostics()
  },
  render(kind: "column" | "slot"): void {
    if (enabled) countRender(kind)
  },
  present(elapsedMs: number): void {
    if (enabled) addPresentTime(elapsedMs)
  },
  settle(index: number): void {
    if (enabled) console.log(`CALENDAR_PAGING settle page=${index}`)
  },
  restSnap(index: number): void {
    if (enabled) console.log(`CALENDAR_PAGING rest-snap page=${index}`)
  },
  trace(event: string, x: number, dragging: boolean, momentum: boolean): void {
    if (enabled)
      console.log(
        `CALENDAR_PAGING trace event=${event} x=${x.toFixed(1)} dragging=${dragging} momentum=${momentum}`,
      )
  },
  geometry(
    event: string,
    space: string,
    x: number,
    viewport: number,
    content: number,
    placed: number,
  ): void {
    if (enabled)
      console.log(
        `CALENDAR_PAGING geometry event=${event} space=${space} x=${x.toFixed(1)} viewport=${viewport.toFixed(1)} content=${content.toFixed(1)} placed=${placed.toFixed(1)}`,
      )
  },
  mount(pageKey: string): void {
    if (enabled)
      console.log(
        `CALENDAR_PAGING mount page=${pageKey} total=${countPageMount()}`,
      )
  },
}
