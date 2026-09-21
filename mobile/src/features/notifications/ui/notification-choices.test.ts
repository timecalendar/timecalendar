import {
  NOTIFICATION_DAY_CHOICES,
  NOTIFICATION_FREQUENCIES,
  selectedDaysChoice,
  validateCustomDays,
} from "./notification-choices"

describe("notification choices", () => {
  it("offers every canonical frequency once", () => {
    expect(NOTIFICATION_FREQUENCIES.map(({ value }) => value)).toEqual([
      "immediately",
      "hourly",
      "daily",
    ])
  })

  it.each([1, 3, 7, 14, 30])("selects the %i-day preset only", (days) => {
    const selected = selectedDaysChoice(days)
    expect(selected).toBe(String(days))
    expect(
      NOTIFICATION_DAY_CHOICES.filter(({ value }) => value === selected),
    ).toHaveLength(1)
  })

  it.each([2, 12, 29])("preserves nonpreset %i as Custom", (days) => {
    expect(selectedDaysChoice(days)).toBe("custom")
  })
})

describe("validateCustomDays", () => {
  it.each([
    ["", "empty"],
    ["   ", "empty"],
    ["+1", "invalid"],
    ["-1", "invalid"],
    ["1.5", "invalid"],
    ["1,5", "invalid"],
    ["1e1", "invalid"],
    ["twelve", "invalid"],
    ["12 days", "invalid"],
    ["0", "range"],
    ["31", "range"],
    ["999999999999999999999", "range"],
  ])("classifies %p as %s", (input, state) => {
    expect(validateCustomDays(input).state).toBe(state)
  })

  it.each([
    ["1", 1],
    ["30", 30],
    [" 12 ", 12],
    ["007", 7],
  ])("accepts %p as %i", (input, value) => {
    expect(validateCustomDays(input)).toEqual({ state: "valid", value })
  })
})
