import { render, screen } from "@testing-library/react-native"

import { usePlatform } from "@/test-support/platform"
import { Colors } from "@/theme"

import { ListStatus } from "./list-status"
import { StatusSymbol } from "./status-symbol"

const mockIcon = jest.fn()
jest.mock("@/components/icon", () => ({
  Icon: (props: unknown) => {
    mockIcon(props)
    return null
  },
}))

beforeEach(() => mockIcon.mockClear())

describe.each(["ios", "android"] as const)("StatusSymbol on %s", (os) => {
  usePlatform(os)

  it("renders a fixed-size platform glyph beside the status text", async () => {
    await render(
      <ListStatus
        media={
          <StatusSymbol name={{ ios: "magnifyingglass", android: "search" }} />
        }
        message="No schools match"
        announceKey="noResults"
      />,
    )

    expect(mockIcon).toHaveBeenCalledWith({
      testID: "status-symbol",
      ios: "magnifyingglass",
      android: "search",
      size: 40,
      color: Colors.light.textSecondary,
      scaling: "fixed",
    })
    expect(screen.getByText("No schools match")).toBeTruthy()
  })
})
