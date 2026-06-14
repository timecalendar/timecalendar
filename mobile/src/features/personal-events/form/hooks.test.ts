import { recordError as crashlyticsRecordError } from "@react-native-firebase/crashlytics"
import { act, renderHook } from "@testing-library/react-native"

import {
  getById,
  remove as removeEvent,
  upsert,
} from "@/features/personal-events/data"

import { useDeleteEvent, useEventToEdit, useSaveEvent } from "./hooks"

// Mock B1's repository (the data barrel) so the hooks' wiring is asserted
// without a real DB (the B1 testing posture). @/firebase is real in the path —
// it delegates recordError to @react-native-firebase/crashlytics, mocked
// suite-wide by setup-firebase.ts — so asserting that mock proves the error
// reaches the observability seam.
jest.mock("@/features/personal-events/data", () => ({
  upsert: jest.fn(),
  remove: jest.fn(),
  getById: jest.fn(),
}))

const mockUpsert = upsert as jest.MockedFunction<typeof upsert>
const mockRemove = removeEvent as jest.MockedFunction<typeof removeEvent>
const mockGetById = getById as jest.MockedFunction<typeof getById>
const mockRecordError = crashlyticsRecordError as jest.Mock

const sampleEvent = {
  uid: "u1",
  title: "Lunch",
  color: "#E91E63",
  startsAt: new Date("2030-01-01T10:00:00.000Z"),
  endsAt: new Date("2030-01-01T11:00:00.000Z"),
  exportedAt: new Date("2030-01-01T09:00:00.000Z"),
  location: undefined,
  description: undefined,
}

beforeEach(() => {
  mockUpsert.mockReset().mockResolvedValue(undefined)
  mockRemove.mockReset().mockResolvedValue(undefined)
  mockGetById.mockReset().mockResolvedValue(undefined)
  mockRecordError.mockClear()
})

describe("useSaveEvent", () => {
  it("calls repository.upsert on success and reports no failure", async () => {
    const { result } = await renderHook(() => useSaveEvent())

    let ok = false
    await act(async () => {
      ok = await result.current.save(sampleEvent)
    })

    expect(ok).toBe(true)
    expect(mockUpsert).toHaveBeenCalledWith(sampleEvent)
    expect(result.current.failed).toBe(false)
    expect(mockRecordError).not.toHaveBeenCalled()
  })

  it("records a rejected upsert through @/firebase and sets the failure flag", async () => {
    const failure = new Error("write boom")
    mockUpsert.mockRejectedValueOnce(failure)
    const { result } = await renderHook(() => useSaveEvent())

    let ok = true
    await act(async () => {
      ok = await result.current.save(sampleEvent)
    })

    expect(ok).toBe(false)
    expect(mockRecordError).toHaveBeenCalledWith(expect.anything(), failure)
    expect(result.current.failed).toBe(true)
  })

  it("wraps a non-Error rejection before recording it", async () => {
    mockUpsert.mockRejectedValueOnce("string failure")
    const { result } = await renderHook(() => useSaveEvent())

    await act(async () => {
      await result.current.save(sampleEvent)
    })

    expect(mockRecordError).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ message: "string failure" }),
    )
  })
})

describe("useDeleteEvent", () => {
  it("calls repository.remove on success", async () => {
    const { result } = await renderHook(() => useDeleteEvent())

    let ok = false
    await act(async () => {
      ok = await result.current.remove("u1")
    })

    expect(ok).toBe(true)
    expect(mockRemove).toHaveBeenCalledWith("u1")
    expect(result.current.failed).toBe(false)
  })

  it("records a rejected remove through @/firebase and sets the failure flag", async () => {
    const failure = new Error("delete boom")
    mockRemove.mockRejectedValueOnce(failure)
    const { result } = await renderHook(() => useDeleteEvent())

    let ok = true
    await act(async () => {
      ok = await result.current.remove("u1")
    })

    expect(ok).toBe(false)
    expect(mockRecordError).toHaveBeenCalledWith(expect.anything(), failure)
    expect(result.current.failed).toBe(true)
  })

  it("wraps a non-Error remove rejection before recording it", async () => {
    mockRemove.mockRejectedValueOnce("delete string failure")
    const { result } = await renderHook(() => useDeleteEvent())

    await act(async () => {
      await result.current.remove("u1")
    })

    expect(mockRecordError).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ message: "delete string failure" }),
    )
  })
})

describe("useEventToEdit", () => {
  it("loads an existing event via getById for a uid", async () => {
    mockGetById.mockResolvedValueOnce(sampleEvent)
    const { result } = await renderHook(() => useEventToEdit("u1"))

    expect(mockGetById).toHaveBeenCalledWith("u1")
    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current).toEqual(sampleEvent)
  })

  it("returns undefined for create (no uid) and does not call getById", async () => {
    const { result } = await renderHook(() => useEventToEdit())
    expect(result.current).toBeUndefined()
    expect(mockGetById).not.toHaveBeenCalled()
  })

  it("drops a stale fetch when the uid changes mid-flight", async () => {
    // The first fetch (u1) stays pending; rerender to u2 (resolves immediately).
    // The effect cleanup for u1 flips its `active` to false, so when u1 finally
    // resolves its .then runs with `active === false` and does NOT setEvent —
    // the `if (active)` false branch (the stale-fetch guard).
    let resolveFirst: (value: typeof sampleEvent) => void = () => {}
    const second = { ...sampleEvent, uid: "u2", title: "Second" }
    mockGetById
      .mockReturnValueOnce(
        new Promise((r) => {
          resolveFirst = r
        }),
      )
      .mockResolvedValueOnce(second)

    const { result, rerender } = await renderHook(
      ({ uid }: { uid: string }) => useEventToEdit(uid),
      { initialProps: { uid: "u1" } },
    )

    await act(async () => {
      rerender({ uid: "u2" })
      await Promise.resolve()
    })
    // u2 resolved and is the current event.
    expect(result.current).toEqual(second)

    // Now resolve the stale u1 fetch: its guard drops it (no state change).
    await act(async () => {
      resolveFirst({ ...sampleEvent, title: "Stale" })
      await Promise.resolve()
    })
    expect(result.current).toEqual(second)
  })
})
