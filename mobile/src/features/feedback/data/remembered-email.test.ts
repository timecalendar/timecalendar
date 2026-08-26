import { getString, remove, setString } from "@/storage"

import {
  getRememberedEmail,
  LAST_EMAIL_KEY,
  parseRememberedEmail,
  setRememberedEmail,
} from "./remembered-email"

afterEach(() => remove(LAST_EMAIL_KEY))

describe("remembered feedback e-mail", () => {
  it.each([
    [undefined, ""],
    [null, ""],
    [{ corrupt: true }, ""],
    [" ", ""],
    ["malformed", ""],
    [" student@example.fr ", "student@example.fr"],
  ])("parses %p safely", (raw, expected) => {
    expect(parseRememberedEmail(raw)).toBe(expected)
  })

  it("reads and writes only a normalized valid address", () => {
    expect(getRememberedEmail()).toBe("")
    setRememberedEmail(" student@example.fr ")
    expect(getRememberedEmail()).toBe("student@example.fr")
    expect(getString(LAST_EMAIL_KEY)).toBe("student@example.fr")
    setRememberedEmail("invalid")
    expect(getRememberedEmail()).toBe("student@example.fr")
  })

  it("fails safe for malformed stored content", () => {
    setString(LAST_EMAIL_KEY, "not-an-email")
    expect(getRememberedEmail()).toBe("")
  })
})
