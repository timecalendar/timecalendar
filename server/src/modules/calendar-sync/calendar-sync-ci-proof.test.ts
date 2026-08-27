import axios from "axios"
import { IcalFetcher } from "modules/fetch/fetchers/ical-fetcher"
import { CalendarSyncAbortError } from "./models/calendar-sync-context"
import { runBoundedCalendarSync } from "./services/calendar-sync-all.service"

const nextTurn = () => new Promise((resolve) => setImmediate(resolve))

describe("calendar sync bounded-work proof", () => {
  it("bounds large metadata-only batches and leaves no retry work detached", async () => {
    const candidates = Array.from({ length: 8 }, (_, index) => {
      const candidate = { id: `calendar-${index}` }
      Object.defineProperty(candidate, "content", {
        get: () => {
          throw new Error("candidate content was hydrated")
        },
      })
      return candidate
    })
    const request = jest.spyOn(axios, "request").mockImplementation(
      (config) =>
        new Promise((_resolve, reject) => {
          const signal = config.signal as AbortSignal | undefined
          signal?.addEventListener(
            "abort",
            () => reject(new Error("transport aborted")),
            { once: true },
          )
        }),
    )
    const controller = new AbortController()
    let active = 0
    let peak = 0
    const started: string[] = []
    const fetcher = new IcalFetcher({ withRetries: true })

    const batch = runBoundedCalendarSync(
      candidates,
      async (candidate) => {
        started.push(candidate.id)
        active++
        peak = Math.max(peak, active)
        try {
          await fetcher.fetch("https://synthetic.invalid", undefined, {
            signal: controller.signal,
          })
        } finally {
          active--
        }
      },
      controller.signal,
    )
    await nextTurn()
    controller.abort(new CalendarSyncAbortError("deadline"))
    await batch

    expect(peak).toBe(3)
    expect(started).toEqual(["calendar-0", "calendar-1", "calendar-2"])
    expect(request).toHaveBeenCalledTimes(3)
    expect(active).toBe(0)
  })
})
