import { act, renderHook } from "@testing-library/react-native"

import { recordUnknownError } from "@/firebase"

import { useRecordedAction } from "./use-recorded-action"

// Proves the shared write controller (docs review R-1): a successful write clears
// `failed` and returns true; a throw records through the @/firebase seam under the
// scope/action tag, flips `failed`, and returns false. Both the sync path (a
// feature whose action interface stays synchronous, e.g. HideActions) and the
// async path (a Promise-returning write) are covered, plus the empty-scope form a
// site with a full literal context uses.

jest.mock("@/firebase", () => ({ recordUnknownError: jest.fn() }))

const mockRecordUnknownError = recordUnknownError as jest.Mock

beforeEach(() => {
  mockRecordUnknownError.mockReset()
})

describe("useRecordedAction — sync writes", () => {
  it("returns true and leaves failed false when the write succeeds", async () => {
    const { result } = await renderHook(() =>
      useRecordedAction("hidden-events"),
    )

    let ok = false
    await act(async () => {
      ok = result.current.run("hideByUid", () => {})
    })

    expect(ok).toBe(true)
    expect(result.current.failed).toBe(false)
    expect(mockRecordUnknownError).not.toHaveBeenCalled()
  })

  it("records under `${scope}/${action}`, flips failed, and returns false on throw", async () => {
    const { result } = await renderHook(() =>
      useRecordedAction("hidden-events"),
    )

    let ok = true
    await act(async () => {
      ok = result.current.run("hideByUid", (): void => {
        throw new Error("kv boom")
      })
    })

    expect(ok).toBe(false)
    expect(result.current.failed).toBe(true)
    expect(mockRecordUnknownError).toHaveBeenCalledWith(
      expect.any(Error),
      "hidden-events/hideByUid",
    )
  })

  it("clears failed on a subsequent successful write", async () => {
    const { result } = await renderHook(() =>
      useRecordedAction("hidden-events"),
    )

    await act(async () => {
      result.current.run("hideByUid", (): void => {
        throw new Error("kv boom")
      })
    })
    expect(result.current.failed).toBe(true)

    await act(async () => {
      result.current.run("hideByUid", () => {})
    })
    expect(result.current.failed).toBe(false)
  })
})

describe("useRecordedAction — async writes", () => {
  it("resolves true and leaves failed false when the write resolves", async () => {
    const { result } = await renderHook(() =>
      useRecordedAction("event-checklists"),
    )

    let ok = false
    await act(async () => {
      ok = await result.current.run("add", () => Promise.resolve())
    })

    expect(ok).toBe(true)
    expect(result.current.failed).toBe(false)
    expect(mockRecordUnknownError).not.toHaveBeenCalled()
  })

  it("records under the scoped tag, flips failed, and resolves false on rejection", async () => {
    const { result } = await renderHook(() =>
      useRecordedAction("event-checklists"),
    )

    let ok = true
    await act(async () => {
      ok = await result.current.run("add", () =>
        Promise.reject(new Error("db boom")),
      )
    })

    expect(ok).toBe(false)
    expect(result.current.failed).toBe(true)
    expect(mockRecordUnknownError).toHaveBeenCalledWith(
      expect.any(Error),
      "event-checklists/add",
    )
  })
})

describe("useRecordedAction — empty scope", () => {
  it("records under the bare action string (a full literal context)", async () => {
    const { result } = await renderHook(() => useRecordedAction())

    await act(async () => {
      await result.current.run("Failed to save personal event", () =>
        Promise.reject("plain boom"),
      )
    })

    // No `${scope}/` prefix — the action IS the whole context, and the raw
    // non-Error value is forwarded (the seam owns normalization).
    expect(mockRecordUnknownError).toHaveBeenCalledWith(
      "plain boom",
      "Failed to save personal event",
    )
  })
})
