import { runBoundedCalendarSync } from "./calendar-sync-all.service"

const nextTurn = () => new Promise((resolve) => setImmediate(resolve))

describe("runBoundedCalendarSync", () => {
  it("limits work to three and starts no queued calendar after cancellation", async () => {
    const controller = new AbortController()
    const releases: Array<() => void> = []
    const started: number[] = []
    let active = 0
    let peak = 0

    const batch = runBoundedCalendarSync(
      [0, 1, 2, 3, 4, 5, 6],
      async (calendar) => {
        started.push(calendar)
        active++
        peak = Math.max(peak, active)
        await new Promise<void>((resolve) => releases.push(resolve))
        active--
      },
      controller.signal,
    )

    await nextTurn()
    expect(started).toEqual([0, 1, 2])
    expect(peak).toBe(3)

    controller.abort()
    releases.forEach((release) => release())
    await batch

    expect(started).toEqual([0, 1, 2])
    expect(active).toBe(0)
  })

  it("isolates a calendar failure and preserves due order", async () => {
    const started: number[] = []
    const result = await runBoundedCalendarSync([0, 1, 2, 3], async (value) => {
      started.push(value)
      if (value === 1) throw new Error("upstream failed")
    })

    expect(started).toEqual([0, 1, 2, 3])
    expect(result).toEqual({ started: 4, completed: 4 })
  })
})
