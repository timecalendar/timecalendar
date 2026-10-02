import { act, renderHook } from "@testing-library/react-native"
import { AccessibilityInfo, type EmitterSubscription } from "react-native"

import { useReducedMotion } from "./use-reduced-motion"

describe("useReducedMotion", () => {
  it.each([false, true])(
    "resolves the initial %s preference",
    async (enabled) => {
      jest
        .mocked(AccessibilityInfo.isReduceMotionEnabled)
        .mockResolvedValueOnce(enabled)

      const { result } = await renderHook(useReducedMotion)
      expect(result.current).toBe(enabled)
    },
  )

  it("tracks preference changes and removes its one listener", async () => {
    let changeListener: ((enabled: boolean) => void) | undefined
    const remove = jest.fn()
    jest
      .mocked(AccessibilityInfo.addEventListener)
      .mockImplementationOnce((_event, listener) => {
        changeListener = listener as unknown as (enabled: boolean) => void
        return { remove } as unknown as EmitterSubscription
      })

    const { result, unmount } = await renderHook(useReducedMotion)
    expect(result.current).toBe(false)

    await act(async () => changeListener?.(true))
    expect(result.current).toBe(true)

    await unmount()
    expect(remove).toHaveBeenCalledTimes(1)
  })

  it("ignores a late initial read after cleanup", async () => {
    let resolveInitial: ((enabled: boolean) => void) | undefined
    const initialRead = new Promise<boolean>((resolve) => {
      resolveInitial = resolve
    })
    const remove = jest.fn()
    jest
      .mocked(AccessibilityInfo.isReduceMotionEnabled)
      .mockReturnValueOnce(initialRead)
    jest
      .mocked(AccessibilityInfo.addEventListener)
      .mockReturnValueOnce({ remove } as unknown as EmitterSubscription)

    const { result, unmount } = await renderHook(useReducedMotion)
    expect(result.current).toBeNull()
    await unmount()

    await act(async () => {
      resolveInitial?.(true)
      await initialRead
    })

    expect(result.current).toBeNull()
    expect(remove).toHaveBeenCalledTimes(1)
  })
})
