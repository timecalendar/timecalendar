import { fireEvent, render } from "@testing-library/react-native"

import { usePlatform } from "@/test-support/platform"
import { Colors } from "@/theme"

import { FloatingAction } from "./floating-action"

let mockScheme: "light" | "dark" = "light"
jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => mockScheme,
}))

const renderFab = (onPress = jest.fn()) =>
  render(
    <FloatingAction
      icon={{ ios: "plus", android: "add" }}
      label="Add an event"
      testID="fab"
      onPress={onPress}
    />,
  )

describe("FloatingAction on ios", () => {
  usePlatform("ios")

  it("renders nothing, since iOS adds through the navigation bar", async () => {
    const view = await renderFab()
    expect(view.toJSON()).toBeNull()
  })
})

describe("FloatingAction on android", () => {
  usePlatform("android")

  it("renders the FAB named by its label and calls onPress", async () => {
    const onPress = jest.fn()
    const view = await renderFab(onPress)
    const fab = view.getByTestId("fab")
    expect(fab.props.accessibilityRole).toBe("button")
    expect(view.getByTestId("compose-icon").props.accessibilityLabel).toBe(
      "Add an event",
    )
    await fireEvent.press(fab)
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it.each(["light", "dark"] as const)(
    "seeds its host from the %s scheme",
    async (scheme) => {
      mockScheme = scheme
      const view = await renderFab()
      const host = view.getByTestId("compose-host")
      expect(host.props.colorScheme).toBe(scheme)
      expect(host.props.seedColor).toBe(Colors[scheme].primary)
      expect(host.props.matchContents).toBe(true)
    },
  )
})
