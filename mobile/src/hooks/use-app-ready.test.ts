import { act, renderHook } from "@testing-library/react-native"

import {
  commitLaunch,
  getLaunchState,
  resetLaunchStateForTests,
} from "@/features/startup"

import { useAppReady } from "./use-app-ready"

describe("useAppReady", () => {
  beforeEach(resetLaunchStateForTests)

  it("becomes ready only after the winning route is committed", async () => {
    const { result } = await renderHook(() => useAppReady())
    expect(result.current).toBe(false)
    await act(async () => commitLaunch("/calendar"))
    expect(result.current).toBe(true)
  })

  it("fails closed via the watchdog instead of exposing tabs", async () => {
    jest.useFakeTimers()
    try {
      const { result } = await renderHook(() => useAppReady())
      await act(async () => jest.advanceTimersByTime(59_999))
      expect(result.current).toBe(false)
      expect(getLaunchState()).toMatchObject({ kind: "resolving" })

      await act(async () => jest.advanceTimersByTime(1))
      expect(result.current).toBe(true)
      expect(getLaunchState()).toMatchObject({ kind: "failure" })
    } finally {
      jest.useRealTimers()
    }
  })
})
