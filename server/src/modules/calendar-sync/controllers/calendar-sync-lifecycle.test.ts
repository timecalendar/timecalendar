import { EventEmitter } from "node:events"
import { Request, Response } from "express"
import { CalendarSyncAbortError } from "modules/calendar-sync/models/calendar-sync-context"
import { CalendarSyncAllService } from "modules/calendar-sync/services/calendar-sync-all.service"
import { CalendarSyncService } from "modules/calendar-sync/services/calendar-sync.service"
import { CalendarSyncController } from "./calendar-sync.controller"

describe("CalendarSyncController lifecycle", () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  const makeHarness = () => {
    const request = new EventEmitter() as Request
    const response = new EventEmitter() as Response
    Object.defineProperty(response, "writableEnded", {
      configurable: true,
      value: false,
    })
    let signal: AbortSignal | undefined
    const lastKnownContent = [{ calendar: { id: "calendar" }, events: [] }]
    const syncAllForUser = jest.fn(
      async (_payload, context: { signal?: AbortSignal }) => {
        signal = context.signal
        if (!signal?.aborted) {
          await new Promise<void>(
            (resolve) =>
              signal?.addEventListener("abort", () => resolve(), {
                once: true,
              }),
          )
        }
        return lastKnownContent
      },
    )
    const controller = new CalendarSyncController(
      {} as CalendarSyncService,
      { syncAllForUser } as unknown as CalendarSyncAllService,
    )
    return {
      controller,
      request,
      response,
      lastKnownContent,
      getSignal: () => signal,
    }
  }

  it("aborts child work at the deadline and returns last-known content", async () => {
    const harness = makeHarness()
    const promise = harness.controller.syncCalendars(
      { tokens: ["token"] },
      harness.request,
      harness.response,
    )

    await jest.advanceTimersByTimeAsync(10_000)

    await expect(promise).resolves.toBe(harness.lastKnownContent)
    expect(harness.getSignal()?.reason).toEqual(
      new CalendarSyncAbortError("deadline"),
    )
    expect(harness.request.listenerCount("aborted")).toBe(0)
    expect(harness.response.listenerCount("close")).toBe(0)
  })

  it("aborts child work when the connection closes", async () => {
    const harness = makeHarness()
    const promise = harness.controller.syncCalendars(
      { tokens: ["token"] },
      harness.request,
      harness.response,
    )

    harness.response.emit("close")

    await expect(promise).resolves.toBe(harness.lastKnownContent)
    expect(harness.getSignal()?.reason).toEqual(
      new CalendarSyncAbortError("client_cancelled"),
    )
  })
})
