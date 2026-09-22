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

  it("falls back to false when the supported platform read rejects", async () => {
    const read = jest
      .spyOn(AccessibilityInfo, "isHighTextContrastEnabled")
      .mockRejectedValue(new Error("unavailable"))
    jest.spyOn(AccessibilityInfo, "addEventListener").mockReturnValue({
      remove: jest.fn(),
    })
    const { result } = await renderHook(() =>
      useCalendarIncreasedContrast("android"),
    )
    await waitFor(() => expect(read).toHaveBeenCalledTimes(1))
    expect(result.current).toBe(false)
  })

  it("ignores a supported-platform read that settles after cleanup", async () => {
    let resolveRead: ((value: boolean) => void) | undefined
    jest.spyOn(AccessibilityInfo, "isHighTextContrastEnabled").mockReturnValue(
      new Promise<boolean>((resolve) => {
        resolveRead = resolve
      }),
    )
    const remove = jest.fn()
    jest
      .spyOn(AccessibilityInfo, "addEventListener")
      .mockReturnValue({ remove })
    const view = await renderHook(() => useCalendarIncreasedContrast("android"))
    await view.unmount()
    await act(() => resolveRead?.(true))
    expect(remove).toHaveBeenCalledTimes(1)
  })

  it("ignores a supported-platform failure after cleanup", async () => {
    let rejectRead: ((reason: Error) => void) | undefined
    jest.spyOn(AccessibilityInfo, "isHighTextContrastEnabled").mockReturnValue(
      new Promise<boolean>((_resolve, reject) => {
        rejectRead = reject
      }),
    )
    jest.spyOn(AccessibilityInfo, "addEventListener").mockReturnValue({
      remove: jest.fn(),
    })
    const view = await renderHook(() => useCalendarIncreasedContrast("android"))
    await view.unmount()
    await act(() => rejectRead?.(new Error("late unavailable")))
  })

  it("uses the runtime platform by default", async () => {
    jest
      .spyOn(AccessibilityInfo, "isHighTextContrastEnabled")
      .mockResolvedValue(false)
    jest.spyOn(AccessibilityInfo, "addEventListener").mockReturnValue({
      remove: jest.fn(),
    })
    const { result } = await renderHook(() => useCalendarIncreasedContrast())
    expect(result.current).toBe(false)
  })
})
