import { useState } from "react"

import { useCalendarSyncControllerSyncCalendars } from "@/api/generated/calendars/calendars"
import { refreshNewestPage } from "@/features/activity"
import {
  findAll as findAllUserCalendars,
  updateName as updateUserCalendarName,
} from "@/features/calendar-sources/data/user-calendars"
import { recordUnknownError } from "@/firebase"

import { replaceAll } from "./repository"
import { dtoToRow } from "./types"

export type CalendarSyncOutcome =
  | { status: "events-ready"; metadata: "current" | "stale" }
  | { status: "no-calendars" }
  | { status: "failed"; reason: "remote-read" | "event-write" }

export interface CalendarSyncOptions {
  freshAfterCurrent?: boolean
}

export interface UseSyncCalendars {
  sync: (options?: CalendarSyncOptions) => Promise<CalendarSyncOutcome>
  isSyncing: boolean
  isError: boolean
  reset: () => void
}

type SyncPass = () => Promise<CalendarSyncOutcome>

let activePass: Promise<CalendarSyncOutcome> | null = null
let queuedFreshPass: Promise<CalendarSyncOutcome> | null = null

function startPass(run: SyncPass): Promise<CalendarSyncOutcome> {
  const pass = run()
  activePass = pass
  void pass.finally(() => {
    if (activePass === pass) activePass = null
  })
  return pass
}

function coordinateSync(
  run: SyncPass,
  options: CalendarSyncOptions,
): Promise<CalendarSyncOutcome> {
  if (activePass === null) return startPass(run)
  if (!options.freshAfterCurrent) return activePass
  if (queuedFreshPass !== null) return queuedFreshPass

  const current = activePass
  queuedFreshPass = current
    .then(
      () => startPass(run),
      () => startPass(run),
    )
    .finally(() => {
      queuedFreshPass = null
    })
  return queuedFreshPass
}

/** Test-only reset for the module coordinator; production callers never need it. */
export function resetCalendarSyncCoordinatorForTests(): void {
  activePass = null
  queuedFreshPass = null
}

export function useSyncCalendars(): UseSyncCalendars {
  const { mutateAsync, reset: resetMutation } =
    useCalendarSyncControllerSyncCalendars()
  const [isSyncing, setIsSyncing] = useState(false)
  const [isError, setIsError] = useState(false)

  const runPass = async (): Promise<CalendarSyncOutcome> => {
    try {
      const calendars = await findAllUserCalendars()
      const tokens = calendars.map((calendar) => calendar.token)
      if (tokens.length === 0) return { status: "no-calendars" }

      const result = await mutateAsync({ data: { tokens } })

      try {
        const rows = result.flatMap((calendar) =>
          calendar.events.map((event) => dtoToRow(event, calendar.calendar.id)),
        )
        await replaceAll(rows)
      } catch (error) {
        recordUnknownError(error, "calendar/sync")
        return { status: "failed", reason: "event-write" }
      }

      // Event readiness is established by the committed replace. Activity is an
      // isolated fire-and-forget consequence and cannot change this outcome.
      void refreshNewestPage({ force: true })

      try {
        const localNames = new Map(
          calendars.map((calendar) => [calendar.id, calendar.name]),
        )
        // Keep local writes serial and stop at the first failed name update.
        // A promise chain makes that ordering explicit without overlapping DB work.
        await result.reduce(
          (previous, { calendar }) =>
            previous.then(() => {
              if (localNames.get(calendar.id) !== calendar.name) {
                return updateUserCalendarName(calendar.id, calendar.name)
              }
            }),
          Promise.resolve(),
        )
      } catch (error) {
        recordUnknownError(error, "calendar/sync-names")
        return { status: "events-ready", metadata: "stale" }
      }

      return { status: "events-ready", metadata: "current" }
    } catch {
      // Token reads and remote fetches are recoverable. They never enter the
      // transactional replacement, so last-good offline rows remain intact.
      return { status: "failed", reason: "remote-read" }
    }
  }

  const sync = async (
    options: CalendarSyncOptions = {},
  ): Promise<CalendarSyncOutcome> => {
    setIsSyncing(true)
    setIsError(false)
    return coordinateSync(runPass, options).then(
      (outcome) => {
        setIsError(
          outcome.status === "failed" ||
            (outcome.status === "events-ready" && outcome.metadata === "stale"),
        )
        setIsSyncing(false)
        return outcome
      },
      (error: unknown) => {
        setIsSyncing(false)
        throw error
      },
    )
  }

  const reset = (): void => {
    resetMutation()
    setIsError(false)
    setIsSyncing(false)
  }

  return { sync, isSyncing, isError, reset }
}
