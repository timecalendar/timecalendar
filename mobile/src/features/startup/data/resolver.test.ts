import { resolveLaunchDestination } from "./resolver"

const resolvedUser = {
  initialPath: "/",
  notificationIntent: null,
  hasHeldCalendar: true,
  preference: "home" as const,
}

describe("resolveLaunchDestination", () => {
  it("preserves an explicit deep link ahead of every fallback", () => {
    expect(
      resolveLaunchDestination({
        ...resolvedUser,
        initialPath: "/onboarding/school",
        notificationIntent: { kind: "calendar" },
        hasHeldCalendar: false,
        preference: "calendar",
      }),
    ).toBe("/onboarding/school")
  })

  it("routes event and Calendar notification intents", () => {
    expect(
      resolveLaunchDestination({
        ...resolvedUser,
        notificationIntent: { kind: "event", uid: "event-1" },
      }),
    ).toBe("/event-details/event-1")
    expect(
      resolveLaunchDestination({
        ...resolvedUser,
        notificationIntent: { kind: "calendar" },
      }),
    ).toBe("/calendar")
  })

  it("sends an unresolved fresh user to onboarding regardless of preference", () => {
    expect(
      resolveLaunchDestination({
        ...resolvedUser,
        hasHeldCalendar: false,
        preference: "calendar",
      }),
    ).toBe("/onboarding")
  })

  it("uses Home and Calendar as resolved-user fallbacks", () => {
    expect(resolveLaunchDestination(resolvedUser)).toBe("/")
    expect(
      resolveLaunchDestination({ ...resolvedUser, preference: "calendar" }),
    ).toBe("/calendar")
  })
})
