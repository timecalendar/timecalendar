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
    setMetadata: (nextGeneration: number, nextDirty: boolean) => {
      generation = nextGeneration
      dirty = nextDirty
    },
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

  it("records a sanitized current token-resolution failure", async () => {
    const h = harness({
      getToken: async () => {
        throw new Error("secret-token calendar-id request-body")
      },
    })
    h.ready()
    h.runtime.start()
    await flush()
    expect(h.runtime.getSnapshot()).toEqual({ state: "error" })
    expect(h.recordError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Notification subscription synchronization failed",
      }),
      "notifications/subscription",
    )
    expect(JSON.stringify(h.recordError.mock.calls)).not.toContain(
      "secret-token",
    )
    h.runtime.dispose()
  })

  it("publishes acknowledged when a requested drain finds no dirty work", async () => {
    const h = harness({
      markDirty: () => ({ generation: 0, rolledOver: false }),
    })
    h.ready()
    h.runtime.start()
    await flush()
    expect(h.runtime.getSnapshot()).toEqual({ state: "acknowledged" })
    expect(h.transport).not.toHaveBeenCalled()
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

  it("does not acknowledge when durable validation rejects the candidate", async () => {
    const h = harness({ acknowledge: () => false })
    h.ready()
    h.runtime.start()
    await flush()
    expect(h.isDirty()).toBe(true)
    expect(h.runtime.getSnapshot()).toEqual({ state: "pending" })
  })

  it("advances epoch and aborts active work on generation rollover", async () => {
    const request = deferred<void>()
    let intentListener:
      | ((version: { generation: number; rolledOver: boolean }) => void)
      | undefined
    const unsubscribe = jest.fn()
    const h = harness({
      subscribeIntent: (listener) => {
        intentListener = listener
        return unsubscribe
      },
    })
    h.transport.mockImplementationOnce(() => request.promise)
    h.ready()
    h.runtime.start()
    await flush()
    const signal = h.transport.mock.calls[0]?.[1]
    h.setMetadata(0, true)
    intentListener?.({ generation: 0, rolledOver: true })
    expect(signal?.aborted).toBe(true)
    request.resolve(undefined)
    await flush()
    expect(h.transport).toHaveBeenCalledTimes(2)
    h.runtime.dispose()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
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

  it("preserves an inactive lifecycle snapshot supplied before start", async () => {
    const h = harness()
    h.ready()
    h.runtime.setActive(false)
    h.runtime.start()
    await flush()
    expect(h.transport).not.toHaveBeenCalled()
    expect(h.runtime.getSnapshot()).toEqual({ state: "pending" })

    h.runtime.foreground()
    await flush()
    expect(h.transport).toHaveBeenCalledTimes(1)
    expect(h.runtime.getSnapshot()).toEqual({ state: "acknowledged" })
  })

  it("does not schedule a retry when a current request fails in background", async () => {
    jest.useFakeTimers()
    const request = deferred<void>()
    const h = harness()
    h.transport.mockImplementationOnce(() => request.promise)
    h.ready()
    h.runtime.start()
    await flush()
    h.runtime.setActive(false)
    request.reject(new Error("network"))
    await flush()
    expect(h.runtime.getSnapshot()).toEqual({ state: "error" })
    expect(jest.getTimerCount()).toBe(0)
  })

  it("makes duplicate and unchanged lifecycle/input commands inert", async () => {
    const h = harness()
    const listener = jest.fn()
    const unsubscribe = h.runtime.subscribe(listener)
    h.runtime.invalidate()
    h.runtime.updateToken(null)
    h.runtime.updateToken(null)
    h.runtime.updateLocale("fr")
    h.runtime.updateTimezone("Europe/Paris")
    h.runtime.updateCalendars({
      calendars: [],
      ready: false,
      revision: "pending",
    })
    expect(listener).not.toHaveBeenCalled()

    h.ready()
    h.runtime.start()
    h.runtime.start()
    await flush()
    expect(h.transport).not.toHaveBeenCalled()
    unsubscribe()
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
