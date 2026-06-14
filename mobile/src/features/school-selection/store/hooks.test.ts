import { act, renderHook } from "@testing-library/react-native"

import { useSelectedSchool } from "./hooks"
import { clearSelection, selectGroup, selectSchool } from "./store"

// Renders the reactive selection hook over the real @/storage seam (MMKV
// in-memory mock): asserts it reflects the current selection and re-renders
// reactively when selectSchool/selectGroup write (mirrors the settings hooks
// test).

beforeEach(() => clearSelection())

describe("useSelectedSchool", () => {
  it("is undefined with no selection", async () => {
    const { result } = await renderHook(() => useSelectedSchool())
    expect(result.current).toBeUndefined()
  })

  it("reactively reflects a school + group selection", async () => {
    const { result } = await renderHook(() => useSelectedSchool())

    await act(async () => selectSchool("univeiffel"))
    expect(result.current).toEqual({ schoolId: "univeiffel", groupValues: [] })

    await act(async () => selectGroup(["l1"]))
    expect(result.current).toEqual({
      schoolId: "univeiffel",
      groupValues: ["l1"],
    })
  })
})
