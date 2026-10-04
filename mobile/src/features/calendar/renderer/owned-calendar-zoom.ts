import { useEffectEvent, useLayoutEffect, useRef } from "react"
import type { LayoutChangeEvent } from "react-native"
import { Gesture } from "react-native-gesture-handler"
import Animated, {
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets"

import {
  clampRawOffset,
  DEFAULT_PIXELS_PER_HOUR,
  focalPreservingRawOffset,
  fullDayContentHeight,
  resolvePixelsPerHour,
  stepPixelsPerHour,
  usableViewportCenterY,
} from "@/features/calendar/data"

import type { TimedViewportGeometry } from "./owned-calendar-resize"

export type CalendarZoomCommand = "in" | "out" | "reset"

export type CalendarZoomSettlement = {
  geometryRevision: number
  pixelsPerHour: number
  rawOffset: number
  sequence: number
  source: "pinch" | "command"
}

export function useOwnedCalendarZoom({
  initialPixelsPerHour,
  initialRawOffset,
  onZoomSettled,
  onViewportGeometryChange,
  onInteractionInterrupted,
  onInteractionFinished,
}: {
  initialPixelsPerHour: number
  initialRawOffset: number
  onZoomSettled: (settlement: CalendarZoomSettlement) => void
  onViewportGeometryChange: (
    geometry: TimedViewportGeometry & { rawOffset?: number },
  ) => void
  onInteractionInterrupted: () => void
  onInteractionFinished: () => void
}) {
  const appliedPixelsPerHour = useRef<number | null>(null)
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const pixelsPerHour = useSharedValue(
    resolvePixelsPerHour(initialPixelsPerHour),
  )
  const rawOffset = useSharedValue(initialRawOffset)
  const viewportHeight = useSharedValue(0)
  const viewportWidth = useSharedValue(0)
  const topInset = useSharedValue(0)
  const bottomInset = useSharedValue(0)
  const focalY = useSharedValue(0)
  const pinchBaselineScale = useSharedValue(
    resolvePixelsPerHour(initialPixelsPerHour),
  )
  const pinchBaselineOffset = useSharedValue(initialRawOffset)
  const pinchBaselineFocalY = useSharedValue(0)
  const pinchBaselinePointerCount = useSharedValue(0)
  const pinchActive = useSharedValue(false)
  const pinchStarted = useSharedValue(false)
  const pinchSettled = useSharedValue(false)
  const pinchSequence = useSharedValue(0)
  const pinchInterruptionSequence = useSharedValue(0)
  const verticalCallbacksBlocked = useSharedValue(false)
  const scrollLocked = useSharedValue(false)
  const verticalTouched = useSharedValue(false)
  const horizontalTouched = useSharedValue(false)
  const scrollRevision = useSharedValue(0)
  const geometryRevision = useSharedValue(0)
  const pinchGeometryRevision = useSharedValue(0)
  const boundedRawOffset = (requested: number, scale: number) => {
    "worklet"
    // Automatic insets and the viewport are not known on the initial mount.
    if (viewportHeight.get() <= 0)
      return Number.isFinite(requested) ? requested : 0
    return clampRawOffset(requested, {
      contentHeight: fullDayContentHeight(scale),
      viewportHeight: viewportHeight.get(),
      topInset: topInset.get(),
      bottomInset: bottomInset.get(),
    })
  }
  const scrollToOffset = (requested: number) => {
    const nextOffset = boundedRawOffset(requested, pixelsPerHour.get())
    rawOffset.set(nextOffset)
    scrollRef.current?.scrollTo({ y: nextOffset, animated: false })
    return nextOffset
  }
  const unlockScrollIfReleased = () => {
    "worklet"
    if (pinchStarted.get() || verticalTouched.get() || horizontalTouched.get())
      return
    scrollLocked.set(false)
  }
  // A second finger locks both scroll views: the vertical one would follow the
  // fingers against the focal scroll, and the horizontal one would page. They
  // unlock once every touch on them ends.
  const pinchGesture = Gesture.Pinch()
    .withTestId("owned-calendar-pinch")
    .cancelsTouchesInView(true)
    .onTouchesDown((event) => {
      "worklet"
      if (event.numberOfTouches >= 2) scrollLocked.set(true)
    })
    .onStart((event) => {
      "worklet"
      scrollLocked.set(true)
      pinchGeometryRevision.set(geometryRevision.get())
      verticalCallbacksBlocked.set(true)
      pinchInterruptionSequence.set(pinchInterruptionSequence.get() + 1)
      pinchSequence.set(pinchSequence.get() + 1)
      pinchBaselineScale.set(pixelsPerHour.get())
      pinchBaselineOffset.set(rawOffset.get())
      pinchBaselineFocalY.set(event.focalY)
      pinchBaselinePointerCount.set(event.numberOfPointers)
      focalY.set(event.focalY)
      pinchActive.set(true)
      pinchStarted.set(true)
      pinchSettled.set(false)
      scheduleOnRN(onInteractionInterrupted)
    })
    .onUpdate((event) => {
      "worklet"
      if (
        !pinchActive.get() ||
        pinchGeometryRevision.get() !== geometryRevision.get()
      )
        return
      // Lifting a finger changes the reported midpoint without moving the grid.
      // Zero-touch trackpad pinches have no two-finger baseline to lose.
      if (pinchBaselinePointerCount.get() >= 2 && event.numberOfPointers < 2)
        return
      const nextScale = resolvePixelsPerHour(
        pinchBaselineScale.get() * event.scale,
      )
      const nextFocalY = Number.isFinite(event.focalY)
        ? event.focalY
        : focalY.get()
      const nextOffset = focalPreservingRawOffset({
        rawOffset: pinchBaselineOffset.get(),
        focalY: pinchBaselineFocalY.get(),
        nextFocalY,
        oldPixelsPerHour: pinchBaselineScale.get(),
        newPixelsPerHour: nextScale,
        geometry: {
          contentHeight: fullDayContentHeight(nextScale),
          viewportHeight: viewportHeight.get(),
          topInset: topInset.get(),
          bottomInset: bottomInset.get(),
        },
      })
      focalY.set(nextFocalY)
      pixelsPerHour.set(nextScale)
      rawOffset.set(nextOffset)
      scrollRevision.set(scrollRevision.get() + 1)
    })
    .onEnd((_event, success) => {
      "worklet"
      if (
        !success ||
        !pinchActive.get() ||
        pinchGeometryRevision.get() !== geometryRevision.get()
      )
        return
      const settledScale = resolvePixelsPerHour(pixelsPerHour.get())
      const settledOffset = rawOffset.get()
      pinchSettled.set(true)
      scheduleOnRN(onZoomSettled, {
        geometryRevision: geometryRevision.get(),
        pixelsPerHour: settledScale,
        rawOffset: settledOffset,
        sequence: pinchSequence.get(),
        source: "pinch",
      })
    })
    .onFinalize((_event, success) => {
      "worklet"
      if (!pinchStarted.get()) {
        unlockScrollIfReleased()
        return
      }
      pinchStarted.set(false)
      if (
        !success &&
        !pinchSettled.get() &&
        pinchGeometryRevision.get() === geometryRevision.get()
      ) {
        pixelsPerHour.set(pinchBaselineScale.get())
        rawOffset.set(
          boundedRawOffset(pinchBaselineOffset.get(), pinchBaselineScale.get()),
        )
        scrollRevision.set(scrollRevision.get() + 1)
      }
      pinchActive.set(false)
      unlockScrollIfReleased()
      scheduleOnRN(onInteractionFinished)
    })

  const trackNativeTouch = (axis: "vertical" | "horizontal", down: boolean) => {
    "worklet"
    if (axis === "vertical") verticalTouched.set(down)
    else horizontalTouched.set(down)
    if (!down) unlockScrollIfReleased()
  }

  useAnimatedReaction(
    () => scrollRevision.get(),
    (nextRevision, previousRevision) => {
      if (nextRevision === previousRevision) return
      scrollTo(scrollRef, 0, rawOffset.get(), false)
    },
  )

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      const callbacksBlocked = verticalCallbacksBlocked.get()
      const nextWidth = event.layoutMeasurement.width
      const nextHeight = event.layoutMeasurement.height
      const nextTopInset = event.contentInset.top
      const nextBottomInset = event.contentInset.bottom
      const geometryChanged =
        nextWidth !== viewportWidth.get() ||
        nextHeight !== viewportHeight.get() ||
        nextTopInset !== topInset.get() ||
        nextBottomInset !== bottomInset.get()
      if (geometryChanged) {
        viewportWidth.set(nextWidth)
        viewportHeight.set(nextHeight)
        topInset.set(nextTopInset)
        bottomInset.set(nextBottomInset)
        scheduleOnRN(onViewportGeometryChange, {
          width: nextWidth,
          height: nextHeight,
          topInset: nextTopInset,
          bottomInset: nextBottomInset,
          ...(callbacksBlocked ? {} : { rawOffset: event.contentOffset.y }),
        })
      }
      if (callbacksBlocked) return
      rawOffset.set(event.contentOffset.y)
    },
  })

  const onViewportLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    viewportWidth.set(width)
    viewportHeight.set(height)
    onViewportGeometryChange({
      width,
      height,
      topInset: topInset.get(),
      bottomInset: bottomInset.get(),
    })
  }

  const invalidateForGeometry = (
    revision: number,
    nextRawOffset: number,
    cancelPrevious: boolean,
  ) => {
    geometryRevision.set(revision)
    let interruptionSequence: number | null = null
    if (cancelPrevious) {
      interruptionSequence = pinchInterruptionSequence.get() + 1
      pinchActive.set(false)
      pinchInterruptionSequence.set(interruptionSequence)
      verticalCallbacksBlocked.set(true)
    }
    rawOffset.set(boundedRawOffset(nextRawOffset, pixelsPerHour.get()))
    scrollRevision.set(scrollRevision.get() + 1)
    return interruptionSequence
  }

  const requestZoom = (nextCommand: CalendarZoomCommand) => {
    const oldScale = pixelsPerHour.get()
    const nextScale =
      nextCommand === "reset"
        ? DEFAULT_PIXELS_PER_HOUR
        : stepPixelsPerHour(oldScale, nextCommand === "in" ? 1 : -1)
    if (nextScale === oldScale) return
    const centerY = usableViewportCenterY(
      viewportHeight.get(),
      topInset.get(),
      bottomInset.get(),
    )
    const nextOffset = focalPreservingRawOffset({
      rawOffset: rawOffset.get(),
      focalY: centerY,
      oldPixelsPerHour: oldScale,
      newPixelsPerHour: nextScale,
      geometry: {
        contentHeight: fullDayContentHeight(nextScale),
        viewportHeight: viewportHeight.get(),
        topInset: topInset.get(),
        bottomInset: bottomInset.get(),
      },
    })
    const sequence = pinchSequence.get() + 1
    pinchSequence.set(sequence)
    pixelsPerHour.set(nextScale)
    rawOffset.set(nextOffset)
    scrollRevision.set(scrollRevision.get() + 1)
    onZoomSettled({
      geometryRevision: geometryRevision.get(),
      pixelsPerHour: nextScale,
      rawOffset: nextOffset,
      sequence,
      source: "command",
    })
  }

  const applyInitialOffset = useEffectEvent(scrollToOffset)
  useLayoutEffect(() => {
    const nextScale = resolvePixelsPerHour(initialPixelsPerHour)
    const previous = appliedPixelsPerHour.current
    appliedPixelsPerHour.current = nextScale
    // Settled props acknowledge native motion; replaying an acknowledgement
    // can rewind a newer gesture before its own settlement reaches React.
    if (
      previous !== null &&
      (previous === nextScale || pixelsPerHour.get() === nextScale)
    )
      return
    pixelsPerHour.set(nextScale)
    const nextOffset = applyInitialOffset(initialRawOffset)
    pinchBaselineScale.set(nextScale)
    pinchBaselineOffset.set(nextOffset)
    pinchActive.set(false)
    pinchStarted.set(false)
  }, [
    initialPixelsPerHour,
    initialRawOffset,
    pinchActive,
    pinchBaselineOffset,
    pinchBaselineScale,
    pinchStarted,
    pixelsPerHour,
  ])

  return {
    geometryRevision,
    onScroll,
    onViewportLayout,
    invalidateForGeometry,
    pinchActive,
    pinchGesture,
    pinchInterruptionSequence,
    pinchSequence,
    pixelsPerHour,
    rawOffset,
    requestZoom,
    scrollToOffset,
    scrollLocked,
    scrollRef,
    trackNativeTouch,
    verticalCallbacksBlocked,
  }
}
