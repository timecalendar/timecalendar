import { displayEventTitle } from "./event-title"

describe("displayEventTitle", () => {
  it.each([undefined, "", "   "])("uses localized fallback for %p", (title) => {
    expect(displayEventTitle(title, "(Sans titre)")).toBe("(Sans titre)")
  })

  it("trims a usable title without mutating its source", () => {
    const title = "  Maths  "
    expect(displayEventTitle(title, "(No title)")).toBe("Maths")
    expect(title).toBe("  Maths  ")
  })
})
