import { useState } from "react"
import { useTranslation } from "react-i18next"

import { useChecklistProgress } from "@/features/event-checklists"
import { useColorScheme } from "@/hooks/use-color-scheme"

import { useCalendarEventsSnapshot } from "./events"
import { planCalendarThreePageRange } from "./range-plan"
import {
  buildCalendarTimelinePresentation,
  timelinePresentationUids,
} from "./timeline-presentation"
import type { CalendarEvent } from "./types"
import { useCalendarIncreasedContrast } from "./use-increased-contrast"
import type { FirstWeekday } from "./week"
import type { CalendarTimelineMode } from "./week-transition"

const EMPTY_EVENTS: readonly CalendarEvent[] = []

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
  const { t } = useTranslation()
  const colorScheme = useColorScheme()
  const scheme = colorScheme === "dark" ? "dark" : "light"
  const increasedContrast = useCalendarIncreasedContrast()
  const anchorTime = input.anchor.getTime()
  const range = planCalendarThreePageRange({
    anchor: new Date(anchorTime),
    mode: input.mode,
    displayZone: input.displayZone,
    firstWeekday: input.firstWeekday,
    showWeekends: input.showWeekends,
  })
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
  const retainedEvents = retained?.events
  const events = complete ? snapshot.events : (retainedEvents ?? EMPTY_EVENTS)
  const localizedNoTitle = t("calendar.event.noTitle")
  const identityPresentation = buildCalendarTimelinePresentation({
    range,
    generation: input.generation,
    events,
    localizedNoTitle,
    scheme,
    increasedContrast,
  })
  const scopedUids = timelinePresentationUids(identityPresentation)
  const checklistProgress = useChecklistProgress(scopedUids)

  const presentation = buildCalendarTimelinePresentation({
    range,
    generation: input.generation,
    events,
    checklistProgress,
    localizedNoTitle,
    scheme,
    increasedContrast,
  })

  return {
    presentation,
    range,
    ready: snapshot.ready,
    error: snapshot.error,
    counts: snapshot.counts,
  }
}
