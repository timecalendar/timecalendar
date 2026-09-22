import { act, renderHook, waitFor } from "@testing-library/react-native"
import { AccessibilityInfo } from "react-native"

import { useCalendarIncreasedContrast } from "./use-increased-contrast"

describe("useCalendarIncreasedContrast", () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("maps Android initial state and live updates with cleanup", async () => {
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
    const view = await renderHook(() => useCalendarIncreasedContrast("android"))
    await waitFor(() => expect(view.result.current).toBe(true))
    expect(view.result.current).toBe(true)
    await act(() => listener?.(false))
    expect(view.result.current).toBe(false)
    await view.unmount()
    expect(remove).toHaveBeenCalledTimes(1)
  })

  it("falls back to false on unsupported platforms", async () => {
    const read = jest.spyOn(AccessibilityInfo, "isHighTextContrastEnabled")
    read.mockClear()
    const { result } = await renderHook(() =>
      useCalendarIncreasedContrast("ios"),
    )
    expect(result.current).toBe(false)
    expect(read).not.toHaveBeenCalled()
  })
})
