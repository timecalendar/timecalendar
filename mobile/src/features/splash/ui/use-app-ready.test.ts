import { act, renderHook } from "@testing-library/react-native"

import { READY_WATCHDOG_MS, useAppReady } from "./use-app-ready"

// The readiness gate. Today every prerequisite resolves synchronously, so the
// gate is satisfied on mount (default initializer) — the common case.
//
// The watchdog branch (the gate held not-ready, then the timeout releases it)
// is the load-bearing safety net for a future stalled async prerequisite; it
// never arms today. The injectable `isReady` lets us start the gate not-ready —
// the shape a future async prerequisite would produce — to drive it.

describe("useAppReady", () => {
  afterEach(() => jest.useRealTimers())

  it("awaits migrations before the typed legacy-import prerequisite", async () => {
    const events: string[] = []
    let resolveMigrations: (() => void) | undefined
    const dependencies = {
      runMigrations: jest.fn(() => {
        events.push("migrations")
        return new Promise<void>((resolve) => {
          resolveMigrations = resolve
        })
      }),
      runLegacyImport: jest.fn(async () => {
        events.push("legacy-import")
      }),
    }
    const { result } = await renderHook(() => useAppReady(dependencies))

    expect(result.current.status).toBe("pending")
    expect(events).toEqual(["migrations"])
    await act(async () => resolveMigrations?.())

    expect(result.current.status).toBe("ready")
    expect(events).toEqual(["migrations", "legacy-import"])
  })

  it("keeps startup closed and offers recovery when a prerequisite rejects", async () => {
    const failure = new Error("migration failed")
    const dependencies = {
      runMigrations: jest.fn(async () => Promise.reject(failure)),
      runLegacyImport: jest.fn(async () => {}),
    }
    const { result } = await renderHook(() => useAppReady(dependencies))
    await act(async () => {})

    expect(result.current).toMatchObject({
      status: "failed",
      recoveryVisible: true,
    })
    expect(dependencies.runLegacyImport).not.toHaveBeenCalled()
  })

  it("retries the complete ordered sequence", async () => {
    const dependencies = {
      runMigrations: jest
        .fn<Promise<void>, []>()
        .mockRejectedValueOnce(new Error("first failure"))
        .mockResolvedValue(undefined),
      runLegacyImport: jest.fn(async () => {}),
    }
    const { result } = await renderHook(() => useAppReady(dependencies))
    await act(async () => {})
    expect(result.current.status).toBe("failed")

    await act(async () => result.current.retry())
    await act(async () => {})

    expect(result.current.status).toBe("ready")
    expect(dependencies.runMigrations).toHaveBeenCalledTimes(2)
    expect(dependencies.runLegacyImport).toHaveBeenCalledTimes(1)
  })

  it("turns a watchdog timeout into recovery, never readiness", async () => {
    jest.useFakeTimers()
    const dependencies = {
      runMigrations: jest.fn(() => new Promise<void>(() => {})),
      runLegacyImport: jest.fn(async () => {}),
    }

    const { result } = await renderHook(() => useAppReady(dependencies))
    expect(result.current).toMatchObject({
      status: "pending",
      recoveryVisible: false,
    })

    await act(async () => {
      jest.advanceTimersByTime(READY_WATCHDOG_MS)
    })
    expect(result.current).toMatchObject({
      status: "pending",
      recoveryVisible: true,
    })
    expect(dependencies.runLegacyImport).not.toHaveBeenCalled()
  })
})
