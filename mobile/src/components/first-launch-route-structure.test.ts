const { readFileSync } = jest.requireActual("node:fs") as {
  readFileSync(path: string, encoding: "utf8"): string
}
const { resolve } = jest.requireActual("node:path") as {
  resolve(...paths: string[]): string
}

const rootLayout = readFileSync(
  resolve(process.cwd(), "src/app/_layout.tsx"),
  "utf8",
)

describe("first-launch root structure", () => {
  it("keeps runtime and the first calendar read behind ordered readiness", () => {
    const readyBoundary = rootLayout.indexOf('appReady.status === "ready" ? (')
    expect(readyBoundary).toBeGreaterThan(0)
    expect(rootLayout.indexOf("<EnvironmentRuntimeGate>")).toBeGreaterThan(
      readyBoundary,
    )
    expect(rootLayout.indexOf("<FirstLaunchGate")).toBeGreaterThan(
      readyBoundary,
    )

    const pendingBoundary = rootLayout.indexOf(
      'if (decision === "pending") return null',
    )
    for (const runtime of [
      "<OtaUpdateRuntime />",
      "<StartupSync />",
      "<ActivityRuntime />",
      "<NotificationRegistration />",
      "<NotificationTapRouting />",
      "<Stack screenOptions",
    ]) {
      expect(rootLayout.indexOf(runtime)).toBeGreaterThan(pendingBoundary)
    }
  })

  it("protects every post-onboarding sibling with one eligibility guard", () => {
    const protectedStart = rootLayout.indexOf(
      "<Stack.Protected guard={eligible}>",
    )
    const protectedEnd = rootLayout.indexOf(
      "</Stack.Protected>",
      protectedStart,
    )
    const protectedGraph = rootLayout.slice(protectedStart, protectedEnd)

    for (const route of [
      "(tabs)",
      "profile",
      "appearance-settings",
      "about",
      "changelog",
      "changelog-sheet",
      "timezone-settings",
      "personal-event-form",
      "personal-events",
      "event-details/[uid]",
      "hidden-events",
      "activity",
      "notification-settings",
      "feedback",
      "user-calendars",
    ]) {
      expect(protectedGraph).toContain(`name="${route}"`)
    }
    expect(protectedGraph).not.toContain('name="onboarding"')
    expect(protectedGraph).not.toContain('name="dev-import"')
    expect(rootLayout.slice(0, protectedStart)).toContain(
      "<Stack.Protected guard={!eligible}>",
    )
    expect(rootLayout.slice(0, protectedStart)).toContain(
      '<Stack.Screen name="onboarding" />',
    )
    expect(rootLayout.slice(0, protectedStart)).toContain(
      '<Stack.Screen name="dev-import" options={{ headerShown: false }} />',
    )
  })
})
