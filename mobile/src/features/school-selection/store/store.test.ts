import { setString } from "@/storage"

import {
  clearSelection,
  getSelection,
  isOnboardingComplete,
  selectGroup,
  selectSchool,
} from "./store"
import { parseGroupValues, SELECTION_KEYS } from "./types"

// Round-trips the selection through the real @/storage seam (the MMKV in-memory
// mock from setup-storage). Asserts totality (unset/corrupt → no selection), the
// derived onboarding-complete, and the JSON group encode/parse.

beforeEach(() => clearSelection())

describe("school selection store", () => {
  it("reads 'no selection' when unset", () => {
    expect(getSelection()).toBeUndefined()
    expect(isOnboardingComplete()).toBe(false)
  })

  it("round-trips a school + group selection", () => {
    selectSchool("univeiffel")
    selectGroup(["l1", "a"])

    expect(getSelection()).toEqual({
      schoolId: "univeiffel",
      groupValues: ["l1", "a"],
    })
    expect(isOnboardingComplete()).toBe(true)
  })

  it("selecting a school resets the prior group selection", () => {
    selectSchool("univeiffel")
    selectGroup(["l1"])
    selectSchool("mygamingacademia")

    expect(getSelection()).toEqual({
      schoolId: "mygamingacademia",
      groupValues: [],
    })
  })

  it("a school with no group is still a (complete) selection", () => {
    selectSchool("univeiffel")
    expect(getSelection()).toEqual({ schoolId: "univeiffel", groupValues: [] })
    expect(isOnboardingComplete()).toBe(true)
  })

  it("reads 'no selection' for an empty stored schoolId", () => {
    setString(SELECTION_KEYS.schoolId, "")
    expect(getSelection()).toBeUndefined()
  })

  it("tolerates a corrupt group value (total read → [])", () => {
    selectSchool("univeiffel")
    setString(SELECTION_KEYS.groupValues, "{not json")
    expect(getSelection()?.groupValues).toEqual([])
  })

  it("clears the selection", () => {
    selectSchool("univeiffel")
    selectGroup(["l1"])
    clearSelection()
    expect(getSelection()).toBeUndefined()
  })
})

describe("parseGroupValues", () => {
  it("is total on unset / non-array / non-string members", () => {
    expect(parseGroupValues(undefined)).toEqual([])
    expect(parseGroupValues("not json")).toEqual([])
    expect(parseGroupValues("42")).toEqual([])
    expect(parseGroupValues("[1, 2]")).toEqual([])
    expect(parseGroupValues('["a", "b"]')).toEqual(["a", "b"])
  })
})
