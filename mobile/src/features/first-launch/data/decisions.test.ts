import {
  decideInitialRoute,
  onboardingResolutionToSeed,
  shouldShowFirstIcalReminder,
} from "./decisions"

describe("decideInitialRoute", () => {
  it.each([
    [false, 0, undefined, "pending"],
    [false, 1, "calendarImported", "pending"],
    [true, 0, undefined, "onboarding"],
    [true, 0, "skipped", "tabs"],
    [true, 0, "calendarImported", "tabs"],
    [true, 1, undefined, "tabs"],
  ] as const)(
    "loaded=%s count=%d resolution=%s returns %s",
    (calendarsLoaded, calendarCount, onboardingResolution, expected) => {
      expect(
        decideInitialRoute({
          calendarsLoaded,
          calendarCount,
          onboardingResolution,
        }),
      ).toBe(expected)
    },
  )
})

describe("onboardingResolutionToSeed", () => {
  it("seeds a recovered calendar once so later deletion stays eligible", () => {
    const seeded = onboardingResolutionToSeed(1, undefined)
    expect(seeded).toBe("calendarImported")
    expect(
      decideInitialRoute({
        calendarsLoaded: true,
        calendarCount: 0,
        onboardingResolution: seeded,
      }),
    ).toBe("tabs")
  })

  it("does not overwrite an existing resolution or seed an empty install", () => {
    expect(onboardingResolutionToSeed(0, undefined)).toBeUndefined()
    expect(onboardingResolutionToSeed(1, "skipped")).toBeUndefined()
  })
})

describe("shouldShowFirstIcalReminder", () => {
  it.each([
    [false, 0, "skipped", "pending", false],
    [true, 0, undefined, "pending", false],
    [true, 0, "skipped", "pending", true],
    [true, 0, "calendarImported", "pending", true],
    [true, 0, "skipped", "dismissed", false],
    [true, 1, "skipped", "pending", false],
    [true, 1, "calendarImported", "dismissed", false],
  ] as const)(
    "loaded=%s count=%d resolution=%s reminder=%s returns %s",
    (
      calendarsLoaded,
      calendarCount,
      onboardingResolution,
      reminderState,
      expected,
    ) => {
      expect(
        shouldShowFirstIcalReminder({
          calendarsLoaded,
          calendarCount,
          onboardingResolution,
          reminderState,
        }),
      ).toBe(expected)
    },
  )
})
