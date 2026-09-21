import type {
  NotificationSubscriptionCreate,
  NotificationSubscriptionCreateLocale,
} from "@/api/generated/timeCalendar.schemas"

import type { NotificationIntentVersion } from "./intent"
import type { NotificationSubscriptionTransport } from "./transport"
import type { NotificationFrequency } from "./types"

export type NotificationSyncWaitingReason = "registration" | "calendars"

export type NotificationSyncStatus =
  | Readonly<{ state: "pending" }>
  | Readonly<{ state: "waiting"; reason: NotificationSyncWaitingReason }>
  | Readonly<{ state: "error" }>
  | Readonly<{ state: "acknowledged" }>

export interface NotificationCalendarsSnapshot {
  calendars: readonly { id: string }[]
  ready: boolean
  revision: string
}

export interface NotificationSyncRuntimeDependencies {
  getPreferences: () => {
    frequency: NotificationFrequency
    nbDaysAhead: number
    isActive: boolean
  }
  getToken: () => Promise<string | null>
  transport: NotificationSubscriptionTransport
  recordError: (error: unknown, context: string) => void
  isDirty: () => boolean
  getGeneration: () => number
  markDirty: () => NotificationIntentVersion
  acknowledge: (generation: number) => boolean
  resetIntent: () => void
  subscribeIntent?: (
    listener: (version: NotificationIntentVersion) => void,
  ) => () => void
  setTimer?: (
    callback: () => void,
    delay: number,
  ) => ReturnType<typeof setTimeout>
  clearTimer?: (timer: ReturnType<typeof setTimeout>) => void
}

export interface NotificationSyncRuntime {
  getSnapshot: () => NotificationSyncStatus
  subscribe: (listener: () => void) => () => void
  start: () => void
  invalidate: () => void
  retry: () => void
  foreground: () => void
  setActive: (active: boolean) => void
  updateToken: (token: string | null) => void
  updateCalendars: (snapshot: NotificationCalendarsSnapshot) => void
  updateLocale: (locale: NotificationSubscriptionCreateLocale) => void
  updateTimezone: (timezone: string) => void
  dispose: () => void
  resetForEnvironment: () => void
}

const ACKNOWLEDGED = { state: "acknowledged" } as const
const PENDING = { state: "pending" } as const
const ERROR = { state: "error" } as const
const RETRY_DELAYS = [1_000, 5_000, 30_000] as const
const SANITIZED_SYNC_ERROR = "Notification subscription synchronization failed"

export function createNotificationSyncRuntime(
  dependencies: NotificationSyncRuntimeDependencies,
): NotificationSyncRuntime {
  const setTimer = dependencies.setTimer ?? setTimeout
  const clearTimer = dependencies.clearTimer ?? clearTimeout
  const listeners = new Set<() => void>()
  let status: NotificationSyncStatus = dependencies.isDirty()
    ? PENDING
    : ACKNOWLEDGED
  let live = false
  let active = true
  let epoch = 0
  let retryIndex = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | undefined
  let unsubscribeIntent: (() => void) | undefined
  let drainRequested = false
  let draining = false
  let token: string | null | undefined
  let calendars: NotificationCalendarsSnapshot = {
    calendars: [],
    ready: false,
    revision: "pending",
  }
  let locale: NotificationSubscriptionCreateLocale = "fr"
  let timezone = "Europe/Paris"

  const publish = (next: NotificationSyncStatus): void => {
    status = next
    for (const listener of listeners) listener()
  }

  const cancelTimer = (): void => {
    if (timer === undefined) return
    clearTimer(timer)
    timer = undefined
  }

  const identitiesMatch = (
    generation: number,
    capturedEpoch: number,
  ): boolean =>
    live &&
    capturedEpoch === epoch &&
    generation === dependencies.getGeneration()

  const requestDrain = (): void => {
    drainRequested = true
    if (!live || !active || draining || timer !== undefined) return
    void drain()
  }

  const resumeDrain = (): void => {
    retryIndex = 0
    cancelTimer()
    requestDrain()
  }

  const scheduleRetry = (): void => {
    if (!live || !active || retryIndex >= RETRY_DELAYS.length) return
    const delay = RETRY_DELAYS[retryIndex]!
    retryIndex += 1
    timer = setTimer(() => {
      timer = undefined
      requestDrain()
    }, delay)
  }

  const handleFailure = (generation: number, capturedEpoch: number): void => {
    if (!identitiesMatch(generation, capturedEpoch)) {
      drainRequested = dependencies.isDirty()
      return
    }
    dependencies.recordError(
      new Error(SANITIZED_SYNC_ERROR),
      "notifications/subscription",
    )
    publish(ERROR)
    scheduleRetry()
  }

  const attempt = async (): Promise<void> => {
    if (!dependencies.isDirty()) {
      publish(ACKNOWLEDGED)
      return
    }

    const generation = dependencies.getGeneration()
    const capturedEpoch = epoch
    publish(PENDING)

    if (!calendars.ready) {
      publish({ state: "waiting", reason: "calendars" })
      return
    }

    let currentToken: string | null
    try {
      currentToken = token === undefined ? await dependencies.getToken() : token
    } catch {
      handleFailure(generation, capturedEpoch)
      return
    }

    if (!identitiesMatch(generation, capturedEpoch)) {
      drainRequested = dependencies.isDirty()
      return
    }
    if (currentToken === null) {
      publish({ state: "waiting", reason: "registration" })
      return
    }

    const preferences = dependencies.getPreferences()
    const snapshot: NotificationSubscriptionCreate = {
      ...preferences,
      fcmToken: currentToken,
      calendarIds: calendars.calendars.map((calendar) => calendar.id),
      locale,
      timezone,
    }

    const requestController = new AbortController()
    controller = requestController
    try {
      await dependencies.transport(snapshot, requestController.signal)
      if (!identitiesMatch(generation, capturedEpoch)) {
        drainRequested = dependencies.isDirty()
        return
      }
      if (dependencies.acknowledge(generation)) {
        retryIndex = 0
        publish(ACKNOWLEDGED)
      }
    } catch {
      handleFailure(generation, capturedEpoch)
    } finally {
      if (controller === requestController) controller = undefined
    }
  }

  async function drain(): Promise<void> {
    draining = true
    try {
      while (live && active && drainRequested && timer === undefined) {
        drainRequested = false
        await attempt()
      }
    } finally {
      draining = false
    }
  }

  const acceptIntent = (version: NotificationIntentVersion): void => {
    if (version.rolledOver) {
      epoch += 1
      controller?.abort()
    }
    if (live) publish(PENDING)
    resumeDrain()
  }

  const markAndAccept = (): void => acceptIntent(dependencies.markDirty())

  const disposeWork = (): void => {
    live = false
    epoch += 1
    drainRequested = false
    cancelTimer()
    controller?.abort()
    controller = undefined
    unsubscribeIntent?.()
    unsubscribeIntent = undefined
    listeners.clear()
    status = ACKNOWLEDGED
  }

  return {
    getSnapshot: () => status,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    start() {
      if (live) return
      live = true
      active = true
      unsubscribeIntent = dependencies.subscribeIntent?.(acceptIntent)
      markAndAccept()
    },
    invalidate() {
      markAndAccept()
    },
    retry() {
      resumeDrain()
    },
    foreground() {
      active = true
      resumeDrain()
    },
    setActive(nextActive) {
      active = nextActive
      if (!active) cancelTimer()
    },
    updateToken(nextToken) {
      if (token === nextToken) return
      token = nextToken
      if (live) markAndAccept()
    },
    updateCalendars(nextCalendars) {
      if (
        calendars.ready === nextCalendars.ready &&
        calendars.revision === nextCalendars.revision
      ) {
        return
      }
      calendars = {
        calendars: [...nextCalendars.calendars],
        ready: nextCalendars.ready,
        revision: nextCalendars.revision,
      }
      if (live) markAndAccept()
    },
    updateLocale(nextLocale) {
      if (locale === nextLocale) return
      locale = nextLocale
      if (live) markAndAccept()
    },
    updateTimezone(nextTimezone) {
      if (timezone === nextTimezone) return
      timezone = nextTimezone
      if (live) markAndAccept()
    },
    dispose: disposeWork,
    resetForEnvironment() {
      disposeWork()
      token = undefined
      calendars = { calendars: [], ready: false, revision: "pending" }
      dependencies.resetIntent()
    },
  }
}
