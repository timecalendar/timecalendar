import { render } from "@testing-library/react-native"

import { useColorScheme } from "@/hooks/use-color-scheme"

import { EmptyState } from "./empty-state"

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn(),
}))

const mockUseColorScheme = useColorScheme as jest.MockedFunction<
  typeof useColorScheme
>
const artwork = { light: { uri: "local-light" }, dark: { uri: "local-dark" } }

beforeEach(() => mockUseColorScheme.mockReturnValue("light"))

describe("EmptyState", () => {
  it.each(["screen", "section"] as const)(
    "renders the %s title/caption hierarchy and selector",
    async (variant) => {
      const view = await render(
        <EmptyState
          variant={variant}
          title="Nothing here"
          caption="More detail"
          testID="empty"
        />,
      )
      expect(view.getByTestId("empty")).toHaveProp(
        "accessibilityLiveRegion",
        "polite",
      )
      expect(view.getByRole("header")).toHaveTextContent("Nothing here")
      expect(view.getByText("More detail")).not.toHaveProp(
        "allowFontScaling",
        false,
      )
      expect(view.queryByTestId("empty-artwork")).toBeNull()
    },
  )

  it.each([
    ["light" as const, artwork.light],
    ["dark" as const, artwork.dark],
  ])("selects only the local %s artwork", async (scheme, expected) => {
    mockUseColorScheme.mockReturnValue(scheme)
    const view = await render(
      <EmptyState
        variant="screen"
        title="Nothing here"
        artwork={artwork}
        testID="empty"
      />,
    )
    const image = view.getByTestId("empty-artwork", {
      includeHiddenElements: true,
    })
    expect(image).toHaveProp("source", [expected])
    expect(image).toHaveProp("accessible", false)
    expect(image).toHaveProp("importantForAccessibility", "no-hide-descendants")
  })
})
