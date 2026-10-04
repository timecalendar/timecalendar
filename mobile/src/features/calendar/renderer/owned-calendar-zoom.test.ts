import { act, renderHook } from "@testing-library/react-native"
import { PointerType, State } from "react-native-gesture-handler"
import * as Reanimated from "react-native-reanimated"

import { useOwnedCalendarZoom } from "./owned-calendar-zoom"

const pinchEvent = (scale = 1, focalY = 250, numberOfPointers = 2) => ({
  handlerTag: 1,
  state: State.ACTIVE,
  oldState: State.BEGAN,
  pointerType: PointerType.TOUCH,
  numberOfPointers,
  focalX: 160,
  focalY,
  scale,
  velocity: 0,
})

describe("calendar zoom settlement", () => {
  const scrollTo = jest.fn()
  const props = {
    initialPixelsPerHour: 60,
    initialRawOffset: 300,
    onZoomSettled: jest.fn(),
    onViewportGeometryChange: jest.fn(),
    onInteractionInterrupted: jest.fn(),
    onInteractionFinished: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Reanimated, "useAnimatedRef").mockReturnValue({
      current: { scrollTo },
    } as unknown as ReturnType<typeof Reanimated.useAnimatedRef>)
  })

  afterEach(() => jest.restoreAllMocks())

  it.each([0, 1])(
    "keeps the last two-finger anchor when a release update has %i fingers",
    async (remainingFingers) => {
      const { result } = await renderHook(useOwnedCalendarZoom, {
        initialProps: { ...props, initialRawOffset: 480 },
      })
      const { handlers } = result.current.pinchGesture
      await act(async () => {
        handlers.onBegin?.(pinchEvent())
        handlers.onStart?.(pinchEvent())
        handlers.onUpdate?.(pinchEvent(1.5))
      })
      expect(result.current.rawOffset.get()).toBe(845)

      await act(async () => {
        handlers.onUpdate?.(pinchEvent(1.5, 520, remainingFingers))
        handlers.onEnd?.(pinchEvent(1.5, 520, remainingFingers), true)
        handlers.onFinalize?.(pinchEvent(1.5, 520, remainingFingers), true)
      })

      expect(result.current.rawOffset.get()).toBe(845)
      expect(result.current.pixelsPerHour.get()).toBe(90)
      expect(props.onZoomSettled).toHaveBeenCalledTimes(1)
      expect(props.onZoomSettled).toHaveBeenCalledWith(
        expect.objectContaining({ rawOffset: 845, pixelsPerHour: 90 }),
      )
    },
  )

  it("lets a one-finger gesture finish without restoring an old pinch baseline", async () => {
    const { result } = await renderHook(useOwnedCalendarZoom, {
      initialProps: props,
    })
    const { handlers } = result.current.pinchGesture
    await act(async () => handlers.onBegin?.(pinchEvent(1, 250, 1)))

    expect(result.current.verticalCallbacksBlocked.get()).toBe(false)
    expect(result.current.scrollLocked.get()).toBe(false)
    await act(async () => {
      result.current.rawOffset.set(720)
      handlers.onFinalize?.(pinchEvent(1, 250, 0), false)
    })

    expect(result.current.rawOffset.get()).toBe(720)
    expect(props.onInteractionInterrupted).not.toHaveBeenCalled()
    expect(props.onInteractionFinished).not.toHaveBeenCalled()
    expect(props.onZoomSettled).not.toHaveBeenCalled()
  })

  it("restores the active pinch baseline on cancellation", async () => {
    const { result } = await renderHook(useOwnedCalendarZoom, {
      initialProps: props,
    })
    const { handlers } = result.current.pinchGesture
    await act(async () => {
      handlers.onBegin?.(pinchEvent())
      result.current.rawOffset.set(480)
      handlers.onStart?.(pinchEvent())
      handlers.onUpdate?.(pinchEvent(1.5))
      handlers.onEnd?.(pinchEvent(), false)
      handlers.onFinalize?.(pinchEvent(), false)
    })

    expect(result.current.rawOffset.get()).toBe(480)
    expect(result.current.pixelsPerHour.get()).toBe(60)
    expect(props.onZoomSettled).not.toHaveBeenCalled()
    expect(props.onInteractionFinished).toHaveBeenCalledTimes(1)
  })

  it("keeps a completed pinch when iOS finalizes after the last finger lifts", async () => {
    const { result } = await renderHook(useOwnedCalendarZoom, {
      initialProps: { ...props, initialRawOffset: 480 },
    })
    const { handlers } = result.current.pinchGesture
    await act(async () => {
      handlers.onStart?.(pinchEvent())
      handlers.onUpdate?.(pinchEvent(1.5))
      handlers.onEnd?.(pinchEvent(1.5, 520, 0), true)
      handlers.onFinalize?.(pinchEvent(1.5, 520, 0), false)
    })

    expect(result.current.pixelsPerHour.get()).toBe(90)
    expect(result.current.rawOffset.get()).toBe(845)
    expect(props.onZoomSettled).toHaveBeenCalledTimes(1)
  })

  it("accepts the last two-pointer iOS update after a one-pointer release update", async () => {
    const { result } = await renderHook(useOwnedCalendarZoom, {
      initialProps: { ...props, initialRawOffset: 480 },
    })
    const { handlers } = result.current.pinchGesture
    await act(async () => {
      handlers.onStart?.(pinchEvent())
      handlers.onUpdate?.(pinchEvent(1.4))
      handlers.onUpdate?.(pinchEvent(1.8, 520, 1))
    })
    expect(result.current.pixelsPerHour.get()).toBe(84)

    await act(async () => {
      handlers.onUpdate?.(pinchEvent(1.5, 250, 2))
      handlers.onEnd?.(pinchEvent(1.5, 250, 0), true)
      handlers.onFinalize?.(pinchEvent(1.5, 250, 0), true)
    })
    expect(result.current.pixelsPerHour.get()).toBe(90)
    expect(props.onZoomSettled).toHaveBeenCalledWith(
      expect.objectContaining({ pixelsPerHour: 90, rawOffset: 845 }),
    )
  })

  it.each([0, 2])(
    "tracks a moving focal point for an active pinch starting with %i pointers",
    async (pointers) => {
      const { result } = await renderHook(useOwnedCalendarZoom, {
        initialProps: { ...props, initialRawOffset: 480 },
      })
      const { handlers } = result.current.pinchGesture
      await act(async () => {
        handlers.onStart?.(pinchEvent(1, 250, pointers))
        handlers.onUpdate?.(pinchEvent(1.5, 280, pointers))
      })

      expect((result.current.rawOffset.get() + 280) / 90).toBeCloseTo(
        (480 + 250) / 60,
      )
    },
  )

  it("finishes an interrupted pinch without restoring its obsolete baseline", async () => {
    const { result } = await renderHook(useOwnedCalendarZoom, {
      initialProps: props,
    })
    const { handlers } = result.current.pinchGesture
    await act(async () => {
      handlers.onStart?.(pinchEvent())
      handlers.onUpdate?.(pinchEvent(1.5))
      result.current.invalidateForGeometry(1, 600, true)
      handlers.onEnd?.(pinchEvent(), false)
      handlers.onFinalize?.(pinchEvent(), false)
    })

    expect(result.current.rawOffset.get()).toBe(600)
    expect(result.current.pixelsPerHour.get()).toBe(90)
    expect(props.onZoomSettled).not.toHaveBeenCalled()
    expect(props.onInteractionFinished).toHaveBeenCalledTimes(1)
  })

  it("keeps the native bottom-inset offset when a scroll settlement returns through props", async () => {
    const { result, rerender } = await renderHook(useOwnedCalendarZoom, {
      initialProps: props,
    })
    // 24 hours at 60 px/hour, a 500 px viewport, and 80 px of tab-bar clearance.
    const bottomOffset = 1440 - 500 + 80
    await act(async () => result.current.rawOffset.set(bottomOffset))
    scrollTo.mockClear()

    await rerender({ ...props, initialRawOffset: bottomOffset })

    expect(result.current.rawOffset.get()).toBe(bottomOffset)
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it("does not rewind live motion when an older scroll settlement arrives", async () => {
    const { result, rerender } = await renderHook(useOwnedCalendarZoom, {
      initialProps: props,
    })
    await act(async () => result.current.rawOffset.set(1020))
    scrollTo.mockClear()

    await rerender({ ...props, initialRawOffset: 980 })

    expect(result.current.rawOffset.get()).toBe(1020)
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it("does not replay the live zoom when its settlement returns through props", async () => {
    const { result, rerender } = await renderHook(useOwnedCalendarZoom, {
      initialProps: props,
    })
    await act(async () => result.current.requestZoom("in"))
    const offset = result.current.rawOffset.get()
    scrollTo.mockClear()

    await rerender({
      ...props,
      initialPixelsPerHour: 70,
      initialRawOffset: offset,
    })

    expect(result.current.pixelsPerHour.get()).toBe(70)
    expect(result.current.rawOffset.get()).toBe(offset)
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it("preserves automatic current-time positioning when unchanged settled props return", async () => {
    const initialProps = { ...props, initialRawOffset: 0 }
    const { result, rerender } = await renderHook(useOwnedCalendarZoom, {
      initialProps,
    })
    await act(async () => result.current.invalidateForGeometry(1, 570, false))
    scrollTo.mockClear()

    await rerender({ ...initialProps })

    expect(result.current.rawOffset.get()).toBe(570)
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it("keeps initial offsets before viewport and automatic insets are measured", async () => {
    const { result } = await renderHook(useOwnedCalendarZoom, {
      initialProps: { ...props, initialRawOffset: -64 },
    })
    expect(scrollTo).toHaveBeenLastCalledWith({ y: -64, animated: false })
    expect(result.current.rawOffset.get()).toBe(-64)
  })

  it("bounds focus and restoration commands using live zoom and automatic insets", async () => {
    const { result } = await renderHook(useOwnedCalendarZoom, {
      initialProps: props,
    })
    await act(async () =>
      result.current.onScroll({
        nativeEvent: {
          contentOffset: { x: 0, y: 300 },
          layoutMeasurement: { width: 320, height: 500 },
          contentInset: { top: 44, bottom: 80 },
        },
      } as never),
    )
    for (const [scale, requested, expected] of [
      [60, 1343, 1020],
      [80, 1823, 1500],
      [40, 900, 540],
      [40, -999, -44],
      [40, -20, -20],
      [40, Number.NaN, -44],
    ]) {
      await act(async () => {
        result.current.pixelsPerHour.set(scale!)
        result.current.scrollToOffset(requested!)
      })
      expect(scrollTo).toHaveBeenLastCalledWith({
        y: expected,
        animated: false,
      })
      expect(result.current.rawOffset.get()).toBe(expected)
    }
  })

  it("cancels to a bounded baseline even when pinch starts during native overscroll", async () => {
    const { result } = await renderHook(useOwnedCalendarZoom, {
      initialProps: props,
    })
    await act(async () =>
      result.current.onScroll({
        nativeEvent: {
          contentOffset: { x: 0, y: 1100 },
          layoutMeasurement: { width: 320, height: 500 },
          contentInset: { top: 44, bottom: 80 },
        },
      } as never),
    )
    const { handlers } = result.current.pinchGesture
    await act(async () => {
      handlers.onStart?.(pinchEvent())
      handlers.onUpdate?.(pinchEvent(1.5))
      handlers.onFinalize?.(pinchEvent(1.5), false)
    })
    expect(result.current.pixelsPerHour.get()).toBe(60)
    expect(result.current.rawOffset.get()).toBe(1020)
    expect(props.onZoomSettled).not.toHaveBeenCalled()
  })

  it("applies an external zoom preference", async () => {
    const { result, rerender } = await renderHook(useOwnedCalendarZoom, {
      initialProps: props,
    })

    await rerender({ ...props, initialPixelsPerHour: 90 })

    expect(result.current.pixelsPerHour.get()).toBe(90)
  })
})
