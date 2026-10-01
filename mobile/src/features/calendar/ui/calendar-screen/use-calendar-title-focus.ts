import { useRef, useState } from "react"
import { AccessibilityInfo } from "react-native"

import type { CalendarPageTitleTarget } from "@/features/calendar/renderer"
import type { CalendarView } from "@/features/settings/prefs"

export function useCalendarTitleFocus({
  view,
  routeFocused,
  presentationReady,
  pageKey,
  heading,
}: {
  view: CalendarView
  routeFocused: boolean
  presentationReady: boolean
  pageKey: string
  heading: string
}) {
  const [pageTitleTarget, setPageTitleTarget] =
    useState<CalendarPageTitleTarget | null>(null)
  // The page shown on arrival is not a change of context.
  const announcedPageKey = useRef(pageKey)
  const titleTargetActive =
    view !== "agenda" && routeFocused && presentationReady

  const onContextSettled = (settledPageKey: string, titleFocused: boolean) => {
    if (
      settledPageKey !== pageKey ||
      announcedPageKey.current === settledPageKey ||
      !routeFocused
    )
      return
    announcedPageKey.current = settledPageKey
    if (!titleFocused) AccessibilityInfo.announceForAccessibility(heading)
  }

  return {
    pageTitleTarget: titleTargetActive ? pageTitleTarget : null,
    setPageTitleTarget,
    titleTargetActive,
    onContextSettled,
  }
}
