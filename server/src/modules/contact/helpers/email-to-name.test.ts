import { emailToName } from "modules/contact/helpers/email-to-name"

describe("emailToName", () => {
  it("converts an email to a name", () => {
    const name = emailToName("john.doe@email.com")
    expect(name).toBe("John Doe")
  })

  it("removes underscores", () => {
    const name = emailToName("john_doe@email.com")
    expect(name).toBe("John Doe")
  })

  it("removes multiple spaces", () => {
    const name = emailToName("john__doe@email.com")
    expect(name).toBe("John Doe")
  })

  it("removes numbers", () => {
    const name = emailToName("john.doe123@email.com")
    expect(name).toBe("John Doe")
  })

  it("removes the plus part", () => {
    const name = emailToName("john.doe+mail@email.com")
    expect(name).toBe("John Doe")
  })

  it("trims", () => {
    const name = emailToName("john.doe_@email.com")
    expect(name).toBe("John Doe")
  })
})
