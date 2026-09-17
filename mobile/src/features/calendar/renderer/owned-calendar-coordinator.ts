import { useEffect, useLayoutEffect, useRef, useState } from "react"
import {
  AppState,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native"
import { Gesture } from "react-native-gesture-handler"
import PagerView, {
  type PagerViewOnPageSelectedEvent,
  type PageScrollStateChangedNativeEvent,
} from "react-native-pager-view"
import { useReducedMotion } from "react-native-reanimated"

import {
  type AppLocale,
  type CalendarTimelineMode,
  type CalendarTransitionRequest,
  type CalendarTransitionSource,
  dayKey,
  type FirstWeekday,
  shiftTimelineAnchor,
  timelineColumns,
  type WeekDirection,
} from "@/features/calendar/data"

import {
  type CalendarZoomSettlement,
  useOwnedCalendarZoom,
} from "./owned-calendar-zoom"
import { CENTER_PAGE, usePagerPageScroll } from "./pager-page-scroll"

export { CENTER_PAGE } from "./pager-page-scroll"

const PAGE_DIRECTIONS = [-1, 0, 1] as const

export type CalendarPage = ReturnType<typeof calendarPages>[number]

export type OwnedCalendarCoordinatorProps = {
  anchor: Date
  mode: CalendarTimelineMode
  displayZone: string
  locale: AppLocale
  firstWeekday: FirstWeekday
  showWeekends: boolean
  currentDate: Date
  initialVerticalOffset: number
  initialPixelsPerHour: number
  generation: number
  revisionFloor: number
  onVerticalOffsetSettled: (offset: number) => void
  onZoomSettled: (settlement: CalendarZoomSettlement) => void
  onTransitionRequest: (request: CalendarTransitionRequest) => void
  onTransitionSettled: (revision: number) => void
  onTransitionCancelled: (revision: number) => void
}

function calendarPages(
  anchor: Date,
  mode: CalendarTimelineMode,
  displayZone: string,
  firstWeekday: FirstWeekday,
  showWeekends: boolean,
) {
  return PAGE_DIRECTIONS.map((direction) => {
    const pageAnchor =
      direction === 0
        ? anchor
        : shiftTimelineAnchor(
            anchor,
            mode,
            direction,
            displayZone,
            firstWeekday,
          )
    return {
      direction,
      key: dayKey(pageAnchor, displayZone),
      columns: timelineColumns(
        pageAnchor,
        mode,
        displayZone,
        firstWeekday,
        showWeekends,
      ),
    }
  })
}

export function useOwnedCalendarCoordinator({
  anchor,
  mode,
  displayZone,
  firstWeekday,
  showWeekends,
  currentDate,
  initialVerticalOffset,
  initialPixelsPerHour,
  generation,
  revisionFloor,
  onVerticalOffsetSettled,
  onZoomSettled,
  onTransitionRequest,
  onTransitionSettled,
  onTransitionCancelled,
}: OwnedCalendarCoordinatorProps) {
  const reduceMotion = useReducedMotion()
  const pagerRef = useRef<PagerView>(null)
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
  const handledPinchSequenceRef = useRef(0)
  const settledZoomSequenceRef = useRef(0)
  const previousShowWeekendsRef = useRef(showWeekends)
  const progressContextKey = `${generation}:${mode}:${headerLaneWidth}:${showWeekends}`
  const zoom = useOwnedCalendarZoom({
    generation,
    initialPixelsPerHour,
    initialRawOffset: initialVerticalOffset,
    onZoomSettled: (settlement) => {
      if (
        settlement.generation !== currentGenerationRef.current ||
        settlement.sequence <= settledZoomSequenceRef.current
      ) {
        return
      }
      settledZoomSequenceRef.current = settlement.sequence
      committedVerticalOffsetRef.current = settlement.rawOffset
      onZoomSettled(settlement)
    },
  })
  const {
    horizontalCallbacksBlocked,
    pinchActive,
    pinchGeneration,
    pinchInterruptionSequence,
    pinchSequence,
    scrollRef,
    verticalCallbacksBlocked,
  } = zoom
  const { headerStripStyle, offset, onPageScroll, position } =
    usePagerPageScroll(
      headerLaneWidth,
      progressContextKey,
      horizontalCallbacksBlocked,
    )
  const nativeScrollGesture = Gesture.Native().withTestId(
    "owned-calendar-native-scroll",
  )
  const nativePagerGesture = Gesture.Native().withTestId(
    "owned-calendar-native-pager",
  )
  const pinchGesture = zoom.pinchGesture.blocksExternalGesture(
    nativeScrollGesture,
    nativePagerGesture,
  )
  const pages = calendarPages(
    anchor,
    mode,
    displayZone,
    firstWeekday,
    showWeekends,
  )
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

  const observePinchInterruption = () => {
    if (pinchGeneration.get() !== generation) return false
    const sequence = pinchInterruptionSequence.get()
    if (sequence === handledPinchSequenceRef.current) return false
    handledPinchSequenceRef.current = sequence
    cancelVerticalCandidate()
    cancelHorizontalTransition(true)
    return true
  }

  const verticalCallbacksAreBlocked = () => {
    observePinchInterruption()
    return verticalCallbacksBlocked.get()
  }

  const horizontalCallbacksAreBlocked = () => {
    observePinchInterruption()
    return horizontalCallbacksBlocked.get()
  }

  const beginTransition = (
    direction: WeekDirection,
    source: CalendarTransitionSource,
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
    if (horizontalCallbacksAreBlocked()) return
    selectedPageRef.current = event.nativeEvent.position
  }

  const onPageScrollStateChanged = (
    event: PageScrollStateChangedNativeEvent,
  ) => {
    if (currentGenerationRef.current !== generation) return
    observePinchInterruption()
    if (event.nativeEvent.pageScrollState === "dragging") {
      if (!pinchActive.get()) horizontalCallbacksBlocked.set(false)
      return
    }
    if (horizontalCallbacksBlocked.get()) return
    if (event.nativeEvent.pageScrollState !== "idle") return
    if (selectedPageRef.current === CENTER_PAGE) {
      cancelHorizontalTransition(false)
      return
    }
    settleSelectedPage()
  }

  const requestAccessiblePage = (
    direction: WeekDirection,
    source: CalendarTransitionSource,
  ) => {
    observePinchInterruption()
    if (pinchActive.get()) return
    horizontalCallbacksBlocked.set(false)
    const revision = beginTransition(direction, source)
    if (revision === null || pendingRevisionRef.current !== revision) return
    const target = CENTER_PAGE + direction
    selectedPageRef.current = target
    if (reduceMotion) pagerRef.current?.setPageWithoutAnimation(target)
    else pagerRef.current?.setPage(target)
  }

  const settleVertical = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (verticalCallbacksAreBlocked()) return
    cancelVerticalCandidate()
    const nextOffset = event.nativeEvent.contentOffset.y
    committedVerticalOffsetRef.current = nextOffset
    onVerticalOffsetSettled(nextOffset)
  }

  const onScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (verticalCallbacksAreBlocked()) return
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

  const onScrollBeginDrag = () => {
    observePinchInterruption()
    if (pinchActive.get()) return
    verticalCallbacksBlocked.set(false)
    cancelVerticalCandidate()
  }

  useEffect(() => {
    onTransitionCancelledRef.current = onTransitionCancelled
  }, [onTransitionCancelled])

  useLayoutEffect(() => {
    if (currentGenerationRef.current === generation) return
    currentGenerationRef.current = generation
    pinchActive.set(false)
    pinchGeneration.set(generation)
    handledPinchSequenceRef.current = pinchInterruptionSequence.get()
    consumedGenerationRef.current = null
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
  }, [
    generation,
    offset,
    pinchActive,
    pinchGeneration,
    pinchInterruptionSequence,
    pinchSequence,
    position,
    scrollRef,
  ])

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
      pinchActive.set(false)
      pinchGeneration.set(-1)
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
      pinchActive.set(false)
      pinchGeneration.set(-1)
      if (verticalFrameRef.current !== null) {
        cancelAnimationFrame(verticalFrameRef.current)
      }
      const revision = pendingRevisionRef.current
      if (revision !== null) {
        pendingRevisionRef.current = null
        onTransitionCancelledRef.current(revision)
      }
    }
  }, [offset, pinchActive, pinchGeneration, position, scrollRef])

  return {
    cancelVerticalCandidate,
    headerStripStyle,
    onHeaderLaneLayout,
    onPageScroll,
    onPageScrollStateChanged,
    onPageSelected,
    onScroll: zoom.onScroll,
    onScrollBeginDrag,
    onScrollEndDrag,
    onViewportLayout: zoom.onViewportLayout,
    nativePagerGesture,
    nativeScrollGesture,
    pagerRef,
    pages,
    pinchGesture,
    pixelsPerHour: zoom.pixelsPerHour,
    requestAccessiblePage,
    requestZoom: zoom.requestZoom,
    scrollRef,
    settleVertical,
    todayKey,
  }
}
