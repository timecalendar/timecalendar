import { notificationStrings } from "modules/notifier/models/notification-strings"

describe("notificationStrings", () => {
  const locales = Object.keys(notificationStrings) as Array<
    keyof typeof notificationStrings
  >

  it("covers fr and en", () => {
    expect(locales.sort()).toEqual(["en", "fr"])
  })

  it("has key parity across locales", () => {
    const [reference, ...others] = locales
    const referenceKeys = Object.keys(notificationStrings[reference]).sort()
    const referenceTitleKeys = Object.keys(
      notificationStrings[reference].detailTitle,
    ).sort()

    for (const locale of others) {
      expect(Object.keys(notificationStrings[locale]).sort()).toEqual(
        referenceKeys,
      )
      expect(
        Object.keys(notificationStrings[locale].detailTitle).sort(),
      ).toEqual(referenceTitleKeys)
    }
  })

  it("renders a digest body with the count in every locale", () => {
    for (const locale of locales) {
      expect(notificationStrings[locale].digestBody(4)).toContain("4")
    }
  })
})
