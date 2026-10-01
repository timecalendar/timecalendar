import { useEffect, useRef, useState } from "react"
import {
  AppState,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native"
import { Gesture } from "react-native-gesture-handler"

import {
  type CalendarTimelineMode,
  dayKey,
  minuteOfDayInZone,
  nowAnchoredRawOffset,
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

export type OwnedCalendarCoordinatorProps = {
  anchor: Date
  mode: CalendarTimelineMode
  displayZone: string
  currentDate: Date
  initialVerticalOffset: number
  initialPixelsPerHour: number
  onVerticalOffsetSettled: (offset: number) => void
  onZoomSettled: (settlement: CalendarZoomSettlement) => void
}

/** The vertical owner and the pinch: the day's clock axis, shared by every page. */
export function useOwnedCalendarCoordinator({
  anchor,
  mode,
  displayZone,
  currentDate,
  initialVerticalOffset,
  initialPixelsPerHour,
  onVerticalOffsetSettled,
  onZoomSettled,
}: OwnedCalendarCoordinatorProps) {
  const [viewportWidth, setViewportWidth] = useState(0)
  const [geometryRevision, setGeometryRevision] = useState(0)
  const geometryRevisionRef = useRef(0)
  const resizeSnapshotRef = useRef<CalendarResizeSnapshot | null>(null)
  const committedVerticalOffsetRef = useRef(initialVerticalOffset)
  const verticalCandidateRef = useRef<number | null>(null)
  const verticalFrameRef = useRef<number | null>(null)
  const movementOwnedRef = useRef(false)
  const handledPinchSequenceRef = useRef(0)
  const settledZoomSequenceRef = useRef(0)
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
      pixelsPerHour,
      rawOffset,
    })
    if (next === previous) return

    cancelVerticalCandidate()
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
    setViewportWidth(next.geometry.width)
    setGeometryRevision(next.geometryRevision)
  }
  const zoom = useOwnedCalendarZoom({
    initialPixelsPerHour,
    initialRawOffset: initialVerticalOffset,
    onViewportGeometryChange,
    onInteractionInterrupted: () => {
      movementOwnedRef.current = true
      cancelVerticalCandidate()
    },
    onInteractionFinished: () => {
      movementOwnedRef.current = false
    },
    onZoomSettled: (settlement) => {
      if (
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
    pinchActive,
    pinchInterruptionSequence,
    scrollRef,
    trackNativeTouch,
    verticalCallbacksBlocked,
  } = zoom
  // Both native handlers are uninterruptible: the horizontal pager activating
  // mid-scroll would otherwise cancel this one, and the reverse.
  const nativeScrollGesture = Gesture.Native()
    .withTestId("owned-calendar-native-scroll")
    .disallowInterruption(true)
    .simultaneousWithExternalGesture(zoom.pinchGesture)
    .onBegin(() => {
      "worklet"
      trackNativeTouch("vertical", true)
      if (!pinchActive.get()) verticalCallbacksBlocked.set(false)
    })
    .onFinalize(() => {
      "worklet"
      trackNativeTouch("vertical", false)
    })

  const cancelVerticalCandidate = () => {
    if (verticalFrameRef.current !== null) {
      cancelAnimationFrame(verticalFrameRef.current)
      verticalFrameRef.current = null
    }
    verticalCandidateRef.current = null
  }

  const observePinchInterruption = () => {
    const sequence = pinchInterruptionSequence.get()
    if (sequence === handledPinchSequenceRef.current) return
    handledPinchSequenceRef.current = sequence
    cancelVerticalCandidate()
  }

  const verticalCallbacksAreBlocked = () => {
    observePinchInterruption()
    return verticalCallbacksBlocked.get()
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

  const isVerticalMovementOwned = () =>
    movementOwnedRef.current || pinchActive.get()

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") return
      pinchActive.set(false)
      if (verticalFrameRef.current !== null) {
        cancelAnimationFrame(verticalFrameRef.current)
        verticalFrameRef.current = null
      }
      verticalCandidateRef.current = null
      movementOwnedRef.current = false
      scrollRef.current?.scrollTo({
        y: committedVerticalOffsetRef.current,
        animated: false,
      })
    })
    return () => {
      subscription.remove()
      pinchActive.set(false)
      if (verticalFrameRef.current !== null) {
        cancelAnimationFrame(verticalFrameRef.current)
      }
    }
  }, [pinchActive, scrollRef])

  return {
    nowMinuteOfDay,
    viewportWidth,
    nativeScrollGesture,
    onScroll: zoom.onScroll,
    onScrollBeginDrag,
    onScrollEndDrag,
    onMomentumScrollBegin,
    onViewportLayout: zoom.onViewportLayout,
    pinchGesture: zoom.pinchGesture,
    pixelsPerHour: zoom.pixelsPerHour,
    requestZoom: zoom.requestZoom,
    isVerticalMovementOwned,
    scrollLocked: zoom.scrollLocked,
    trackNativeTouch,
    scrollRef,
    settleVertical,
  }
}
