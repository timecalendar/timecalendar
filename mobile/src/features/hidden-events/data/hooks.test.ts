import { act, renderHook } from "@testing-library/react-native"

import { recordError } from "@/firebase"
import { remove } from "@/storage"

import { useHiddenEvents, useHideActions } from "./hooks"
import { hideByName, hideByUid, unhideName, unhideUid } from "./store"
import { HIDDEN_EVENTS_KEYS } from "./types"

// useHiddenEvents reads through the REAL @/storage seam (the in-memory MMKV mock),
// so the reactive read reflects a prior write. useHideActions wraps the store
// mutators with the observability + failure-state handling (D5): the store is
// mocked here (so a throwing write is controllable — Babel ESM bindings aren't
// spyOn-replaceable) to prove a thrown write records through @/firebase and flips
// the accessible failure flag.

jest.mock("@/firebase", () => ({ recordError: jest.fn() }))
jest.mock("./store", () => ({
  hideByUid: jest.fn(),
  hideByName: jest.fn(),
  unhideUid: jest.fn(),
  unhideName: jest.fn(),
}))

const mockRecordError = recordError as jest.Mock
const mockHideByUid = hideByUid as jest.Mock
const mockHideByName = hideByName as jest.Mock
const mockUnhideUid = unhideUid as jest.Mock
const mockUnhideName = unhideName as jest.Mock

beforeEach(() => {
  // mockReset (not clear) so a throwing implementation set in one case does not
  // leak into the next — the store mutators reset to plain no-op jest.fn()s.
  mockHideByUid.mockReset()
  mockHideByName.mockReset()
  mockUnhideUid.mockReset()
  mockUnhideName.mockReset()
  mockRecordError.mockReset()
})

describe("useHiddenEvents", () => {
  // useHiddenEvents reads @/storage directly, NOT ./store — unaffected by the
  // ./store mock above. Drive it through the real seam.
  it("reflects a prior hide reactively", async () => {
    const actualStore = jest.requireActual<typeof import("./store")>("./store")
    remove(HIDDEN_EVENTS_KEYS.set)
    actualStore.hideByUid("uid-1")
    const { result } = await renderHook(() => useHiddenEvents())
    expect(result.current.uidHiddenEvents).toContain("uid-1")
  })
})

describe("useHideActions", () => {
  it("drives the store mutators", async () => {
    const { result } = await renderHook(() => useHideActions())
    await act(async () => result.current.hideByUid("uid-1"))
    await act(async () => result.current.hideByName("Algorithms"))
    await act(async () => result.current.unhideUid("uid-1"))
    await act(async () => result.current.unhideName("Algorithms"))

    expect(mockHideByUid).toHaveBeenCalledWith("uid-1")
    expect(mockHideByName).toHaveBeenCalledWith("Algorithms")
    expect(mockUnhideUid).toHaveBeenCalledWith("uid-1")
    expect(mockUnhideName).toHaveBeenCalledWith("Algorithms")
    expect(result.current.failed).toBe(false)
    expect(mockRecordError).not.toHaveBeenCalled()
  })

  it("records a write failure and flips the failure flag", async () => {
    mockHideByUid.mockImplementation(() => {
      throw new Error("KV write failed")
    })

    const { result } = await renderHook(() => useHideActions())
    await act(async () => result.current.hideByUid("uid-1"))

    expect(mockRecordError).toHaveBeenCalledWith(
      expect.any(Error),
      "hidden-events/hideByUid",
    )
    expect(result.current.failed).toBe(true)
  })

  it("wraps a non-Error throw before recording it", async () => {
    mockHideByName.mockImplementation(() => {
      throw "string failure"
    })

    const { result } = await renderHook(() => useHideActions())
    await act(async () => result.current.hideByName("Algorithms"))

    expect(mockRecordError).toHaveBeenCalledWith(
      expect.any(Error),
      "hidden-events/hideByName",
    )
    expect(result.current.failed).toBe(true)
  })

  it("clears the failure flag on a subsequent successful write", async () => {
    mockHideByUid.mockImplementationOnce(() => {
      throw new Error("KV write failed")
    })

    const { result } = await renderHook(() => useHideActions())
    await act(async () => result.current.hideByUid("uid-1"))
    expect(result.current.failed).toBe(true)

    await act(async () => result.current.hideByUid("uid-2"))
    expect(result.current.failed).toBe(false)
  })
})
