import { render } from "@testing-library/react-native"

import { usePlatform } from "@/test-support/platform"
import { Colors } from "@/theme"

import { NativeSettingsHeader } from "./native-settings-header"

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "dark",
}))

describe.each([
  ["ios", "swiftui-rn-host"],
  ["android", "compose-rn-host"],
] as const)("NativeSettingsHeader on %s", (platform, hostID) => {
  usePlatform(platform)

  it("hosts the icon, a heading name, readable copy, and a brand caption", async () => {
    const view = await render(
      <NativeSettingsHeader
        title="TimeCalendar"
        tagline="Tagline"
        detail="Detail"
        caption="Version 4"
        testID="header"
        captionTestID="caption"
      />,
    )
    expect(view.getByTestId(hostID)).toBeOnTheScreen()
    expect(view.getByRole("header", { name: "TimeCalendar" })).toBeOnTheScreen()
    expect(view.getByText("Tagline")).toBeOnTheScreen()
    expect(view.getByText("Detail")).toHaveStyle({
      color: Colors.dark.textSecondary,
    })
    expect(view.getByTestId("caption")).toHaveStyle({
      color: Colors.dark.actionText,
    })
  })

  it("omits the optional detail and caption", async () => {
    const view = await render(
      <NativeSettingsHeader
        title="TimeCalendar"
        tagline="Tagline"
        testID="header"
      />,
    )
    expect(view.queryByText("Detail")).toBeNull()
    expect(view.queryByTestId("caption")).toBeNull()
  })
})
