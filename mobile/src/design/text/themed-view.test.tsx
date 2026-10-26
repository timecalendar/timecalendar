import { render } from "@testing-library/react-native"
import { StyleSheet } from "react-native"

import { useColorScheme } from "@/hooks/use-color-scheme"
import { Colors } from "@/theme"

import { ThemedView } from "./themed-view"

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn(),
}))

const mockUseColorScheme = useColorScheme as jest.MockedFunction<
  typeof useColorScheme
>

describe.each(["light", "dark"] as const)("ThemedView in %s", (scheme) => {
  beforeEach(() => mockUseColorScheme.mockReturnValue(scheme))

  it("paints the background surface by default", async () => {
    const view = await render(<ThemedView testID="surface" />)
    expect(StyleSheet.flatten(view.getByTestId("surface").props.style)).toEqual(
      { backgroundColor: Colors[scheme].background },
    )
  })

  it("paints the requested surface", async () => {
    const view = await render(
      <ThemedView testID="surface" type="backgroundSelected" />,
    )
    expect(StyleSheet.flatten(view.getByTestId("surface").props.style)).toEqual(
      { backgroundColor: Colors[scheme].backgroundSelected },
    )
  })

  it("merges the caller style last", async () => {
    const view = await render(
      <ThemedView
        testID="surface"
        type="backgroundElement"
        style={{ backgroundColor: "red", padding: 4 }}
      />,
    )
    expect(StyleSheet.flatten(view.getByTestId("surface").props.style)).toEqual(
      { backgroundColor: "red", padding: 4 },
    )
  })
})
