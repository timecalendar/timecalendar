import { useLayoutEffect } from "react"
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

export type CalendarZoomCommand = "in" | "out" | "reset"

export type CalendarZoomSettlement = {
  generation: number
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
}: {
  generation: number
  initialPixelsPerHour: number
  initialRawOffset: number
  onZoomSettled: (settlement: CalendarZoomSettlement) => void
}) {
  const scrollRef = useAnimatedRef<ScrollView>()
  const pixelsPerHour = useSharedValue(
    resolvePixelsPerHour(initialPixelsPerHour),
  )
  const rawOffset = useSharedValue(initialRawOffset)
  const viewportHeight = useSharedValue(0)
  const topInset = useSharedValue(0)
  const bottomInset = useSharedValue(0)
  const focalY = useSharedValue(0)
  const pinchBaselineScale = useSharedValue(pixelsPerHour.get())
  const pinchBaselineOffset = useSharedValue(initialRawOffset)
  const pinchBaselineFocalY = useSharedValue(0)
  const pinchActive = useSharedValue(false)
  const pinchGeneration = useSharedValue(generation)
  const pinchSequence = useSharedValue(0)
  const scrollRevision = useSharedValue(0)
  const pinchGesture = Gesture.Pinch()
    .withTestId("owned-calendar-pinch")
    .cancelsTouchesInView(true)
    .onStart((event) => {
      "worklet"
      pinchGeneration.set(generation)
      pinchSequence.set(pinchSequence.get() + 1)
      pinchBaselineScale.set(pixelsPerHour.get())
      pinchBaselineOffset.set(rawOffset.get())
      pinchBaselineFocalY.set(event.focalY)
      focalY.set(event.focalY)
      pinchActive.set(true)
    })
    .onUpdate((event) => {
      "worklet"
      if (pinchGeneration.get() !== generation) return
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
      if (!success) return
      const settledScale = resolvePixelsPerHour(pixelsPerHour.get())
      const settledOffset = rawOffset.get()
      pinchActive.set(false)
      scheduleOnRN(onZoomSettled, {
        generation,
        pixelsPerHour: settledScale,
        rawOffset: settledOffset,
        sequence: pinchSequence.get(),
        source: "pinch",
      })
    })
    .onFinalize((_event, success) => {
      "worklet"
      if (!success && pinchGeneration.get() === generation) {
        pixelsPerHour.set(pinchBaselineScale.get())
        rawOffset.set(pinchBaselineOffset.get())
        scrollRevision.set(scrollRevision.get() + 1)
      }
      pinchActive.set(false)
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
      viewportHeight.set(event.layoutMeasurement.height)
      topInset.set(event.contentInset.top)
      bottomInset.set(event.contentInset.bottom)
      rawOffset.set(event.contentOffset.y)
    },
  })

  const onViewportLayout = (event: LayoutChangeEvent) => {
    viewportHeight.set(event.nativeEvent.layout.height)
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
      pixelsPerHour: nextScale,
      rawOffset: nextOffset,
      sequence,
      source: "command",
    })
  }

  useLayoutEffect(() => {
    const nextScale = resolvePixelsPerHour(initialPixelsPerHour)
    pixelsPerHour.set(nextScale)
    rawOffset.set(initialRawOffset)
    pinchBaselineScale.set(nextScale)
    pinchBaselineOffset.set(initialRawOffset)
    pinchActive.set(false)
    pinchGeneration.set(generation)
    scrollRef.current?.scrollTo({ y: initialRawOffset, animated: false })
  }, [
    generation,
    initialPixelsPerHour,
    initialRawOffset,
    pinchActive,
    pinchBaselineOffset,
    pinchBaselineScale,
    pinchGeneration,
    pinchSequence,
    pixelsPerHour,
    rawOffset,
    scrollRef,
  ])

  return {
    bottomInset,
    focalY,
    onScroll,
    onViewportLayout,
    pinchActive,
    pinchGeneration,
    pinchGesture,
    pinchSequence,
    pixelsPerHour,
    rawOffset,
    requestZoom,
    scrollRef,
    topInset,
    viewportHeight,
  }
}
