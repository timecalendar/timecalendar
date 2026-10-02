import { StyleSheet } from "react-native"
import {
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
} from "react-native-reanimated"

import {
  FULL_DAY_END_MINUTE,
  FULL_DAY_START_MINUTE,
  gridContentHeight,
  MAX_PIXELS_PER_HOUR,
  minuteToPixel,
} from "@/features/calendar/data"

export function dayRowHeight(pixelsPerHour: number) {
  "worklet"
  return (
    gridContentHeight(
      FULL_DAY_START_MINUTE,
      FULL_DAY_END_MINUTE,
      pixelsPerHour,
    ) + StyleSheet.hairlineWidth
  )
}

/** Pages are laid out once at the tallest zoom; the day row clips them to the live scale. */
export const PAGE_CONTENT_HEIGHT = dayRowHeight(MAX_PIXELS_PER_HOUR)

export function useMinutePositionStyle(
  minute: number,
  pixelsPerHour: SharedValue<number>,
) {
  return useAnimatedStyle(() => ({
    top: minuteToPixel(minute, {
      startMinute: FULL_DAY_START_MINUTE,
      pixelsPerHour: pixelsPerHour.get(),
    }),
  }))
}

/** A scroll view's `scrollEnabled`, locked while a pinch holds it. */
export function useScrollLockProps(scrollLocked: SharedValue<boolean>) {
  return useAnimatedProps(() => ({ scrollEnabled: !scrollLocked.get() }))
}

export type ScrollLockProps = ReturnType<typeof useScrollLockProps>

export function horizontalRectangleStyle(rectangle: {
  left: number
  right: number
}) {
  return {
    left: `${rectangle.left * 100}%` as const,
    right:
      rectangle.right === 1 ? 2 : (`${(1 - rectangle.right) * 100}%` as const),
  }
}
