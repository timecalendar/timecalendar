import { useState } from "react"

import { useChecklistProgress } from "@/features/event-checklists"

import { useCalendarEventsSnapshot } from "./events"
import { planCalendarThreePageRange } from "./range-plan"
import {
  buildCalendarTimelinePresentation,
  type CalendarTimelinePresentationV1,
  timelinePresentationUids,
} from "./timeline-presentation"
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
    presentation: CalendarTimelinePresentationV1
  } | null>(null)
  const identityPresentation =
    snapshot.ready && snapshot.error === undefined
      ? buildCalendarTimelinePresentation({
          range,
          generation: input.generation,
          events: snapshot.events,
        })
      : (retained?.presentation ?? null)
  const scopedUids =
    identityPresentation === null
      ? []
      : timelinePresentationUids(identityPresentation)
  const checklistProgress = useChecklistProgress(scopedUids)

  const completePresentation = buildCalendarTimelinePresentation({
    range,
    generation: input.generation,
    events: snapshot.events,
    checklistProgress,
  })
  const progressKey = [...checklistProgress]
    .map(
      ([uid, value]) =>
        `${uid}:${value.completed}:${value.total}:${value.isComplete}`,
    )
    .join("|")
  const completeKey = `${range.key}:${input.generation}:${snapshot.revision}:${progressKey}`
  if (
    snapshot.ready &&
    snapshot.error === undefined &&
    retained?.key !== completeKey
  ) {
    setRetained({ key: completeKey, presentation: completePresentation })
  }

  const presentation =
    snapshot.ready && snapshot.error === undefined
      ? completePresentation
      : (retained?.presentation ??
        buildCalendarTimelinePresentation({
          range,
          generation: input.generation,
          events: [],
        }))

  return {
    presentation,
    range,
    ready: snapshot.ready,
    error: snapshot.error,
    counts: snapshot.counts,
  }
}
