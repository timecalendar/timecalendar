import { act, renderHook } from "@testing-library/react-native"
import { AccessibilityInfo, Platform } from "react-native"

import { useCalendarIncreasedContrast } from "./use-increased-contrast"

describe("useCalendarIncreasedContrast", () => {
  const originalPlatform = Platform.OS

  afterEach(() => {
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      value: originalPlatform,
    })
    jest.restoreAllMocks()
  })

  it("maps Android initial state and live updates with cleanup", async () => {
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      value: "android",
    })
    jest
      .spyOn(AccessibilityInfo, "isHighTextContrastEnabled")
      .mockResolvedValue(true)
    let listener: ((enabled: boolean) => void) | undefined
    const remove = jest.fn()
    jest.spyOn(AccessibilityInfo, "addEventListener").mockImplementation(((
      _event: string,
      callback: (enabled: boolean) => void,
    ) => {
      listener = callback
      return { remove }
    }) as typeof AccessibilityInfo.addEventListener)
    const view = renderHook(() => useCalendarIncreasedContrast())
    await act(async () => {})
    expect(view.result.current).toBe(true)
    act(() => listener?.(false))
    expect(view.result.current).toBe(false)
    view.unmount()
    expect(remove).toHaveBeenCalledTimes(1)
  })

  it("falls back to false on unsupported platforms", () => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "ios" })
    const read = jest.spyOn(AccessibilityInfo, "isHighTextContrastEnabled")
    const { result } = renderHook(() => useCalendarIncreasedContrast())
    expect(result.current).toBe(false)
    expect(read).not.toHaveBeenCalled()
  })
})
