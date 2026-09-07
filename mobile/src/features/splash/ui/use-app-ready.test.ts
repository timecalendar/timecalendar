import { act, renderHook } from "@testing-library/react-native"

import { useAppReady } from "./use-app-ready"

// The readiness gate. Today every prerequisite resolves synchronously, so the
// gate is satisfied on mount (default initializer) — the common case.
//
// The watchdog branch (the gate held not-ready, then the timeout releases it)
// is the load-bearing safety net for a future stalled async prerequisite; it
// never arms today. The injectable `isReady` lets us start the gate not-ready —
// the shape a future async prerequisite would produce — to drive it.

describe("useAppReady", () => {
  it("is ready on mount (prerequisites are synchronous)", async () => {
    const { result } = await renderHook(() => useAppReady())
    expect(result.current).toBe(true)
  })

  it("releases via the watchdog timeout if the gate starts not-ready", async () => {
    jest.useFakeTimers()

    const { result } = await renderHook(() => useAppReady(() => false))
    expect(result.current).toBe(false)

    await act(async () => {
      jest.runAllTimers()
    })
    expect(result.current).toBe(true)

    jest.useRealTimers()
  })
})
