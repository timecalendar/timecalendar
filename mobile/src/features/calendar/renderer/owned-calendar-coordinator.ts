import { useEffect, useLayoutEffect, useRef, useState } from "react"
import {
  AppState,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
} from "react-native"
import PagerView, {
  type PagerViewOnPageSelectedEvent,
  type PageScrollStateChangedNativeEvent,
} from "react-native-pager-view"
import { useReducedMotion } from "react-native-reanimated"

import {
  type AppLocale,
  dayKey,
  type FirstWeekday,
  shiftWeekInZone,
  weekColumns,
  type WeekDirection,
  type WeekTransitionRequest,
  type WeekTransitionSource,
} from "@/features/calendar/data"

import { usePagerPageScroll } from "./pager-page-scroll"

const PAGE_DIRECTIONS = [-1, 0, 1] as const
export const CENTER_PAGE = 1

export type CalendarPage = ReturnType<typeof calendarPages>[number]

export type OwnedCalendarCoordinatorProps = {
  anchor: Date
  displayZone: string
  locale: AppLocale
  firstWeekday: FirstWeekday
  showWeekends: boolean
  currentDate: Date
  initialVerticalOffset: number
  generation: number
  revisionFloor: number
  onVerticalOffsetSettled: (offset: number) => void
  onTransitionRequest: (request: WeekTransitionRequest) => void
  onTransitionSettled: (revision: number) => void
  onTransitionCancelled: (revision: number) => void
}

function calendarPages(
  anchor: Date,
  displayZone: string,
  firstWeekday: FirstWeekday,
  showWeekends: boolean,
) {
  return PAGE_DIRECTIONS.map((direction) => {
    const pageAnchor =
      direction === 0
        ? anchor
        : shiftWeekInZone(anchor, direction, displayZone, firstWeekday)
    return {
      direction,
      key: dayKey(pageAnchor, displayZone),
      columns: weekColumns(pageAnchor, displayZone, firstWeekday, showWeekends),
    }
  })
}

export function useOwnedCalendarCoordinator({
  anchor,
  displayZone,
  firstWeekday,
  showWeekends,
  currentDate,
  initialVerticalOffset,
  generation,
  revisionFloor,
  onVerticalOffsetSettled,
  onTransitionRequest,
  onTransitionSettled,
  onTransitionCancelled,
}: OwnedCalendarCoordinatorProps) {
  const reduceMotion = useReducedMotion()
  const pagerRef = useRef<PagerView>(null)
  const scrollRef = useRef<ScrollView>(null)
  const [headerLaneWidth, setHeaderLaneWidth] = useState(0)
  const revisionRef = useRef(revisionFloor)
  const pendingRevisionRef = useRef<number | null>(null)
  const onTransitionCancelledRef = useRef(onTransitionCancelled)
  const selectedPageRef = useRef(CENTER_PAGE)
  const consumedGenerationRef = useRef<number | null>(null)
  const currentGenerationRef = useRef(generation)
  const foregroundRef = useRef(AppState.currentState === "active")
  const committedVerticalOffsetRef = useRef(initialVerticalOffset)
  const verticalCandidateRef = useRef<number | null>(null)
  const verticalFrameRef = useRef<number | null>(null)
  const previousShowWeekendsRef = useRef(showWeekends)
  const progressContextKey = `${generation}:${headerLaneWidth}:${showWeekends}`
  const { headerStripStyle, offset, onPageScroll, position } =
    usePagerPageScroll(headerLaneWidth, progressContextKey)
  const pages = calendarPages(anchor, displayZone, firstWeekday, showWeekends)
  const todayKey = dayKey(currentDate, displayZone)

  const resetHeaderProgress = () => {
    position.set(CENTER_PAGE)
    offset.set(0)
  }

  const cancelHorizontalTransition = (recenterPager: boolean) => {
    const revision = pendingRevisionRef.current
    if (revision !== null) {
      pendingRevisionRef.current = null
      onTransitionCancelledRef.current(revision)
    }
    selectedPageRef.current = CENTER_PAGE
    resetHeaderProgress()
    if (recenterPager) pagerRef.current?.setPageWithoutAnimation(CENTER_PAGE)
  }

  const onHeaderLaneLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width
    if (width === headerLaneWidth) return
    if (headerLaneWidth > 0) cancelHorizontalTransition(true)
    setHeaderLaneWidth(width)
  }

  const cancelVerticalCandidate = () => {
    if (verticalFrameRef.current !== null) {
      cancelAnimationFrame(verticalFrameRef.current)
      verticalFrameRef.current = null
    }
    verticalCandidateRef.current = null
  }

  const beginTransition = (
    direction: WeekDirection,
    source: WeekTransitionSource,
  ) => {
    if (!foregroundRef.current || pendingRevisionRef.current !== null)
      return null
    const revision = Math.max(revisionRef.current, revisionFloor) + 1
    revisionRef.current = revision
    pendingRevisionRef.current = revision
    onTransitionRequest({ revision, direction, source })
    return revision
  }

  const settleSelectedPage = () => {
    const selectedPage = selectedPageRef.current
    if (
      selectedPage === CENTER_PAGE ||
      consumedGenerationRef.current === generation
    )
      return
    if (pendingRevisionRef.current === null) {
      const direction: WeekDirection = selectedPage < CENTER_PAGE ? -1 : 1
      beginTransition(direction, "gesture")
    }
    const revision = pendingRevisionRef.current
    if (revision === null) return
    consumedGenerationRef.current = generation
    selectedPageRef.current = CENTER_PAGE
    pendingRevisionRef.current = null
    onTransitionSettled(revision)
  }

  const onPageSelected = (event: PagerViewOnPageSelectedEvent) => {
    if (currentGenerationRef.current !== generation) return
    selectedPageRef.current = event.nativeEvent.position
  }

  const onPageScrollStateChanged = (
    event: PageScrollStateChangedNativeEvent,
  ) => {
    if (currentGenerationRef.current !== generation) return
    if (event.nativeEvent.pageScrollState !== "idle") return
    if (selectedPageRef.current === CENTER_PAGE) {
      cancelHorizontalTransition(false)
      return
    }
    settleSelectedPage()
  }

  const requestAccessiblePage = (
    direction: WeekDirection,
    source: WeekTransitionSource,
  ) => {
    const revision = beginTransition(direction, source)
    if (revision === null || pendingRevisionRef.current !== revision) return
    const target = CENTER_PAGE + direction
    selectedPageRef.current = target
    if (reduceMotion) pagerRef.current?.setPageWithoutAnimation(target)
    else pagerRef.current?.setPage(target)
  }

  const settleVertical = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    cancelVerticalCandidate()
    const nextOffset = event.nativeEvent.contentOffset.y
    committedVerticalOffsetRef.current = nextOffset
    onVerticalOffsetSettled(nextOffset)
  }

  const onScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    cancelVerticalCandidate()
    verticalCandidateRef.current = event.nativeEvent.contentOffset.y
    verticalFrameRef.current = requestAnimationFrame(() => {
      verticalFrameRef.current = null
      const nextOffset = verticalCandidateRef.current
      verticalCandidateRef.current = null
      if (nextOffset === null) return
      committedVerticalOffsetRef.current = nextOffset
      onVerticalOffsetSettled(nextOffset)
    })
  }

  useEffect(() => {
    onTransitionCancelledRef.current = onTransitionCancelled
  }, [onTransitionCancelled])

  useLayoutEffect(() => {
    currentGenerationRef.current = generation
    consumedGenerationRef.current = null
    const revision = pendingRevisionRef.current
    if (revision !== null) {
      pendingRevisionRef.current = null
      onTransitionCancelledRef.current(revision)
    }
    selectedPageRef.current = CENTER_PAGE
    position.set(CENTER_PAGE)
    offset.set(0)
  }, [generation, offset, position])

  useLayoutEffect(() => {
    if (previousShowWeekendsRef.current === showWeekends) return
    previousShowWeekendsRef.current = showWeekends
    const revision = pendingRevisionRef.current
    if (revision !== null) {
      pendingRevisionRef.current = null
      onTransitionCancelledRef.current(revision)
    }
    selectedPageRef.current = CENTER_PAGE
    position.set(CENTER_PAGE)
    offset.set(0)
    pagerRef.current?.setPageWithoutAnimation(CENTER_PAGE)
  }, [offset, position, showWeekends])

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      foregroundRef.current = state === "active"
      if (foregroundRef.current) return
      if (verticalFrameRef.current !== null) {
        cancelAnimationFrame(verticalFrameRef.current)
        verticalFrameRef.current = null
      }
      verticalCandidateRef.current = null
      const revision = pendingRevisionRef.current
      if (revision !== null) {
        pendingRevisionRef.current = null
        onTransitionCancelledRef.current(revision)
      }
      selectedPageRef.current = CENTER_PAGE
      position.set(CENTER_PAGE)
      offset.set(0)
      pagerRef.current?.setPageWithoutAnimation(CENTER_PAGE)
      scrollRef.current?.scrollTo({
        y: committedVerticalOffsetRef.current,
        animated: false,
      })
    })
    return () => {
      subscription.remove()
      if (verticalFrameRef.current !== null) {
        cancelAnimationFrame(verticalFrameRef.current)
      }
      const revision = pendingRevisionRef.current
      if (revision !== null) {
        pendingRevisionRef.current = null
        onTransitionCancelledRef.current(revision)
      }
    }
  }, [offset, position])

  return {
    cancelVerticalCandidate,
    headerStripStyle,
    onHeaderLaneLayout,
    onPageScroll,
    onPageScrollStateChanged,
    onPageSelected,
    onScrollEndDrag,
    pagerRef,
    pages,
    requestAccessiblePage,
    scrollRef,
    settleVertical,
    todayKey,
  }
}
