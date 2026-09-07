const { readFileSync, readdirSync } = jest.requireActual("node:fs") as {
  readFileSync(path: string, encoding: "utf8"): string
  readdirSync(
    path: string,
    options: { withFileTypes: true },
  ): {
    name: string
    isFile(): boolean
  }[]
}
const { resolve } = jest.requireActual("node:path") as {
  resolve(...paths: string[]): string
}

function route(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), "src/app", relativePath), "utf8")
}

describe("Settings route structure", () => {
  it("keeps the tab index as a thin feature export", () => {
    expect(route("(tabs)/settings/index.tsx").trim()).toBe(
      'export { SettingsScreen as default } from "@/features/settings/ui"',
    )
  })

  it("uses a compact localized native title", () => {
    const layout = route("(tabs)/settings/_layout.tsx")
    expect(layout).toContain("headerShown: true")
    expect(layout).toContain('title: t("settingsHub.title")')
  })

  it("redirects legacy Profile and More routes to canonical Settings", () => {
    expect(route("profile.tsx")).toContain('<Redirect href="/settings" />')
    expect(route("more.tsx")).toContain('<Redirect href="/settings" />')
    expect(route("(tabs)/_layout.tsx")).not.toContain("profile")
    expect(route("profile.tsx")).not.toMatch(/useWindowDimensions|onLayout/)
    expect(route("more.tsx")).not.toMatch(/useWindowDimensions|onLayout/)
  })

  it("keeps About as a thin feature route registered in the root Stack", () => {
    expect(route("about.tsx").trim()).toBe(
      'export { AboutScreen as default } from "@/features/about/ui"',
    )
    const rootLayout = route("_layout.tsx")
    expect(rootLayout).toContain('<Stack.Screen name="about" />')
    expect(rootLayout).toContain('initialRouteName: "(tabs)"')
  })

  it("keeps Activity as a thin feature route registered in the root Stack", () => {
    expect(route("activity.tsx").trim()).toBe(
      'export { ActivityScreen as default } from "@/features/activity/ui"',
    )
    expect(route("_layout.tsx")).toContain('<Stack.Screen name="activity" />')
  })

  it("keeps both Changelog routes thin with tabs-only gate ownership", () => {
    expect(route("changelog.tsx").trim()).toBe(
      'export { ChangelogHistoryScreen as default } from "@/features/changelog/ui"',
    )
    expect(route("changelog-sheet.tsx").trim()).toBe(
      'export { ChangelogSheetScreen as default } from "@/features/changelog/ui"',
    )
    const rootLayout = route("_layout.tsx")
    expect(rootLayout).toContain('<Stack.Screen name="changelog" />')
    expect(rootLayout).toContain('name="changelog-sheet"')
    expect(rootLayout).toContain(
      'Platform.OS === "ios" ? "formSheet" : "fullScreenModal"',
    )
    expect(rootLayout).toContain("sheetAllowedDetents: [1]")
    expect(rootLayout).toContain("sheetGrabberVisible: true")
    expect(rootLayout).not.toContain("ChangelogGate")

    const tabsLayout = route("(tabs)/_layout.tsx")
    expect(tabsLayout).toContain("<ChangelogGate />")
    expect(route("onboarding/_layout.tsx")).not.toContain("ChangelogGate")
  })

  it("classifies every root route under compact defaults or an explicit exception", () => {
    const rootLayout = route("_layout.tsx")
    expect(rootLayout).toContain("screenOptions={rootScreenOptions}")
    expect(rootLayout).toContain("buildCompactRootScreenOptions")

    for (const name of [
      "(tabs)",
      "onboarding",
      "profile",
      "more",
      "dev-import",
    ]) {
      expect(rootLayout).toMatch(
        new RegExp(
          `name=["']${name.replace(/[()]/g, "\\$&")}["'][^>]*headerShown: false`,
        ),
      )
    }

    const visibleRoutes = [
      "about",
      "activity",
      "appearance-settings",
      "changelog",
      "changelog-sheet",
      "event-details/[uid]",
      "feedback",
      "hidden-events",
      "notification-settings",
      "personal-event-form",
      "personal-events",
      "timezone-settings",
      "user-calendars",
    ]
    for (const name of visibleRoutes) {
      expect(rootLayout).toContain(`name="${name}"`)
    }

    const topLevelRoutes = readdirSync(resolve(process.cwd(), "src/app"), {
      withFileTypes: true,
    })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".tsx"))
      .map((entry) => entry.name.replace(/\.tsx$/, ""))
      .filter((name) => name !== "_layout")
      .sort()
    expect(topLevelRoutes).toEqual(
      [
        ...visibleRoutes.filter((name) => !name.includes("/")),
        "dev-import",
        "more",
        "profile",
      ].sort(),
    )

    expect(route("../components/chrome/root-screen-options.ts")).toContain(
      'headerBackButtonDisplayMode: "minimal"',
    )
  })

  it("keeps personal-event list and form titles feature-owned and localized", () => {
    expect(
      route("../features/personal-events/ui/personal-events-list.tsx"),
    ).toContain('title: t("personalEvents.list.title")')
    const form = route(
      "../features/personal-events/ui/personal-event-form-screen.tsx",
    )
    expect(form).toContain('t("personalEvents.form.createTitle")')
    expect(form).toContain('t("personalEvents.form.editTitle")')
  })

  it("keeps Settings root destination titles feature-owned and localized", () => {
    expect(
      route("../features/settings/ui/appearance-settings-screen.tsx"),
    ).toContain('title: t("settings.title")')
    expect(
      route("../features/notifications/ui/notification-settings-screen.tsx"),
    ).toContain('title: t("notifications.title")')
  })
})
