import { decideInitialRoute, shouldShowFirstIcalReminder } from "./decisions"

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
