import { useEffect, useLayoutEffect, useRef, useState } from "react"
import {
  AppState,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native"
import { Gesture } from "react-native-gesture-handler"
import PagerView, {
  type PagerViewOnPageSelectedEvent,
  type PageScrollStateChangedNativeEvent,
} from "react-native-pager-view"
import { useReducedMotion, useSharedValue } from "react-native-reanimated"

import {
  type AppLocale,
  buildCalendarTimelinePresentation,
  type CalendarTimelineMode,
  type CalendarTimelinePresentationV1,
  type CalendarTransitionRequest,
  type CalendarTransitionSource,
  dayKey,
  type FirstWeekday,
  FULL_DAY_END_MINUTE,
  FULL_DAY_START_MINUTE,
  HOURS_COLUMN_WIDTH,
  minuteOfDayInZone,
  nowAnchoredRawOffset,
  nowIndicatorPosition,
  planCalendarThreePageRange,
  type WeekDirection,
} from "@/features/calendar/data"

import {
  type CalendarResizeSnapshot,
  replaceCalendarViewportGeometry,
  type TimedViewportGeometry,
} from "./owned-calendar-resize"
import {
  type CalendarZoomSettlement,
  useOwnedCalendarZoom,
} from "./owned-calendar-zoom"
import { CENTER_PAGE, usePagerPageScroll } from "./pager-page-scroll"

export { CENTER_PAGE } from "./pager-page-scroll"

export type CalendarPage = CalendarTimelinePresentationV1["pages"][number]

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
  presentation?: CalendarTimelinePresentationV1
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
  presentation,
}: OwnedCalendarCoordinatorProps) {
  const reduceMotion = useReducedMotion()
  const pagerRef = useRef<PagerView>(null)
  const [headerLaneWidth, setHeaderLaneWidth] = useState(0)
  const [geometryRevision, setGeometryRevision] = useState(0)
  const geometryRevisionRef = useRef(0)
  const resizeSnapshotRef = useRef<CalendarResizeSnapshot | null>(null)
  const revisionRef = useRef(revisionFloor)
  const pendingRevisionRef = useRef<number | null>(null)
  const onTransitionCancelledRef = useRef(onTransitionCancelled)
  const selectedPageRef = useRef(CENTER_PAGE)
  const consumedGenerationRef = useRef<number | null>(null)
  const currentGenerationRef = useRef(generation)
  const foregroundRef = useRef(AppState.currentState === "active")
  const verticalOwnerEpoch = useSharedValue(0)
  const horizontalOwnerEpoch = useSharedValue(0)
  const verticalOwnerGeometryRevision = useSharedValue(0)
  const horizontalOwnerGeometryRevision = useSharedValue(0)
  const committedVerticalOffsetRef = useRef(initialVerticalOffset)
  const verticalCandidateRef = useRef<number | null>(null)
  const verticalFrameRef = useRef<number | null>(null)
  const movementOwnedRef = useRef(false)
  const handledPinchSequenceRef = useRef(0)
  const settledZoomSequenceRef = useRef(0)
  const previousShowWeekendsRef = useRef(showWeekends)
  const progressContextKey = `${generation}:${geometryRevision}:${mode}:${headerLaneWidth}:${showWeekends}`
  const nowMinuteOfDay = minuteOfDayInZone(currentDate, displayZone)
  const onViewportGeometryChange = (
    geometry: TimedViewportGeometry & { rawOffset?: number },
  ) => {
    const previous = resizeSnapshotRef.current
    const pixelsPerHour = zoom.pixelsPerHour.get()
    // `previous === null` is the first complete timed-viewport measurement of
    // this mount — the one moment the usable height and the automatic insets
    // exist and no student scroll can be discarded. That is where a fresh
    // timeline seeks the current minute; every later revision keeps T07's
    // clock-anchor behaviour.
    const rawOffset =
      previous === null
        ? nowAnchoredRawOffset({
            minuteOfDay: nowMinuteOfDay,
            pixelsPerHour,
            geometry: {
              viewportHeight: geometry.height,
              topInset: geometry.topInset,
              bottomInset: geometry.bottomInset,
            },
          })
        : (geometry.rawOffset ?? zoom.rawOffset.get())
    const next = replaceCalendarViewportGeometry(previous, geometry, {
      dateIdentity: dayKey(anchor, displayZone),
      mode,
      rendererGeneration: generation,
      pixelsPerHour,
      rawOffset,
    })
    if (next === previous) return

    cancelVerticalCandidate()
    cancelHorizontalTransition(previous !== null)
    geometryRevisionRef.current = next.geometryRevision
    resizeSnapshotRef.current = next
    committedVerticalOffsetRef.current = next.rawOffset
    const interruptionSequence = zoom.invalidateForGeometry(
      next.geometryRevision,
      next.rawOffset,
      previous !== null,
    )
    if (interruptionSequence !== null)
      handledPinchSequenceRef.current = interruptionSequence
    if (previous === null) {
      verticalOwnerGeometryRevision.set(next.geometryRevision)
      horizontalOwnerGeometryRevision.set(next.geometryRevision)
    }
    setHeaderLaneWidth(Math.max(next.geometry.width - HOURS_COLUMN_WIDTH, 0))
    setGeometryRevision(next.geometryRevision)
  }
  const zoom = useOwnedCalendarZoom({
    generation,
    initialPixelsPerHour,
    initialRawOffset: initialVerticalOffset,
    onViewportGeometryChange,
    onInteractionInterrupted: () => {
      movementOwnedRef.current = true
      cancelVerticalCandidate()
      cancelHorizontalTransition(true)
    },
    onInteractionFinished: () => {
      movementOwnedRef.current = false
    },
    onZoomSettled: (settlement) => {
      if (
        settlement.generation !== currentGenerationRef.current ||
        settlement.geometryRevision !== geometryRevisionRef.current ||
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
  const nativeScrollGesture = Gesture.Native()
    .withTestId("owned-calendar-native-scroll")
    .onBegin(() => {
      "worklet"
      if (geometryRevision !== zoom.geometryRevision.get()) return
      const epoch = pinchInterruptionSequence.get()
      if (pinchActive.get() || epoch === verticalOwnerEpoch.get()) return
      verticalOwnerEpoch.set(epoch)
      verticalOwnerGeometryRevision.set(geometryRevision)
      verticalCallbacksBlocked.set(false)
    })
  const nativePagerGesture = Gesture.Native()
    .withTestId("owned-calendar-native-pager")
    .onBegin(() => {
      "worklet"
      if (geometryRevision !== zoom.geometryRevision.get()) return
      const epoch = pinchInterruptionSequence.get()
      if (pinchActive.get() || epoch === horizontalOwnerEpoch.get()) return
      horizontalOwnerEpoch.set(epoch)
      horizontalOwnerGeometryRevision.set(geometryRevision)
      horizontalCallbacksBlocked.set(false)
    })
  // The pinch must not block either native owner: a one-finger pinch only fails
  // when the finger lifts, so a blocked scroll or pager pan would wait for the
  // release before it begins.
  const pinchGesture = zoom.pinchGesture
  const pages =
    presentation?.pages ??
    buildCalendarTimelinePresentation({
      range: planCalendarThreePageRange({
        anchor,
        mode,
        displayZone,
        firstWeekday,
        showWeekends,
      }),
      generation,
      events: [],
    }).pages
  const todayKey = dayKey(currentDate, displayZone)
  // Explicit full-day bounds and the settled scale — the helper's 07:00–21:00
  // defaults stay as they are for Home's mini timeline and the agenda.
  const nowIndicator = nowIndicatorPosition(currentDate, displayZone, {
    pixelsPerHour: initialPixelsPerHour,
    startMinute: FULL_DAY_START_MINUTE,
    endMinute: FULL_DAY_END_MINUTE,
  })
  // The gutter chip belongs to the committed centre page only, so it never
  // contradicts the native title mid-drag. A page with no today column — an
  // adjacent week, or a weekend clock with weekends hidden — carries neither
  // the indicator nor the chip, which is how both signals stay in agreement
  // with the header's Today cue without a special case.
  const nowOnCommittedPage =
    pages
      .find((page) => page.direction === 0)
      ?.columns.some((column) => column.key === todayKey) ?? false

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
    return (
      verticalCallbacksBlocked.get() ||
      verticalOwnerGeometryRevision.get() !== geometryRevisionRef.current
    )
  }

  const horizontalCallbacksAreBlocked = () => {
    observePinchInterruption()
    return (
      horizontalCallbacksBlocked.get() ||
      horizontalOwnerGeometryRevision.get() !== geometryRevisionRef.current
    )
  }

  // RNGH's iOS native handler only mirrors gesture state for RN ScrollViews, so
  // nativePagerGesture never reports onBegin around PagerView there; the pager's
  // own drag start is the ownership signal both platforms deliver.
  const claimHorizontalOwnership = () => {
    const epoch = pinchInterruptionSequence.get()
    if (pinchActive.get() || epoch === horizontalOwnerEpoch.get()) return
    horizontalOwnerEpoch.set(epoch)
    horizontalOwnerGeometryRevision.set(geometryRevision)
    horizontalCallbacksBlocked.set(false)
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
    if (geometryRevision !== geometryRevisionRef.current) return
    if (currentGenerationRef.current !== generation) return
    if (horizontalCallbacksAreBlocked()) return
    selectedPageRef.current = event.nativeEvent.position
  }

  const onPageScrollStateChanged = (
    event: PageScrollStateChangedNativeEvent,
  ) => {
    if (geometryRevision !== geometryRevisionRef.current) return
    if (currentGenerationRef.current !== generation) return
    observePinchInterruption()
    if (event.nativeEvent.pageScrollState === "dragging") {
      movementOwnedRef.current = true
      claimHorizontalOwnership()
      return
    }
    if (event.nativeEvent.pageScrollState === "idle") {
      movementOwnedRef.current = false
    }
    if (horizontalCallbacksBlocked.get()) return
    if (event.nativeEvent.pageScrollState !== "idle") return
    if (selectedPageRef.current === CENTER_PAGE) {
      cancelHorizontalTransition(false)
      movementOwnedRef.current = false
      return
    }
    settleSelectedPage()
    movementOwnedRef.current = false
  }

  const requestAccessiblePage = (
    direction: WeekDirection,
    source: CalendarTransitionSource,
  ) => {
    if (geometryRevision !== geometryRevisionRef.current) return
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
    movementOwnedRef.current = false
    if (geometryRevision !== geometryRevisionRef.current) return
    if (verticalCallbacksAreBlocked()) return
    cancelVerticalCandidate()
    const nextOffset = event.nativeEvent.contentOffset.y
    committedVerticalOffsetRef.current = nextOffset
    onVerticalOffsetSettled(nextOffset)
  }

  const onScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (geometryRevision !== geometryRevisionRef.current) return
    if (verticalCallbacksAreBlocked()) return
    cancelVerticalCandidate()
    verticalCandidateRef.current = event.nativeEvent.contentOffset.y
    const candidateGeometryRevision = geometryRevision
    verticalFrameRef.current = requestAnimationFrame(() => {
      verticalFrameRef.current = null
      const nextOffset = verticalCandidateRef.current
      verticalCandidateRef.current = null
      if (
        nextOffset === null ||
        candidateGeometryRevision !== geometryRevisionRef.current
      )
        return
      committedVerticalOffsetRef.current = nextOffset
      movementOwnedRef.current = false
      onVerticalOffsetSettled(nextOffset)
    })
  }

  const onScrollBeginDrag = () => {
    observePinchInterruption()
    if (verticalCallbacksBlocked.get()) return
    movementOwnedRef.current = true
    cancelVerticalCandidate()
  }

  const onMomentumScrollBegin = () => {
    movementOwnedRef.current = true
    cancelVerticalCandidate()
  }

  const isEventActivationBlocked = () =>
    movementOwnedRef.current || pinchActive.get()

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
    movementOwnedRef.current = false
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
      movementOwnedRef.current = false
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
    geometryRevision,
    headerStripStyle,
    nowMinuteOfDay,
    nowOnCommittedPage,
    nowVisible: nowIndicator.visible,
    onPageScroll,
    onPageScrollStateChanged,
    onPageSelected,
    onScroll: zoom.onScroll,
    onScrollBeginDrag,
    onScrollEndDrag,
    onMomentumScrollBegin,
    onViewportLayout: zoom.onViewportLayout,
    nativePagerGesture,
    nativeScrollGesture,
    pagerRef,
    pages,
    pinchGesture,
    pixelsPerHour: zoom.pixelsPerHour,
    requestAccessiblePage,
    requestZoom: zoom.requestZoom,
    isEventActivationBlocked,
    scrollRef,
    settleVertical,
    todayKey,
  }
}
