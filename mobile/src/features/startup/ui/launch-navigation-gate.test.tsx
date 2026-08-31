import { act, render } from "@testing-library/react-native"
import { Text } from "react-native"

import {
  commitLaunch,
  failLaunch,
  resetLaunchStateForTests,
} from "@/features/startup/data"

import { LaunchNavigationGate } from "./launch-navigation-gate"

describe("LaunchNavigationGate", () => {
  beforeEach(resetLaunchStateForTests)

  it("keeps unresolved navigation inert while leaving it mounted", async () => {
    const view = await render(
      <LaunchNavigationGate>
        <Text>About</Text>
      </LaunchNavigationGate>,
    )

    expect(
      view.getByText("About", { includeHiddenElements: true }),
    ).toBeOnTheScreen()
    expect(
      view.getByTestId("launch-navigation", { includeHiddenElements: true }),
    ).toMatchObject({
      props: {
        accessibilityElementsHidden: true,
        importantForAccessibility: "no-hide-descendants",
        pointerEvents: "none",
      },
    })

    await act(async () => commitLaunch("/about"))

    expect(view.getByTestId("launch-navigation")).toMatchObject({
      props: {
        accessibilityElementsHidden: false,
        importantForAccessibility: "auto",
        pointerEvents: "auto",
      },
    })
  })

  it("keeps navigation inert when prerequisites fail", async () => {
    const view = await render(
      <LaunchNavigationGate>
        <Text>About</Text>
      </LaunchNavigationGate>,
    )

    await act(async () => failLaunch(new Error("migration")))

    expect(
      view.getByTestId("launch-navigation", { includeHiddenElements: true })
        .props.pointerEvents,
    ).toBe("none")
  })
})
