import { act, renderHook } from "@testing-library/react-native"
import { AppState, type AppStateStatus } from "react-native"

import { useCalendarClock } from "./clock"
import { dayKey } from "./day-key"

let mockFocusCallback: (() => void | (() => void)) | undefined
let mockFocusCleanup: (() => void) | undefined

jest.mock("expo-router", () => {
  const React = jest.requireActual<typeof import("react")>("react")
  return {
    useFocusEffect(callback: () => void | (() => void)) {
      React.useEffect(() => {
        mockFocusCallback = callback
        mockFocusCleanup = callback() || undefined
        return () => {
          mockFocusCleanup?.()
          mockFocusCleanup = undefined
        }
      }, [callback])
    },
  }
})

describe("useCalendarClock", () => {
  let appStateListener: ((state: AppStateStatus) => void) | undefined
  let removeListener: jest.Mock
  let timerSpy: jest.SpyInstance

  const calendarTimerDelays = () =>
    timerSpy.mock.calls
      .map(([, delay]) => delay)
      .filter((delay) => typeof delay === "number" && delay >= 50_000)

  beforeEach(() => {
    jest.useFakeTimers()
    timerSpy = jest.spyOn(global, "setTimeout")
    jest.setSystemTime(new Date("2026-06-15T08:34:10.000Z"))
    mockFocusCallback = undefined
    mockFocusCleanup = undefined
    AppState.currentState = "active"
    removeListener = jest.fn()
    appStateListener = undefined
    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_type, listener) => {
        appStateListener = listener
        return { remove: removeListener }
      })
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it("ticks once just after the next wall-clock minute and never sub-minute", async () => {
    const now = jest.fn(() => new Date(Date.now()))
    const view = await renderHook(() => useCalendarClock({ now }))

    expect(view.result.current).toEqual(new Date("2026-06-15T08:34:10.000Z"))
    expect(now).toHaveBeenCalledTimes(2)
    expect(calendarTimerDelays()).toEqual([50_050])

    await act(async () => jest.advanceTimersByTime(50_049))
    expect(now).toHaveBeenCalledTimes(2)
    expect(view.result.current).toEqual(new Date("2026-06-15T08:34:10.000Z"))

    await act(async () => jest.advanceTimersByTime(1))
    expect(now).toHaveBeenCalledTimes(3)
    expect(view.result.current).toEqual(new Date("2026-06-15T08:35:00.050Z"))
    expect(calendarTimerDelays()).toEqual([50_050, 60_000])

    await act(async () => jest.advanceTimersByTime(59_999))
    expect(now).toHaveBeenCalledTimes(3)
    await act(async () => jest.advanceTimersByTime(1))
    expect(now).toHaveBeenCalledTimes(4)
  })

  it("rolls the display-zone day at midnight from the same minute tick", async () => {
    jest.setSystemTime(new Date("2026-06-15T23:59:59.900Z"))
    const view = await renderHook(() => useCalendarClock())
    expect(dayKey(view.result.current, "UTC")).toBe("2026-06-15")

    await act(async () => jest.advanceTimersByTime(150))
    expect(dayKey(view.result.current, "UTC")).toBe("2026-06-16")
  })

  it("clears work in background and refreshes immediately on foreground", async () => {
    const now = jest.fn(() => new Date(Date.now()))
    const view = await renderHook(() => useCalendarClock({ now }))
    expect(calendarTimerDelays()).toEqual([50_050])

    await act(async () => appStateListener?.("background"))
    await act(async () => jest.advanceTimersByTime(120_000))
    expect(now).toHaveBeenCalledTimes(2)
    jest.setSystemTime(new Date("2026-06-15T09:10:00.000Z"))

    await act(async () => appStateListener?.("active"))
    expect(view.result.current).toEqual(new Date("2026-06-15T09:10:00.000Z"))
    const callsAfterFirstForeground = now.mock.calls.length

    await act(async () => appStateListener?.("active"))
    expect(now).toHaveBeenCalledTimes(callsAfterFirstForeground + 1)
    await act(async () => jest.advanceTimersByTime(60_050))
    expect(now).toHaveBeenCalledTimes(callsAfterFirstForeground + 2)
  })

  it("clears on blur, refreshes on refocus, and clears on unmount", async () => {
    const now = jest.fn(() => new Date(Date.now()))
    const view = await renderHook(() => useCalendarClock({ now }))
    expect(calendarTimerDelays()).toEqual([50_050])

    await act(async () => {
      mockFocusCleanup?.()
      mockFocusCleanup = undefined
    })
    expect(removeListener).toHaveBeenCalledTimes(1)
    const callsAfterBlur = now.mock.calls.length
    await act(async () => jest.advanceTimersByTime(120_000))
    expect(now).toHaveBeenCalledTimes(callsAfterBlur)

    jest.setSystemTime(new Date("2026-06-15T10:20:00.000Z"))
    await act(async () => {
      mockFocusCleanup = mockFocusCallback?.() || undefined
    })
    expect(view.result.current).toEqual(new Date("2026-06-15T10:20:00.000Z"))
    expect(calendarTimerDelays().at(-1)).toBe(60_050)

    await act(async () => view.unmount())
    expect(removeListener).toHaveBeenCalledTimes(2)
    const callsAfterUnmount = now.mock.calls.length
    await act(async () => jest.advanceTimersByTime(120_000))
    expect(now).toHaveBeenCalledTimes(callsAfterUnmount)
  })

  it("does not arm while initially backgrounded", async () => {
    AppState.currentState = "inactive"
    const now = jest.fn(() => new Date("2026-06-15T11:00:00.000Z"))
    await renderHook(() => useCalendarClock({ now }))

    expect(now).toHaveBeenCalledTimes(1)
    expect(calendarTimerDelays()).toEqual([])
  })
})
