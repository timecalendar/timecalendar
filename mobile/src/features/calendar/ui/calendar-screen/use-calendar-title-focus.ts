import { useRef, useState } from "react"
import { AccessibilityInfo } from "react-native"

import type { CalendarPageTitleTarget } from "@/features/calendar/renderer"
import type { CalendarView } from "@/features/settings/prefs"

const pageMode = (pageKey: string) => pageKey.slice(0, pageKey.indexOf(":"))

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
  // The page shown on arrival, or on a Day/Week switch, is not a change of
  // context: only paging within one mode is.
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
    const samePaging =
      pageMode(announcedPageKey.current) === pageMode(settledPageKey)
    announcedPageKey.current = settledPageKey
    if (samePaging && !titleFocused)
      AccessibilityInfo.announceForAccessibility(heading)
  }

  return {
    pageTitleTarget: titleTargetActive ? pageTitleTarget : null,
    setPageTitleTarget,
    titleTargetActive,
    onContextSettled,
  }
}
