import { isDevVariant } from "@/config/variant"

// Development and perf builds only: the `mobile/perf/` harness reads these
// lines from logcat to time page crossings and count page mounts.
const enabled = isDevVariant()
const counters = { pageMounts: 0 }

function countPageMount(): number {
  counters.pageMounts += 1
  return counters.pageMounts
}

export const pagingLog = {
  now: (): number => (enabled ? performance.now() : 0),
  commit(center: number, elapsedMs: number): void {
    if (enabled)
      console.log(
        `CALENDAR_PAGING commit center=${center} ms=${elapsedMs.toFixed(1)}`,
      )
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
