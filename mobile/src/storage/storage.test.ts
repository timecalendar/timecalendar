// Round-trips each typed helper through MMKV v4's built-in Jest auto-mock (an
// in-memory instance — no hand-written mock), proving the @/storage seam's API
// works end to end. Mirrors the i18n/a11y/firebase CI proof tests.
import {
  getBoolean,
  getNumber,
  getString,
  has,
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
})
