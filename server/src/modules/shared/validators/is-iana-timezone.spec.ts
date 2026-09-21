import { isIanaTimezone } from "./is-iana-timezone"

describe("isIanaTimezone worldwide chooser compatibility", () => {
  it.each([
    "Europe/Paris",
    "US/Eastern",
    "UTC",
    "Asia/Kathmandu",
    "Australia/Adelaide",
  ])("accepts representative selectable identifier %s", (identifier) => {
    expect(isIanaTimezone(identifier)).toBe(true)
  })

  it.each([undefined, "", "Not/A_Zone"])("rejects %p", (value) => {
    expect(isIanaTimezone(value)).toBe(false)
  })
})
