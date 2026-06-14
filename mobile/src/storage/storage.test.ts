// Round-trips each typed helper through MMKV v4's built-in Jest auto-mock (an
// in-memory instance — no hand-written mock), proving the @/storage seam's API
// works end to end. Mirrors the i18n/a11y/firebase CI proof tests.
import {
  getBoolean,
  getNumber,
  getString,
  has,
  mmkvQueryStorage,
  remove,
  setBoolean,
  setNumber,
  setString,
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
})
