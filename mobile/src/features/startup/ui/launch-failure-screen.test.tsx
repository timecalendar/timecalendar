import { fireEvent, render } from "@testing-library/react-native"

import {
  failLaunch,
  getLaunchState,
  resetLaunchStateForTests,
} from "@/features/startup/data"

import { LaunchFailureScreen } from "./launch-failure-screen"

describe("LaunchFailureScreen", () => {
  beforeEach(resetLaunchStateForTests)

  it("renders an accessible blocking error and retries idempotently", async () => {
    failLaunch(new Error("migration"))
    const { getByRole, getByTestId } = await render(<LaunchFailureScreen />)
    expect(getByTestId("startup-failure").props.accessibilityLiveRegion).toBe(
      "assertive",
    )
    await fireEvent.press(
      getByRole("button", { name: "Retry starting TimeCalendar" }),
    )
    expect(getLaunchState()).toEqual({ kind: "resolving", attempt: 1 })
  })
})
