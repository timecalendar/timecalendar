import { act, renderHook } from "@testing-library/react-native"

import { READY_WATCHDOG_MS, useAppReady } from "./use-app-ready"

describe("useAppReady", () => {
  afterEach(() => {
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  it("uses the production prerequisites by default", async () => {
    const { result } = await renderHook(() => useAppReady())

    await act(async () => {})

    expect(result.current.status).toBe("ready")
  })

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

  it("ignores a failure from a superseded prerequisite sequence", async () => {
    let resolveMigrations: (() => void) | undefined
    let rejectLegacyImport: ((reason: Error) => void) | undefined
    let dependencies = {
      runMigrations: jest.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveMigrations = resolve
          }),
      ),
      runLegacyImport: jest.fn(
        () =>
          new Promise<void>((_resolve, reject) => {
            rejectLegacyImport = reject
          }),
      ),
    }
    const { rerender } = await renderHook(() => useAppReady(dependencies))
    expect(dependencies.runMigrations).toHaveBeenCalledTimes(1)
    await act(async () => {
      resolveMigrations?.()
      await Promise.resolve()
    })
    expect(dependencies.runLegacyImport).toHaveBeenCalledTimes(1)

    dependencies = {
      runMigrations: jest.fn(() => new Promise<void>(() => {})),
      runLegacyImport: jest.fn(async () => {}),
    }
    await act(async () => rerender(undefined))
    await act(async () => {
      rejectLegacyImport?.(new Error("late failure"))
      await new Promise<void>((resolve) => setImmediate(resolve))
    })

    expect(dependencies.runMigrations).toHaveBeenCalledTimes(1)
  })

  it("ignores success from a superseded prerequisite sequence", async () => {
    let resolveMigrations: (() => void) | undefined
    const originalDependencies = {
      runMigrations: jest.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveMigrations = resolve
          }),
      ),
      runLegacyImport: jest.fn(async () => {}),
    }
    let dependencies = originalDependencies
    const { rerender, result } = await renderHook(() =>
      useAppReady(dependencies),
    )

    dependencies = {
      runMigrations: jest.fn(() => new Promise<void>(() => {})),
      runLegacyImport: jest.fn(async () => {}),
    }
    await act(async () => rerender(undefined))
    await act(async () => resolveMigrations?.())

    expect(originalDependencies.runLegacyImport).toHaveBeenCalledTimes(1)
    expect(result.current.status).toBe("pending")
  })
})
