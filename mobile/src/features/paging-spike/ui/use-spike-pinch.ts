import { Gesture } from "react-native-gesture-handler"
import Animated, {
  type AnimatedRef,
  scrollTo,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets"

import {
  DEFAULT_PIXELS_PER_HOUR,
  MAX_PIXELS_PER_HOUR,
  MIN_PIXELS_PER_HOUR,
} from "@/features/paging-spike/data"

export function useSpikePinch({
  verticalRef,
  focalTop,
  onPinchEnd,
}: {
  verticalRef: AnimatedRef<Animated.ScrollView>
  focalTop: number
  onPinchEnd: (pixelsPerHour: number) => void
}) {
  const liveScale = useSharedValue(DEFAULT_PIXELS_PER_HOUR)
  const verticalOffset = useSharedValue(0)
  const viewportHeight = useSharedValue(0)
  const pinchBaseScale = useSharedValue(DEFAULT_PIXELS_PER_HOUR)
  const pinchBaseOffset = useSharedValue(0)
  const pinchBaseFocal = useSharedValue(0)
  const pinchOffset = useSharedValue(-1)
  const pinchLifted = useSharedValue(false)
  const previousScale = useSharedValue(DEFAULT_PIXELS_PER_HOUR)
  const previousOffset = useSharedValue(-1)
  const pinching = useSharedValue(false)
  const verticalTouched = useSharedValue(false)
  const horizontalTouched = useSharedValue(false)
  const scrollLocked = useSharedValue(false)

  const unlockScrollIfReleased = () => {
    "worklet"
    if (pinching.get() || verticalTouched.get() || horizontalTouched.get()) {
      return
    }
    scrollLocked.set(false)
  }

  const verticalHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      verticalOffset.set(event.contentOffset.y)
      viewportHeight.set(event.layoutMeasurement.height)
    },
  })

  useAnimatedReaction(
    () => pinchOffset.get(),
    (offset, previous) => {
      if (offset < 0 || offset === previous) return
      verticalOffset.set(offset)
      scrollTo(verticalRef, 0, offset, false)
    },
  )

  // A pinch locks both ScrollViews: the vertical one would follow the fingers
  // and fling on lift, and the horizontal one would bring in neighbour pages,
  // which do not follow the live scale. They unlock once every touch on them
  // ends: a finger left down would scroll by everything it moved meanwhile.
  const pinch = Gesture.Pinch()
    .onTouchesDown((event) => {
      if (event.numberOfTouches >= 2) scrollLocked.set(true)
    })
    .onStart((event) => {
      pinchLifted.set(false)
      pinching.set(true)
      scrollLocked.set(true)
      pinchBaseScale.set(liveScale.get())
      pinchBaseOffset.set(verticalOffset.get())
      pinchBaseFocal.set(event.focalY - focalTop)
    })
    .onUpdate((event) => {
      if (pinchLifted.get() || event.numberOfPointers < 2) return
      previousScale.set(liveScale.get())
      previousOffset.set(pinchOffset.get())
      const scale = Math.min(
        Math.max(pinchBaseScale.get() * event.scale, MIN_PIXELS_PER_HOUR),
        MAX_PIXELS_PER_HOUR,
      )
      const clockHour =
        (pinchBaseOffset.get() + pinchBaseFocal.get()) / pinchBaseScale.get()
      const maxOffset = Math.max(24 * scale - viewportHeight.get(), 0)
      const offset = Math.min(
        Math.max(clockHour * scale - (event.focalY - focalTop), 0),
        maxOffset,
      )
      liveScale.set(scale)
      pinchOffset.set(offset)
    })
    // The pinch stays active until every finger lifts, and the event that lifts
    // the first one already moves the focal point onto the finger left down. The
    // update it carries would scroll the anchored hour by half the spread, so it
    // is undone and the zoom holds until the last finger lifts.
    .onTouchesUp(() => {
      if (pinchLifted.get()) return
      pinchLifted.set(true)
      liveScale.set(previousScale.get())
      pinchOffset.set(previousOffset.get())
    })
    .onEnd(() => {
      scheduleOnRN(onPinchEnd, liveScale.get())
    })
    .onFinalize(() => {
      pinching.set(false)
      unlockScrollIfReleased()
    })
  // A native handler is interruptible by default: the vertical ScrollView
  // activating mid-swipe cancels the horizontal one, which then never snaps.
  // Uninterruptible handlers keep a touch on whichever axis claims it first.
  const verticalNative = Gesture.Native()
    .disallowInterruption(true)
    .simultaneousWithExternalGesture(pinch)
    .onBegin(() => {
      verticalTouched.set(true)
    })
    .onFinalize(() => {
      verticalTouched.set(false)
      unlockScrollIfReleased()
    })
  const horizontalNative = Gesture.Native()
    .disallowInterruption(true)
    .simultaneousWithExternalGesture(pinch)
    .onBegin(() => {
      horizontalTouched.set(true)
    })
    .onFinalize(() => {
      horizontalTouched.set(false)
      unlockScrollIfReleased()
    })
  const scrollProps = useAnimatedProps(() => ({
    scrollEnabled: !scrollLocked.get(),
  }))

  return {
    liveScale,
    scrollLocked,
    pinch,
    verticalNative,
    horizontalNative,
    scrollProps,
    verticalHandler,
  }
}
