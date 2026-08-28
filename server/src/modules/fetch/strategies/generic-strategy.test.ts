import genericStrategy from "modules/fetch/strategies/generic-strategy"

describe("genericStrategy", () => {
  it("converts webcal before applying the bounded ADE window", () => {
    jest.useFakeTimers({
      now: new Date("2026-08-25T12:00:00.000Z"),
    })
    const result = new URL(
      genericStrategy.transformUrl(
        "webcal://ade.example.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=1&calType=ical&nbWeeks=4",
        null,
      ),
    )

    expect(result.protocol).toBe("https:")
    expect(result.searchParams.has("nbWeeks")).toBe(false)
    expect(result.searchParams.get("firstDate")).toBe("2025-08-25")
    expect(result.searchParams.get("lastDate")).toBe("2027-08-25")
    expect(result.toString()).not.toContain("2000-01-01")
    expect(result.toString()).not.toContain("2038-01-01")
    jest.useRealTimers()
  })
})
