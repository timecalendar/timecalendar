import { render } from "@testing-library/react-native"

import { useLaunchCommitted } from "@/features/startup/data"

import { LaunchGatedTabs } from "./launch-gated-tabs"

jest.mock("@/components/app-tabs", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native")
  return { __esModule: true, default: () => <View testID="app-tabs" /> }
})
jest.mock("@/features/changelog", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native")
  return { ChangelogGate: () => <View testID="changelog-gate" /> }
})
jest.mock("@/features/startup/data", () => ({
  useLaunchCommitted: jest.fn(),
}))

const mockUseLaunchCommitted = jest.mocked(useLaunchCommitted)

describe("Tabs launch gate", () => {
  it("mounts no tab-owned storage consumers before launch commitment", async () => {
    mockUseLaunchCommitted.mockReturnValue(false)

    const view = await render(<LaunchGatedTabs />)

    expect(view.queryByTestId("app-tabs")).toBeNull()
    expect(view.queryByTestId("changelog-gate")).toBeNull()
  })

  it("mounts tabs and their secondary gate after launch commitment", async () => {
    mockUseLaunchCommitted.mockReturnValue(true)

    const view = await render(<LaunchGatedTabs />)

    expect(view.getByTestId("app-tabs")).toBeTruthy()
    expect(view.getByTestId("changelog-gate")).toBeTruthy()
  })
})
