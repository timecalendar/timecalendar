import { readFileSync } from "node:fs"
import { join } from "node:path"

const root = join(__dirname, "../../../..")
const read = (path: string) => readFileSync(join(root, path), "utf8")

describe("native notification control ownership contract", () => {
  it("keeps every route thin and registered with Router-owned sheet options", () => {
    expect(read("src/app/notification-frequency.tsx").trim()).toBe(
      'export { NotificationFrequencyScreen as default } from "@/features/notifications/ui"',
    )
    expect(read("src/app/notification-days-ahead.tsx").trim()).toBe(
      'export { NotificationDaysAheadScreen as default } from "@/features/notifications/ui"',
    )
    expect(read("src/app/notification-days-custom.tsx").trim()).toBe(
      'export { NotificationDaysCustomScreen as default } from "@/features/notifications/ui"',
    )
    const layout = read("src/app/_layout.tsx")
    expect(layout).toContain('name="notification-frequency"')
    expect(layout).toContain('name="notification-days-ahead"')
    expect(layout).toContain('name="notification-days-custom"')
    expect(layout).toContain(
      'presentation:\n                    Platform.OS === "ios" ? "formSheet"',
    )
    expect(layout).toContain("sheetGrabberVisible: true")
  })

  it("keeps Expo UI in chrome and data ownership out of feature UI", () => {
    for (const file of [
      "src/features/notifications/ui/notification-settings-screen.tsx",
      "src/features/notifications/ui/notification-frequency-screen.tsx",
      "src/features/notifications/ui/notification-days-ahead-screen.tsx",
      "src/features/notifications/ui/notification-days-custom-screen.tsx",
    ]) {
      const source = read(file)
      expect(source).not.toMatch(
        /@expo\/ui|@\/storage|api\/generated|runtime-instance|transport/,
      )
      expect(source).not.toMatch(/ScrollView|FlatList|SectionList/)
    }
    expect(
      read("src/components/chrome/native-settings-numeric-editor.tsx"),
    ).toContain('from "@expo/ui/swift-ui"')
  })

  it("pins preset-over-Custom and one explicit custom commit", () => {
    const model = read(
      "src/features/notifications/ui/notification-choices.test.ts",
    )
    const behavior = read(
      "src/features/notifications/ui/notification-settings-screen.test.tsx",
    )
    expect(model).toContain("selectedDaysChoice(days)")
    expect(model).toContain('toBe("custom")')
    expect(behavior).toContain("opens Custom write-free")
    expect(behavior).toContain("toHaveBeenCalledTimes(1)")
    expect(behavior).toContain("discards a Custom draft on Cancel")
  })
})
