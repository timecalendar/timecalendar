const { readFileSync } = jest.requireActual("node:fs") as {
  readFileSync(path: string, encoding: "utf8"): string
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
  })

  it("keeps About as a thin feature route registered in the root Stack", () => {
    expect(route("about.tsx").trim()).toBe(
      'export { AboutScreen as default } from "@/features/about/ui"',
    )
    const rootLayout = route("_layout.tsx")
    expect(rootLayout).toContain(
      '<Stack.Screen name="about" options={{ headerShown: true }} />',
    )
    expect(rootLayout).toContain('initialRouteName: "(tabs)"')
  })

  it("keeps Activity as a thin feature route registered in the root Stack", () => {
    expect(route("activity.tsx").trim()).toBe(
      'export { ActivityScreen as default } from "@/features/activity/ui"',
    )
    expect(route("_layout.tsx")).toContain(
      '<Stack.Screen name="activity" options={{ headerShown: true }} />',
    )
  })

  it("keeps Startup settings as a thin feature route registered in the root Stack", () => {
    expect(route("startup-settings.tsx").trim()).toBe(
      'export { default } from "@/features/settings/ui/startup-settings-screen"',
    )
    expect(route("_layout.tsx")).toContain('name="startup-settings"')
  })

  it("keeps both Changelog routes thin with tabs-only gate ownership", () => {
    expect(route("changelog.tsx").trim()).toBe(
      'export { ChangelogHistoryScreen as default } from "@/features/changelog/ui"',
    )
    expect(route("changelog-sheet.tsx").trim()).toBe(
      'export { ChangelogSheetScreen as default } from "@/features/changelog/ui"',
    )
    const rootLayout = route("_layout.tsx")
    expect(rootLayout).toContain(
      '<Stack.Screen name="changelog" options={{ headerShown: true }} />',
    )
    expect(rootLayout).toContain('name="changelog-sheet"')
    expect(rootLayout).toContain(
      'Platform.OS === "ios" ? "formSheet" : "fullScreenModal"',
    )
    expect(rootLayout).toContain("sheetAllowedDetents: [1]")
    expect(rootLayout).toContain("sheetGrabberVisible: true")
    expect(rootLayout).not.toContain("ChangelogGate")

    expect(route("(tabs)/_layout.tsx").trim()).toBe(
      'export { LaunchGatedTabs as default } from "@/features/startup/ui"',
    )
    const tabsLayout = route("../features/startup/ui/launch-gated-tabs.tsx")
    expect(tabsLayout).toContain("<ChangelogGate />")
    expect(route("onboarding/_layout.tsx")).not.toContain("ChangelogGate")
  })
})
