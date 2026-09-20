import { useState } from "react"

import { useChecklistProgress } from "@/features/event-checklists"

import { useCalendarEventsSnapshot } from "./events"
import { planCalendarThreePageRange } from "./range-plan"
import {
  buildCalendarTimelinePresentation,
  timelinePresentationUids,
} from "./timeline-presentation"
import type { CalendarEvent } from "./types"
import type { FirstWeekday } from "./week"
import type { CalendarTimelineMode } from "./week-transition"

export interface CalendarTimelinePresentationInput {
  anchor: Date
  mode: CalendarTimelineMode
  displayZone: string
  firstWeekday: FirstWeekday
  showWeekends: boolean
  generation: number
}

export function useCalendarTimelinePresentation(
  input: CalendarTimelinePresentationInput,
) {
  const range = planCalendarThreePageRange(input)
  const snapshot = useCalendarEventsSnapshot({
    ...range.instant,
    civilFromDay: range.civil.fromDay,
    civilToDay: range.civil.toDay,
  })
  const [retained, setRetained] = useState<{
    key: string
    events: readonly CalendarEvent[]
  } | null>(null)
  const complete = snapshot.ready && snapshot.error === undefined
  const completeKey = `${range.key}:${input.generation}:${snapshot.revision}`
  if (complete && retained?.key !== completeKey) {
    setRetained({ key: completeKey, events: snapshot.events })
  }

  // Paging recenters immediately, so only event data may lag behind the anchor.
  // Reproject retained events onto the current dates instead of retaining pages.
  const events = complete ? snapshot.events : (retained?.events ?? [])
  const identityPresentation = buildCalendarTimelinePresentation({
    range,
    generation: input.generation,
    events,
  })
  const scopedUids = timelinePresentationUids(identityPresentation)
  const checklistProgress = useChecklistProgress(scopedUids)

  const presentation = buildCalendarTimelinePresentation({
    range,
    generation: input.generation,
    events,
    checklistProgress,
  })

  return {
    presentation,
    range,
    ready: snapshot.ready,
    error: snapshot.error,
    counts: snapshot.counts,
  }
}
