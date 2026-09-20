import { act, renderHook, waitFor } from "@testing-library/react-native"

import { useSyncCalendars } from "@/features/calendar/data"

import { useCalendarImportResult } from "./use-calendar-import-result"

jest.mock("@/features/calendar/data", () => ({ useSyncCalendars: jest.fn() }))

const mockUseSyncCalendars = useSyncCalendars as jest.Mock
const sync = jest.fn()

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseSyncCalendars.mockReturnValue({ sync })
})

describe("useCalendarImportResult", () => {
  it("requests one fresh pass on mount and accepts empty-event readiness", async () => {
    sync.mockResolvedValue({ status: "events-ready", metadata: "current" })
    mockUseSyncCalendars.mockImplementation(() => ({
      sync: (...args: Parameters<typeof sync>) => sync(...args),
    }))
    const { result, rerender } = await renderHook(() =>
      useCalendarImportResult(),
    )
    await act(async () => Promise.resolve())
    await rerender({})

    expect(sync).toHaveBeenCalledTimes(1)
    expect(sync).toHaveBeenCalledWith({ freshAfterCurrent: true })
    expect(result.current.phase).toBe("success")
  })

  it.each([
    { status: "no-calendars" },
    { status: "failed", reason: "remote-read" },
    { status: "failed", reason: "event-write" },
  ])("classifies $status as recoverable failure", async (outcome) => {
    sync.mockResolvedValue(outcome)
    const { result } = await renderHook(() => useCalendarImportResult())
    await act(async () => Promise.resolve())
    expect(result.current.phase).toBe("failed")
  })

  it("deduplicates retry while loading and allows a later retry", async () => {
    const mount = deferred<{
      status: "failed"
      reason: "remote-read"
    }>()
    const retry = deferred<{
      status: "events-ready"
      metadata: "stale"
    }>()
    sync.mockReturnValueOnce(mount.promise).mockReturnValueOnce(retry.promise)
    const { result } = await renderHook(() => useCalendarImportResult())

    await act(async () => {
      result.current.retry()
      result.current.retry()
      await Promise.resolve()
    })
    expect(sync).toHaveBeenCalledTimes(1)
    await act(async () => {
      mount.resolve({ status: "failed", reason: "remote-read" })
      await mount.promise
    })
    await waitFor(() => expect(result.current.phase).toBe("failed"))

    await act(async () => {
      result.current.retry()
      result.current.retry()
      await Promise.resolve()
    })
    expect(sync).toHaveBeenCalledTimes(2)
    await act(async () => {
      retry.resolve({ status: "events-ready", metadata: "stale" })
      await retry.promise
    })
    await waitFor(() => expect(result.current.phase).toBe("success"))
  })

  it("ignores a late settlement after unmount", async () => {
    const pending = deferred<{
      status: "events-ready"
      metadata: "current"
    }>()
    sync.mockReturnValueOnce(pending.promise)
    const { unmount } = await renderHook(() => useCalendarImportResult())
    await unmount()
    await act(async () => {
      pending.resolve({ status: "events-ready", metadata: "current" })
      await pending.promise
    })
  })
})
