import { render } from "@testing-library/react-native"

import AppTabs from "@/components/app-tabs"

// The native tab bar (expo-router unstable-native-tabs, alpha) needs a router
// layout context and renders nothing queryable off-device, so we mock the
// `@/components/chrome` seam to a plain inspectable tree. That keeps the test on
// app-tabs's own contract — which triggers exist, in what order, wired to which
// (tabs) route, with which label — the structure lint and types can't see. The
// sf/md icon names are validated by tsc against the SFSymbol/AndroidSymbol
// unions, so they need no runtime assertion here.
jest.mock("@/components/chrome", () => {
  // Lazy require inside the factory (jest-hoist) + named components for
  // display-name — the suite's established mock-factory shape (setup-calendar-kit).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react")
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text, View } = require("react-native")

  function Trigger(props: { name: string; children: React.ReactNode }) {
    return (
      <View testID="trigger" accessibilityLabel={props.name}>
        {props.children}
      </View>
    )
  }
  function TriggerLabel(props: { children: React.ReactNode }) {
    return <Text>{props.children}</Text>
  }
  function TriggerIcon() {
    return null
  }
  Trigger.Label = TriggerLabel
  Trigger.Icon = TriggerIcon

  function NativeTabs(props: { children: React.ReactNode }) {
    return <View>{props.children}</View>
  }
  NativeTabs.Trigger = Trigger

  return { NativeTabs }
})

describe("AppTabs", () => {
  it("declares Home, Calendar, Profile triggers in that order (Flutter parity)", async () => {
    const { getAllByTestId } = await render(<AppTabs />)

    const order = getAllByTestId("trigger").map(
      (node) => node.props.accessibilityLabel,
    )

    expect(order).toEqual(["index", "calendar", "profile"])
  })

  it("labels each tab from i18n", async () => {
    const { getByText } = await render(<AppTabs />)

    // Real i18n (EN under the test harness) resolves the catalog keys.
    expect(getByText("Home")).toBeTruthy()
    expect(getByText("Calendar")).toBeTruthy()
    expect(getByText("Profile")).toBeTruthy()
  })
})
