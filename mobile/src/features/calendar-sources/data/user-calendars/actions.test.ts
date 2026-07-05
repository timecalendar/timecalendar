import { act, renderHook } from "@testing-library/react-native"

import { recordUnknownError } from "@/firebase"

import { useUserCalendarActions } from "./actions"
import { remove, setVisible } from "./repository"

// useUserCalendarActions wraps the async repository writes with the shared write
// controller (D5): the repository is mocked (so a rejecting write is
// controllable) to prove a rejected write records through @/firebase under
// "user-calendars/<action>" and flips the accessible failure flag, mirroring the
// hidden-events actions test posture.

jest.mock("@/firebase", () => ({ recordUnknownError: jest.fn() }))
jest.mock("./repository", () => ({
  setVisible: jest.fn(),
  remove: jest.fn(),
}))

const mockRecordUnknownError = recordUnknownError as jest.Mock
const mockSetVisible = setVisible as jest.Mock
const mockRemove = remove as jest.Mock

beforeEach(() => {
  mockSetVisible.mockReset().mockResolvedValue(undefined)
  mockRemove.mockReset().mockResolvedValue(undefined)
  mockRecordUnknownError.mockReset()
})

describe("useUserCalendarActions", () => {
  it("drives the repository mutators and resolves true on success", async () => {
    const { result } = await renderHook(() => useUserCalendarActions())
    let visibleOk: boolean | undefined
    let removeOk: boolean | undefined
    await act(async () => {
      visibleOk = await result.current.setVisible("cal-1", false)
    })
    await act(async () => {
      removeOk = await result.current.remove("cal-1")
    })

    expect(mockSetVisible).toHaveBeenCalledWith("cal-1", false)
    expect(mockRemove).toHaveBeenCalledWith("cal-1")
    expect(visibleOk).toBe(true)
    expect(removeOk).toBe(true)
    expect(result.current.failed).toBe(false)
    expect(mockRecordUnknownError).not.toHaveBeenCalled()
  })

  it("records a setVisible failure, resolves false, and flips the failure flag", async () => {
    mockSetVisible.mockRejectedValueOnce(new Error("db write failed"))

    const { result } = await renderHook(() => useUserCalendarActions())
    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.setVisible("cal-1", true)
    })

    expect(ok).toBe(false)
    expect(mockRecordUnknownError).toHaveBeenCalledWith(
      expect.any(Error),
      "user-calendars/setVisible",
    )
    expect(result.current.failed).toBe(true)
  })

  it("records a remove failure under its tag, resolves false, and flips the flag", async () => {
    mockRemove.mockRejectedValueOnce(new Error("db delete failed"))

    const { result } = await renderHook(() => useUserCalendarActions())
    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.remove("cal-1")
    })

    expect(ok).toBe(false)
    expect(mockRecordUnknownError).toHaveBeenCalledWith(
      expect.any(Error),
      "user-calendars/remove",
    )
    expect(result.current.failed).toBe(true)
  })

  it("clears the failure flag on a subsequent successful write", async () => {
    mockRemove.mockRejectedValueOnce(new Error("db delete failed"))

    const { result } = await renderHook(() => useUserCalendarActions())
    await act(async () => {
      await result.current.remove("cal-1")
    })
    expect(result.current.failed).toBe(true)

    await act(async () => {
      await result.current.remove("cal-2")
    })
    expect(result.current.failed).toBe(false)
  })
})
