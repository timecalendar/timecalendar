import { monitorEventLoopDelay, performance } from "node:perf_hooks"
import { plainToInstance } from "class-transformer"
import {
  EventForChangeDetection,
  findEventChanges,
} from "modules/calendar-log/models/change-detection/find-event-changes"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"
import { runBoundedCalendarSync } from "modules/calendar-sync/services/calendar-sync-all.service"

const CALENDAR_COUNT = 8
const EVENTS_PER_CALENDAR = 1500
const REQUEST_SAMPLES = 7
const SIMULATED_UPSTREAM_MS = 5
const REFERENCE_DATE = new Date("2026-08-01T00:00:00.000Z")

type ProfileMode = "baseline" | "fixed"

type ProfileResult = {
  fixture: {
    calendars: number
    eventsPerCalendar: number
    requestSamples: number
    unstableUids: boolean
  }
  mode: ProfileMode
  requestP50Ms: number
  requestP95Ms: number
  peakUpstreamConcurrency: number
  maxEventLoopDelayMs: number
  unfinishedOperations: number
}

const percentile = (values: number[], fraction: number) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.ceil(sorted.length * fraction) - 1]
}

const makeEvents = (uidPrefix: string) =>
  Array.from({ length: EVENTS_PER_CALENDAR }, (_, index) => {
    const startsAt = new Date(
      REFERENCE_DATE.getTime() + (index + 1) * 3_600_000,
    )
    return {
      uid: `${uidPrefix}-${index}`,
      title: `Synthetic course ${index}`,
      location: `Room ${index % 50}`,
      startsAt,
      endsAt: new Date(startsAt.getTime() + 3_600_000),
    }
  })

const oldEvents = makeEvents("old")
const serializedEvents = JSON.stringify(oldEvents)

let activeOperations = 0
let peakOperations = 0

const runCalendar = async (mode: ProfileMode) => {
  activeOperations++
  peakOperations = Math.max(peakOperations, activeOperations)
  try {
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_UPSTREAM_MS))
    const hydrated: EventForChangeDetection[] =
      mode === "baseline"
        ? plainToInstance(
            CalendarEvent,
            JSON.parse(serializedEvents) as Record<string, unknown>[],
          )
        : oldEvents
    const newEvents = makeEvents("unstable")
    findEventChanges(REFERENCE_DATE, hydrated, newEvents)
  } finally {
    activeOperations--
  }
}

const runRequest = async (mode: ProfileMode) => {
  if (mode === "baseline") {
    await Promise.all(
      Array.from({ length: CALENDAR_COUNT }, () => runCalendar(mode)),
    )
    return
  }

  await runBoundedCalendarSync(
    Array.from({ length: CALENDAR_COUNT }, (_, index) => index),
    () => runCalendar(mode),
  )
}

const main = async () => {
  const mode = (process.argv[2] ?? "baseline") as ProfileMode
  if (mode !== "baseline" && mode !== "fixed") {
    throw new Error("mode must be 'baseline' or 'fixed'")
  }

  const loopDelay = monitorEventLoopDelay({ resolution: 1 })
  loopDelay.enable()
  const durations: number[] = []
  for (let sample = 0; sample < REQUEST_SAMPLES; sample++) {
    const startedAt = performance.now()
    await runRequest(mode)
    durations.push(performance.now() - startedAt)
    await new Promise((resolve) => setImmediate(resolve))
  }
  loopDelay.disable()

  const result: ProfileResult = {
    fixture: {
      calendars: CALENDAR_COUNT,
      eventsPerCalendar: EVENTS_PER_CALENDAR,
      requestSamples: REQUEST_SAMPLES,
      unstableUids: true,
    },
    mode,
    requestP50Ms: Number(percentile(durations, 0.5).toFixed(1)),
    requestP95Ms: Number(percentile(durations, 0.95).toFixed(1)),
    peakUpstreamConcurrency: peakOperations,
    maxEventLoopDelayMs: Number((loopDelay.max / 1_000_000).toFixed(1)),
    unfinishedOperations: activeOperations,
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
}

void main()
