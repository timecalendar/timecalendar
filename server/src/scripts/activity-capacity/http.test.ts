import { assertLocalBaseUrl } from "./http"

describe("Activity route capacity target safety", () => {
  it.each(["http://localhost:3005", "http://127.0.0.1:3005"])(
    "allows the loopback target %s",
    (value) => {
      expect(assertLocalBaseUrl(value).hostname).toMatch(
        /localhost|127\.0\.0\.1/,
      )
    },
  )

  it("rejects remote targets before a fixture token can be sent", () => {
    expect(() =>
      assertLocalBaseUrl("https://preprod-api.timecalendar.app"),
    ).toThrow('refusing host "preprod-api.timecalendar.app"')
  })
})
