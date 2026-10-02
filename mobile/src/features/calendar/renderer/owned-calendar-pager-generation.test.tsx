import { act, render } from "@testing-library/react-native"
import { useLayoutEffect } from "react"
import { View } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import { getByGestureTestId } from "react-native-gesture-handler/jest-utils"
import * as Reanimated from "react-native-reanimated"

import {
  initialPlacementDecision,
  useOwnedCalendarPager,
} from "./owned-calendar-pager"

type NativeHandlers = {
  onBegin: (event: Record<string, unknown>) => void
  onFinalize: (event: Record<string, unknown>, success: boolean) => void
}

const nativeHandlers = () =>
  (
    getByGestureTestId("owned-calendar-native-pager") as unknown as {
      handlers: NativeHandlers
    }
  ).handlers

test("initial placement reveals only a measured target and bounds retries", () => {
  expect(initialPlacementDecision(0, 91520, 0)).toBe("retry")
  expect(initialPlacementDecision(null, 91520, 2)).toBe("retry")
  expect(initialPlacementDecision(Number.NaN, 91520, 3)).toBe("hide")
  expect(initialPlacementDecision(91520, Number.NaN, 0)).toBe("hide")
  expect(initialPlacementDecision(91520, 91520, 3)).toBe("reveal")
})

function PagerProbe({
  mode,
  trackNativeTouch,
  onSettled = jest.fn(),
  onCenterChange = jest.fn(),
  recordStep,
}: {
  mode: "day" | "week"
  trackNativeTouch: jest.Mock
  onSettled?: jest.Mock
  onCenterChange?: jest.Mock
  recordStep?: (step: (direction: -1 | 1, animated: boolean) => void) => void
}) {
  const scrollLocked = Reanimated.useSharedValue(false)
  const pager = useOwnedCalendarPager({
    space: { mode, firstWeekday: 1 },
    anchorIndex: mode === "week" ? 2960 : 20700,
    pageWidth: 320,
    reduceMotion: true,
    scrollLocked,
    pinchGesture: Gesture.Pinch(),
    trackNativeTouch,
    onSettled,
    onCenterChange,
  })
  useLayoutEffect(() => {
    recordStep?.(pager.step)
  })
  return (
    <GestureDetector gesture={pager.nativeGesture}>
      <View />
    </GestureDetector>
  )
}

test("an abandoned advance callback cannot move the new mode", async () => {
  const onCenterChange = jest.fn()
  const steps: ((direction: -1 | 1, animated: boolean) => void)[] = []
  const props = {
    trackNativeTouch: jest.fn(),
    onCenterChange,
    recordStep: (step: (direction: -1 | 1, animated: boolean) => void) => {
      steps.push(step)
    },
  }
  const view = await render(<PagerProbe mode="week" {...props} />)
  const abandonedStep = steps.at(-1)
  await view.rerender(<PagerProbe mode="day" {...props} />)
  await act(async () => abandonedStep?.(1, false))
  expect(onCenterChange).not.toHaveBeenCalled()

  const currentStep = steps.at(-1)
  await act(async () => currentStep?.(1, false))
  expect(onCenterChange).toHaveBeenCalledWith(20701)
})

test("a mode switch releases the old native touch without clearing a new one", async () => {
  const trackNativeTouch = jest.fn()
  const view = await render(
    <PagerProbe mode="week" trackNativeTouch={trackNativeTouch} />,
  )
  await act(async () => new Promise((resolve) => setTimeout(resolve, 0)))
  const old = nativeHandlers()
  await act(async () => old.onBegin({}))
  expect(trackNativeTouch).toHaveBeenLastCalledWith("horizontal", true)

  await view.rerender(
    <PagerProbe mode="day" trackNativeTouch={trackNativeTouch} />,
  )
  await act(async () => new Promise((resolve) => setTimeout(resolve, 0)))
  expect(trackNativeTouch).toHaveBeenLastCalledWith("horizontal", false)

  const current = nativeHandlers()
  await act(async () => current.onBegin({}))
  const callsBeforeLateFinalize = trackNativeTouch.mock.calls.length
  await act(async () => old.onFinalize({}, true))
  expect(trackNativeTouch).toHaveBeenCalledTimes(callsBeforeLateFinalize)
  await act(async () => current.onFinalize({}, true))
  expect(trackNativeTouch).toHaveBeenLastCalledWith("horizontal", false)
})

test("a touch-release reaction cannot settle before the new pager has a width", async () => {
  const reactions: ((value: unknown, previous: unknown) => void)[] = []
  const spy = jest
    .spyOn(Reanimated, "useAnimatedReaction")
    .mockImplementation((_prepare, react) => {
      reactions.push(react as (value: unknown, previous: unknown) => void)
    })
  try {
    const onSettled = jest.fn()
    await render(
      <PagerProbe
        mode="week"
        trackNativeTouch={jest.fn()}
        onSettled={onSettled}
      />,
    )
    expect(reactions).toHaveLength(2)
    await act(async () => {
      reactions[1]?.(1, 0)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(onSettled).not.toHaveBeenCalled()
  } finally {
    spy.mockRestore()
  }
})
