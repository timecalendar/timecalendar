import { act, renderHook } from "@testing-library/react-native"

import { useAppReady } from "./use-app-ready"

it("hands off the splash when root prerequisites have completed", async () => {
  const { result } = await renderHook(() => useAppReady())
  expect(result.current).toBe(true)
})

it("never lets elapsed time bypass pending storage readiness", async () => {
  jest.useFakeTimers()
  const { result, rerender } = await renderHook<boolean, { ready: boolean }>(
    ({ ready }) => useAppReady(() => ready),
    { initialProps: { ready: false } },
  )
  await act(async () => {
    jest.advanceTimersByTime(60_000)
  })
  expect(result.current).toBe(false)
  await rerender({ ready: true })
  expect(result.current).toBe(true)
  jest.useRealTimers()
})
