import { render } from "@testing-library/react-native"
import { StyleSheet, type ViewStyle } from "react-native"

import { usePlatform } from "@/test-support/platform"
import { Colors } from "@/theme"

import { Separator } from "./separator"

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}))

const hidden = { includeHiddenElements: true }

function flat(element: { props: { style?: unknown } }): ViewStyle {
  return StyleSheet.flatten(element.props.style as ViewStyle) ?? {}
}

describe.each([
  ["ios", StyleSheet.hairlineWidth],
  ["android", 1],
] as const)("Separator on %s", (platform, thickness) => {
  usePlatform(platform)

  it.each([
    [undefined, 0],
    ["none", 0],
    ["leading", 16],
    [{ leadingWidth: 40 }, 16 + 40 + 16],
  ] as const)("insets %j by %d", async (inset, start) => {
    const view = await render(
      <Separator testID="separator" {...(inset ? { inset } : {})} />,
    )
    const separator = view.getByTestId("separator", hidden)
    expect(flat(separator).paddingStart).toBe(start)
    const line = separator.children[0] as { props: { style?: unknown } }
    expect(flat(line)).toEqual({
      height: thickness,
      backgroundColor: Colors.light.separator,
    })
  })

  it("is hidden from assistive technology", async () => {
    const view = await render(<Separator testID="separator" />)
    expect(view.queryByTestId("separator")).toBeNull()
    const separator = view.getByTestId("separator", hidden)
    expect(separator.props.accessibilityElementsHidden).toBe(true)
    expect(separator.props.importantForAccessibility).toBe(
      "no-hide-descendants",
    )
  })
})
