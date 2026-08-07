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
})
