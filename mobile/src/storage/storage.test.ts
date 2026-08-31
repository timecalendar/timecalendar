// Round-trips each typed helper through MMKV v4's built-in Jest auto-mock (an
// in-memory instance — no hand-written mock), proving the @/storage seam's API
// works end to end. Mirrors the i18n/a11y/firebase CI proof tests.
import { act, renderHook } from "@testing-library/react-native"

import {
  clearBackendBoundStorage,
  clearBackendResetJournal,
  getBoolean,
  getNumber,
  getString,
  has,
  isStringArray,
  mmkvQueryStorage,
  parseJsonArray,
  readBackendResetJournal,
  remove,
  setBoolean,
  setNumber,
  setString,
  STORAGE_KEY_CLASSIFICATION,
  STORAGE_KEYS,
  useParsedStoredString,
  writeBackendResetJournal,
} from "./index"

describe("storage seam", () => {
  it("round-trips a string", () => {
    setString("user.name", "Marc")
    expect(getString("user.name")).toBe("Marc")
  })

  it("round-trips a boolean", () => {
    setBoolean("flag.enabled", true)
    expect(getBoolean("flag.enabled")).toBe(true)
  })

  it("round-trips a number", () => {
    setNumber("user.age", 21)
    expect(getNumber("user.age")).toBe(21)
  })

  it("reports existence and removes a key", () => {
    expect(has("ephemeral")).toBe(false)
    setString("ephemeral", "x")
    expect(has("ephemeral")).toBe(true)
    remove("ephemeral")
    expect(has("ephemeral")).toBe(false)
  })

  describe("isStringArray", () => {
    it("is true for an array of strings (incl. empty)", () => {
      expect(isStringArray([])).toBe(true)
      expect(isStringArray(["a", "b"])).toBe(true)
    })

    it("is false for a non-array or a mixed/non-string array", () => {
      expect(isStringArray("a")).toBe(false)
      expect(isStringArray(["a", 1])).toBe(false)
      expect(isStringArray([null])).toBe(false)
      expect(isStringArray(null)).toBe(false)
    })
  })

  describe("parseJsonArray (total)", () => {
    it("undefined → []", () => {
      expect(parseJsonArray(undefined)).toEqual([])
    })

    it("non-JSON → [] (never throws)", () => {
      expect(parseJsonArray("{not json")).toEqual([])
    })

    it("valid JSON that is not an array → []", () => {
      expect(parseJsonArray('{"a":1}')).toEqual([])
      expect(parseJsonArray("null")).toEqual([])
    })

    it("guard-fail → []", () => {
      expect(parseJsonArray('["a",1]', isStringArray)).toEqual([])
    })

    it("guarded happy path returns the array", () => {
      expect(parseJsonArray('["a","b"]', isStringArray)).toEqual(["a", "b"])
    })

    it("guardless happy path casts without per-element validation", () => {
      // The decodeJsonArray behavior: any array passes through, cast to T[].
      expect(parseJsonArray<number>("[1,2,3]")).toEqual([1, 2, 3])
      expect(parseJsonArray('[1,"a",true]')).toEqual([1, "a", true])
    })
  })

  describe("useParsedStoredString (reactive parsed read)", () => {
    it("applies the parser to the reactive raw read and re-decodes on change", async () => {
      const parse = (raw: string | undefined): string[] =>
        parseJsonArray(raw, isStringArray)
      remove("parsed.key")
      const { result } = await renderHook(() =>
        useParsedStoredString("parsed.key", parse),
      )
      // Unset → parser's empty default.
      expect(result.current).toEqual([])
      await act(async () => setString("parsed.key", '["x","y"]'))
      expect(result.current).toEqual(["x", "y"])
    })
  })

  describe("mmkvQueryStorage (the sync persister adapter)", () => {
    it("round-trips a value through the seam", () => {
      mmkvQueryStorage.setItem("rq.cache", "{}")
      expect(mmkvQueryStorage.getItem("rq.cache")).toBe("{}")
    })

    it("returns null (not undefined) for an unset key", () => {
      expect(mmkvQueryStorage.getItem("rq.missing")).toBeNull()
    })

    it("removes a value", () => {
      mmkvQueryStorage.setItem("rq.gone", "{}")
      mmkvQueryStorage.removeItem("rq.gone")
      expect(mmkvQueryStorage.getItem("rq.gone")).toBeNull()
    })
  })

  describe("backend reset ownership", () => {
    it("classifies every known key", () => {
      expect(Object.keys(STORAGE_KEY_CLASSIFICATION).sort()).toEqual(
        Object.values(STORAGE_KEYS).sort(),
      )
    })

    it("preserves only global and reset-control values", () => {
      setString(STORAGE_KEYS.theme, "dark")
      setString(STORAGE_KEYS.startupTab, "calendar")
      setString(STORAGE_KEYS.selectedBackendEnvironment, "preprod")
      setString(STORAGE_KEYS.backendResetJournal, "journal")
      setString(STORAGE_KEYS.schoolId, "school-1")
      setString("future.unclassified", "must be removed")

      clearBackendBoundStorage()

      expect(getString(STORAGE_KEYS.theme)).toBe("dark")
      expect(getString(STORAGE_KEYS.startupTab)).toBe("calendar")
      expect(getString(STORAGE_KEYS.selectedBackendEnvironment)).toBe("preprod")
      expect(getString(STORAGE_KEYS.backendResetJournal)).toBe("journal")
      expect(getString(STORAGE_KEYS.schoolId)).toBeUndefined()
      expect(getString("future.unclassified")).toBeUndefined()
    })

    it("round-trips a versioned journal and total-parses invalid input", () => {
      clearBackendResetJournal()
      expect(readBackendResetJournal()).toEqual({ state: "absent" })

      const journal = {
        version: 1,
        current: "production",
        target: "preprod",
      } as const
      writeBackendResetJournal(journal)
      expect(readBackendResetJournal()).toEqual({ state: "valid", journal })

      setString(STORAGE_KEYS.backendResetJournal, "not json")
      expect(readBackendResetJournal()).toEqual({ state: "malformed" })
      setString(
        STORAGE_KEYS.backendResetJournal,
        JSON.stringify({ version: 2, current: "production", target: "evil" }),
      )
      expect(readBackendResetJournal()).toEqual({ state: "malformed" })
    })
  })
})
