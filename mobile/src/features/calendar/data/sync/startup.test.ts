// useStartupSync is the once-effect that fires the fire-and-forget startup sync.
// It is tested in isolation by mocking the sibling useSyncCalendars hook with a
// controllable sync spy — deterministic, no QueryClient / mutator chain (that
// chain is proven by sync.test.tsx). Proves: the effect calls sync() once on
// mount, and a re-render does not re-fire it (the ref guard).
import { renderHook } from "@testing-library/react-native"

import { useStartupSync } from "./startup"
import { useSyncCalendars } from "./sync"

jest.mock("./sync", () => ({ useSyncCalendars: jest.fn() }))

const mockUseSyncCalendars = useSyncCalendars as jest.Mock
const mockSync = jest.fn().mockResolvedValue(undefined)

beforeEach(() => {
  mockSync.mockClear()
  mockUseSyncCalendars.mockReturnValue({
    sync: mockSync,
    isSyncing: false,
    isError: false,
    reset: jest.fn(),
  })
})

describe("useStartupSync", () => {
  it("fires the sync exactly once on mount", async () => {
    await renderHook(() => useStartupSync())
    expect(mockSync).toHaveBeenCalledTimes(1)
  })

  it("does not re-fire even when the sync identity changes (the ref guard holds)", async () => {
    const { rerender } = await renderHook(() => useStartupSync())
    expect(mockSync).toHaveBeenCalledTimes(1)

    // A fresh `sync` identity makes the effect re-run; the ref guard's early
    // return prevents a second fire (the React strict-mode double-invoke case).
    const secondSync = jest.fn().mockResolvedValue(undefined)
    mockUseSyncCalendars.mockReturnValue({
      sync: secondSync,
      isSyncing: false,
      isError: false,
      reset: jest.fn(),
    })
    rerender({})
    expect(mockSync).toHaveBeenCalledTimes(1)
    expect(secondSync).not.toHaveBeenCalled()
  })
})
