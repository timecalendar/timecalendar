import { render, screen } from "@testing-library/react-native"

import { usePlatform } from "@/test-support/platform"
import { Colors } from "@/theme"

import { ListStatus } from "./list-status"
import { StatusSymbol } from "./status-symbol"

const mockSymbolView = jest.fn()
jest.mock("expo-symbols", () => ({
  SymbolView: (props: unknown) => {
    mockSymbolView(props)
    return null
  },
}))

beforeEach(() => mockSymbolView.mockClear())

describe.each(["ios", "android"] as const)("StatusSymbol on %s", (os) => {
  usePlatform(os)

  it("renders a decorative platform glyph beside the status text", async () => {
    await render(
      <ListStatus
        media={
          <StatusSymbol name={{ ios: "magnifyingglass", android: "search" }} />
        }
        message="No schools match"
        announceKey="noResults"
      />,
    )

    expect(mockSymbolView).toHaveBeenCalledWith({
      name: { ios: "magnifyingglass", android: "search" },
      size: 40,
      tintColor: Colors.light.textSecondary,
      accessible: false,
      accessibilityElementsHidden: true,
      importantForAccessibility: "no-hide-descendants",
    })
    expect(screen.getByText("No schools match")).toBeTruthy()
  })
})
