import { useMemo, useState } from "react"

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
  const { anchor, mode, displayZone, firstWeekday, showWeekends, generation } =
    input
  const range = useMemo(
    () =>
      planCalendarThreePageRange({
        anchor,
        mode,
        displayZone,
        firstWeekday,
        showWeekends,
      }),
    [anchor, displayZone, firstWeekday, mode, showWeekends],
  )
  const snapshotRange = useMemo(
    () => ({
      ...range.instant,
      civilFromDay: range.civil.fromDay,
      civilToDay: range.civil.toDay,
    }),
    [range],
  )
  const snapshot = useCalendarEventsSnapshot(snapshotRange)
  const [retained, setRetained] = useState<{
    key: string
    presentation: CalendarTimelinePresentationV1
  } | null>(null)
  const loadedIdentityPresentation = useMemo(
    () =>
      snapshot.ready && snapshot.error === undefined
        ? buildCalendarTimelinePresentation({
            range,
            generation,
            events: snapshot.events,
          })
        : null,
    [generation, range, snapshot.error, snapshot.events, snapshot.ready],
  )
  const identityPresentation =
    loadedIdentityPresentation ?? retained?.presentation ?? null
  const scopedUids = useMemo(
    () =>
      identityPresentation === null
        ? []
        : timelinePresentationUids(identityPresentation),
    [identityPresentation],
  )
  const checklistProgress = useChecklistProgress(scopedUids)

  const completePresentation = useMemo(
    () =>
      buildCalendarTimelinePresentation({
        range,
        generation,
        events:
          snapshot.ready && snapshot.error === undefined ? snapshot.events : [],
        checklistProgress,
      }),
    [
      checklistProgress,
      generation,
      range,
      snapshot.error,
      snapshot.events,
      snapshot.ready,
    ],
  )
  const progressKey = [...checklistProgress]
    .map(
      ([uid, value]) =>
        `${uid}:${value.completed}:${value.total}:${value.isComplete}`,
    )
    .join("|")
  const completeKey = `${range.key}:${generation}:${snapshot.revision}:${progressKey}`
  if (
    snapshot.ready &&
    snapshot.error === undefined &&
    retained?.key !== completeKey
  ) {
    setRetained({
      key: completeKey,
      presentation: completePresentation,
    })
  }

  const presentation =
    snapshot.ready && snapshot.error === undefined
      ? completePresentation
      : (retained?.presentation ??
        buildCalendarTimelinePresentation({
          range,
          generation,
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
