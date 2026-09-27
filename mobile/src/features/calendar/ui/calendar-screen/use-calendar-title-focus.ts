import { useRef, useState } from "react"
import { AccessibilityInfo } from "react-native"

import type { CalendarPageTitleTarget } from "@/features/calendar/renderer"
import type { CalendarView } from "@/features/settings/prefs"

export function useCalendarTitleFocus({
  view,
  routeFocused,
  transitionPending,
  presentationReady,
  presentationGeneration,
  generation,
  acceptedRevision,
  heading,
}: {
  view: CalendarView
  routeFocused: boolean
  transitionPending: boolean
  presentationReady: boolean
  presentationGeneration: number
  generation: number
  acceptedRevision: number | null
  heading: string
}) {
  const [pageTitleTarget, setPageTitleTarget] =
    useState<CalendarPageTitleTarget | null>(null)
  const announcedRevision = useRef<number | null>(null)
  const titleTargetActive =
    view !== "agenda" &&
    routeFocused &&
    !transitionPending &&
    presentationReady &&
    presentationGeneration === generation

  const onContextSettled = (revision: number, titleFocused: boolean) => {
    if (
      acceptedRevision === null ||
      revision !== acceptedRevision ||
      announcedRevision.current === revision ||
      !routeFocused
    )
      return
    announcedRevision.current = revision
    if (!titleFocused) AccessibilityInfo.announceForAccessibility(heading)
  }

  return {
    pageTitleTarget: titleTargetActive ? pageTitleTarget : null,
    setPageTitleTarget,
    titleTargetActive,
    onContextSettled,
  }
}
