import type { NotificationSubscriptionCreate } from "@/api/generated/timeCalendar.schemas"

import {
  createNotificationSyncRuntime,
  type NotificationSyncRuntimeDependencies,
} from "./notification-sync-runtime"

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

async function flush(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

function harness(overrides: Partial<NotificationSyncRuntimeDependencies> = {}) {
  let generation = 0
  let dirty = false
  const transport = jest.fn<
    Promise<void>,
    [NotificationSubscriptionCreate, AbortSignal]
  >()
  transport.mockResolvedValue(undefined)
  const recordError = jest.fn()
  const resetIntent = jest.fn(() => {
    generation = 0
    dirty = false
  })
  const dependencies: NotificationSyncRuntimeDependencies = {
    getPreferences: () => ({
      frequency: "immediately",
      nbDaysAhead: 7,
      isActive: true,
    }),
    getToken: async () => "token-a",
    transport,
    recordError,
    isDirty: () => dirty,
    getGeneration: () => generation,
    markDirty: () => {
      generation += 1
      dirty = true
      return { generation, rolledOver: false }
    },
    acknowledge: (candidate) => {
      if (!dirty || candidate !== generation) return false
      dirty = false
      return true
    },
    resetIntent,
    ...overrides,
  }
  const runtime = createNotificationSyncRuntime(dependencies)
  const ready = () =>
    runtime.updateCalendars({ calendars: [], ready: true, revision: "1" })
  return {
    runtime,
    ready,
    transport,
    recordError,
    resetIntent,
    isDirty: () => dirty,
    generation: () => generation,
  }
}

describe("notification sync runtime", () => {
  afterEach(() => jest.useRealTimers())

  it("publishes immutable shared status and disposes subscribers", async () => {
    const h = harness()
    h.ready()
    const listener = jest.fn()
    h.runtime.subscribe(listener)
    h.runtime.start()
    await flush()
    expect(h.runtime.getSnapshot()).toEqual({ state: "acknowledged" })
    expect(listener).toHaveBeenCalled()
    listener.mockClear()
    h.runtime.dispose()
    h.runtime.invalidate()
    await flush()
    expect(listener).not.toHaveBeenCalled()
  })

  it("waits separately for unloaded calendars and a missing token", async () => {
    const unloaded = harness()
    unloaded.runtime.start()
    await flush()
    expect(unloaded.runtime.getSnapshot()).toEqual({
      state: "waiting",
      reason: "calendars",
    })
    expect(unloaded.transport).not.toHaveBeenCalled()

    const noToken = harness({ getToken: async () => null })
    noToken.ready()
    noToken.runtime.start()
    await flush()
    expect(noToken.runtime.getSnapshot()).toEqual({
      state: "waiting",
      reason: "registration",
    })
    expect(noToken.transport).not.toHaveBeenCalled()
  })

  it("sends loaded-empty calendars as an empty array", async () => {
    const h = harness()
    h.ready()
    h.runtime.updateLocale("en")
    h.runtime.updateTimezone("America/Montreal")
    h.runtime.start()
    await flush()
    expect(h.transport).toHaveBeenCalledWith(
      expect.objectContaining({
        calendarIds: [],
        locale: "en",
        timezone: "America/Montreal",
      }),
      expect.any(AbortSignal),
    )
  })

  it("serializes A to B and coalesces changes into the latest snapshot", async () => {
    const first = deferred<void>()
    const h = harness()
    h.transport.mockImplementationOnce(() => first.promise)
    h.ready()
    h.runtime.start()
    await flush()
    expect(h.transport).toHaveBeenCalledTimes(1)

    h.runtime.updateToken("token-b")
    h.runtime.updateToken("token-c")
    await flush()
    expect(h.transport).toHaveBeenCalledTimes(1)
    first.resolve(undefined)
    await flush()

    expect(h.transport).toHaveBeenCalledTimes(2)
    expect(h.transport.mock.calls[1]?.[0].fcmToken).toBe("token-c")
    expect(h.isDirty()).toBe(false)
  })

  it("rechecks identity after asynchronous token resolution", async () => {
    const token = deferred<string | null>()
    const h = harness({ getToken: () => token.promise })
    h.ready()
    h.runtime.start()
    await flush()
    h.runtime.updateToken("new-token")
    token.resolve("old-token")
    await flush()
    expect(h.transport).toHaveBeenCalledTimes(1)
    expect(h.transport.mock.calls[0]?.[0].fcmToken).toBe("new-token")
  })

  it("makes stale success and failure inert", async () => {
    const first = deferred<void>()
    const h = harness()
    h.transport.mockImplementationOnce(() => first.promise)
    h.ready()
    h.runtime.start()
    await flush()
    h.runtime.updateToken("token-b")
    first.reject(new Error("token-a secret-calendar-id payload"))
    await flush()
    expect(h.recordError).not.toHaveBeenCalled()
    expect(h.transport).toHaveBeenCalledTimes(2)
    expect(h.runtime.getSnapshot()).toEqual({ state: "acknowledged" })
  })

  it("uses three active retry delays and then stops with dirty error", async () => {
    jest.useFakeTimers()
    const h = harness()
    h.transport.mockRejectedValue(new Error("network"))
    h.ready()
    h.runtime.start()
    await flush()
    expect(h.runtime.getSnapshot()).toEqual({ state: "error" })

    for (const delay of [1_000, 5_000, 30_000]) {
      await jest.advanceTimersByTimeAsync(delay)
      await flush()
    }
    expect(h.transport).toHaveBeenCalledTimes(4)
    expect(jest.getTimerCount()).toBe(0)
    expect(h.isDirty()).toBe(true)
  })

  it("background cancels retry while foreground and manual retry resume", async () => {
    jest.useFakeTimers()
    const h = harness()
    h.transport.mockRejectedValue(new Error("network"))
    h.ready()
    h.runtime.start()
    await flush()
    expect(jest.getTimerCount()).toBe(1)
    h.runtime.setActive(false)
    expect(jest.getTimerCount()).toBe(0)
    h.runtime.foreground()
    await flush()
    expect(h.transport).toHaveBeenCalledTimes(2)
    h.runtime.retry()
    await flush()
    expect(h.transport).toHaveBeenCalledTimes(3)
  })

  it("reset aborts old work and its completion cannot acknowledge target work", async () => {
    const request = deferred<void>()
    const h = harness()
    h.transport.mockImplementationOnce(() => request.promise)
    h.ready()
    h.runtime.start()
    await flush()
    const signal = h.transport.mock.calls[0]?.[1]
    h.runtime.resetForEnvironment()
    expect(signal?.aborted).toBe(true)
    expect(h.resetIntent).toHaveBeenCalledTimes(1)
    h.ready()
    h.runtime.updateToken("target-token")
    h.runtime.start()
    request.reject(new Error("late payload"))
    await flush()
    expect(h.recordError).not.toHaveBeenCalled()
    expect(h.runtime.getSnapshot()).toEqual({ state: "acknowledged" })
    expect(h.transport).toHaveBeenCalledTimes(2)
    expect(h.transport.mock.calls[1]?.[0].fcmToken).toBe("target-token")
  })

  it("dispose aborts transport and makes its completion inert", async () => {
    const request = deferred<void>()
    const h = harness()
    h.transport.mockImplementationOnce(() => request.promise)
    h.ready()
    h.runtime.start()
    await flush()
    const signal = h.transport.mock.calls[0]?.[1]
    h.runtime.dispose()
    expect(signal?.aborted).toBe(true)
    request.reject(new Error("late failure"))
    await flush()
    expect(h.recordError).not.toHaveBeenCalled()
    expect(h.isDirty()).toBe(true)
  })

  it("recreated runtime replays durable intent from current canonical inputs", async () => {
    let dirty = true
    let generation = 4
    let days = 7
    const sent: NotificationSubscriptionCreate[] = []
    const create = () =>
      createNotificationSyncRuntime({
        getPreferences: () => ({
          frequency: "daily",
          nbDaysAhead: days,
          isActive: true,
        }),
        getToken: async () => "fresh-token",
        transport: async (snapshot) => {
          sent.push(snapshot)
        },
        recordError: jest.fn(),
        isDirty: () => dirty,
        getGeneration: () => generation,
        markDirty: () => {
          generation += 1
          dirty = true
          return { generation, rolledOver: false }
        },
        acknowledge: (candidate) => {
          if (candidate !== generation) return false
          dirty = false
          return true
        },
        resetIntent: jest.fn(),
      })
    const runtime = create()
    runtime.updateCalendars({ calendars: [], ready: true, revision: "loaded" })
    days = 12
    runtime.start()
    await flush()
    expect(sent).toHaveLength(1)
    expect(sent[0]?.nbDaysAhead).toBe(12)
    expect(Object.keys(sent[0] ?? {})).toEqual(
      expect.arrayContaining(["frequency", "nbDaysAhead", "isActive"]),
    )
  })
})
