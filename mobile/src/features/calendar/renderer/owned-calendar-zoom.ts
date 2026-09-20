import { useLayoutEffect, useRef } from "react"
import { type LayoutChangeEvent, ScrollView } from "react-native"
import { Gesture } from "react-native-gesture-handler"
import {
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets"

import {
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
  generation: number
  geometryRevision: number
  pixelsPerHour: number
  rawOffset: number
  sequence: number
  source: "pinch" | "command"
}

export function useOwnedCalendarZoom({
  generation,
  initialPixelsPerHour,
  initialRawOffset,
  onZoomSettled,
  onViewportGeometryChange,
  onInteractionInterrupted,
  onInteractionFinished,
}: {
  generation: number
  initialPixelsPerHour: number
  initialRawOffset: number
  onZoomSettled: (settlement: CalendarZoomSettlement) => void
  onViewportGeometryChange: (
    geometry: TimedViewportGeometry & { rawOffset?: number },
  ) => void
  onInteractionInterrupted: () => void
  onInteractionFinished: () => void
}) {
  const appliedInputs = useRef<{
    generation: number
    pixelsPerHour: number
  } | null>(null)
  const scrollRef = useAnimatedRef<ScrollView>()
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
  const pinchGeneration = useSharedValue(generation)
  const pinchSequence = useSharedValue(0)
  const pinchInterruptionSequence = useSharedValue(0)
  const verticalCallbacksBlocked = useSharedValue(false)
  const horizontalCallbacksBlocked = useSharedValue(false)
  const scrollRevision = useSharedValue(0)
  const geometryRevision = useSharedValue(0)
  const pinchGeometryRevision = useSharedValue(0)
  const pinchGesture = Gesture.Pinch()
    .withTestId("owned-calendar-pinch")
    .cancelsTouchesInView(true)
    .onStart((event) => {
      "worklet"
      pinchGeneration.set(generation)
      pinchGeometryRevision.set(geometryRevision.get())
      verticalCallbacksBlocked.set(true)
      horizontalCallbacksBlocked.set(true)
      pinchInterruptionSequence.set(pinchInterruptionSequence.get() + 1)
      pinchSequence.set(pinchSequence.get() + 1)
      pinchBaselineScale.set(pixelsPerHour.get())
      pinchBaselineOffset.set(rawOffset.get())
      pinchBaselineFocalY.set(event.focalY)
      pinchBaselinePointerCount.set(event.numberOfPointers)
      focalY.set(event.focalY)
      pinchActive.set(true)
      pinchStarted.set(true)
      scheduleOnRN(onInteractionInterrupted)
    })
    .onUpdate((event) => {
      "worklet"
      if (
        !pinchActive.get() ||
        pinchGeneration.get() !== generation ||
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
        pinchGeneration.get() !== generation ||
        pinchGeometryRevision.get() !== geometryRevision.get()
      )
        return
      const settledScale = resolvePixelsPerHour(pixelsPerHour.get())
      const settledOffset = rawOffset.get()
      scheduleOnRN(onZoomSettled, {
        generation,
        geometryRevision: geometryRevision.get(),
        pixelsPerHour: settledScale,
        rawOffset: settledOffset,
        sequence: pinchSequence.get(),
        source: "pinch",
      })
    })
    .onFinalize((_event, success) => {
      "worklet"
      if (!pinchStarted.get() || pinchGeneration.get() !== generation) return
      pinchStarted.set(false)
      if (
        !success &&
        pinchGeneration.get() === generation &&
        pinchGeometryRevision.get() === geometryRevision.get()
      ) {
        pixelsPerHour.set(pinchBaselineScale.get())
        rawOffset.set(pinchBaselineOffset.get())
        scrollRevision.set(scrollRevision.get() + 1)
      }
      pinchActive.set(false)
      scheduleOnRN(onInteractionFinished)
    })

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
      horizontalCallbacksBlocked.set(true)
    }
    rawOffset.set(nextRawOffset)
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
      generation,
      geometryRevision: geometryRevision.get(),
      pixelsPerHour: nextScale,
      rawOffset: nextOffset,
      sequence,
      source: "command",
    })
  }

  useLayoutEffect(() => {
    const nextScale = resolvePixelsPerHour(initialPixelsPerHour)
    const previousInputs = appliedInputs.current
    appliedInputs.current = { generation, pixelsPerHour: nextScale }
    if (previousInputs?.generation !== generation) {
      if (previousInputs !== null && pinchActive.get()) {
        pixelsPerHour.set(pinchBaselineScale.get())
        rawOffset.set(pinchBaselineOffset.get())
        scrollRevision.set(scrollRevision.get() + 1)
      }
      pinchActive.set(false)
      pinchStarted.set(false)
      pinchGeneration.set(generation)
      verticalCallbacksBlocked.set(false)
      horizontalCallbacksBlocked.set(false)
    }
    // Settled props acknowledge native motion. Replaying them with scrollTo
    // clamps away UIKit's automatic tab-bar inset in React Native's iOS command.
    // Date changes retain the mounted viewport, including its automatic seek.
    if (
      previousInputs !== null &&
      (previousInputs.pixelsPerHour === nextScale ||
        pixelsPerHour.get() === nextScale)
    )
      return
    pixelsPerHour.set(nextScale)
    rawOffset.set(initialRawOffset)
    pinchBaselineScale.set(nextScale)
    pinchBaselineOffset.set(initialRawOffset)
    pinchActive.set(false)
    pinchStarted.set(false)
    pinchGeneration.set(generation)
    scrollRef.current?.scrollTo({ y: initialRawOffset, animated: false })
  }, [
    generation,
    horizontalCallbacksBlocked,
    initialPixelsPerHour,
    initialRawOffset,
    pinchActive,
    pinchBaselineOffset,
    pinchBaselineScale,
    pinchGeneration,
    pinchSequence,
    pinchStarted,
    pixelsPerHour,
    geometryRevision,
    rawOffset,
    scrollRef,
    scrollRevision,
    verticalCallbacksBlocked,
  ])

  return {
    geometryRevision,
    onScroll,
    onViewportLayout,
    invalidateForGeometry,
    pinchActive,
    pinchGeneration,
    pinchGesture,
    pinchInterruptionSequence,
    pinchSequence,
    pixelsPerHour,
    rawOffset,
    requestZoom,
    scrollRef,
    horizontalCallbacksBlocked,
    verticalCallbacksBlocked,
  }
}
