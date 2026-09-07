import { fireEvent, render } from "@testing-library/react-native"
import { StyleSheet } from "react-native"

import { useColorScheme } from "@/hooks/use-color-scheme"
import { usePlatform } from "@/test-support/platform"
import { Colors } from "@/theme"

import { PrimaryAction } from "./primary-action"

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn(),
}))

const mockUseColorScheme = useColorScheme as jest.MockedFunction<
  typeof useColorScheme
>

beforeEach(() => mockUseColorScheme.mockReturnValue("light"))

describe.each([
  ["ios" as const, 44],
  ["android" as const, 48],
])("PrimaryAction on %s", (platform, minHeight) => {
  usePlatform(platform)

  it("uses the semantic brand pair and activates", async () => {
    const onPress = jest.fn()
    const view = await render(
      <PrimaryAction label="Save" onPress={onPress} testID="save" />,
    )
    await fireEvent.press(view.getByTestId("save"))
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(
      StyleSheet.flatten(view.getByTestId("save").props.style),
    ).toMatchObject({
      minHeight,
      backgroundColor: Colors.light.primaryStrong,
    })
    expect(view.getByText("Save")).toHaveStyle({
      color: Colors.light.onPrimary,
    })
  })

  it("keeps the verified semantic pair in dark mode", async () => {
    mockUseColorScheme.mockReturnValue("dark")
    const view = await render(
      <PrimaryAction label="Save" onPress={jest.fn()} testID="save" />,
    )
    expect(
      StyleSheet.flatten(view.getByTestId("save").props.style),
    ).toMatchObject({ backgroundColor: Colors.dark.primaryStrong })
    expect(view.getByText("Save")).toHaveStyle({ color: Colors.dark.onPrimary })
  })

  it.each([
    ["disabled", { disabled: true }],
    ["busy", { busy: true }],
  ])("blocks activation while %s", async (_state, stateProps) => {
    const onPress = jest.fn()
    const view = await render(
      <PrimaryAction
        label="Save"
        onPress={onPress}
        testID="save"
        {...stateProps}
      />,
    )
    await fireEvent.press(view.getByTestId("save"))
    expect(onPress).not.toHaveBeenCalled()
    expect(view.getByTestId("save")).toBeDisabled()
    expect(view.getByText("Save")).toBeTruthy()
  })

  it.each([
    ["disabled", { disabled: true }],
    ["busy", { busy: true }],
  ])(
    "keeps required invariants when caller styles are hostile while %s",
    async (_state, stateProps) => {
      const view = await render(
        <PrimaryAction
          label="Save"
          onPress={jest.fn()}
          testID="save"
          style={{ backgroundColor: "red", minHeight: 1, opacity: 1 }}
          {...stateProps}
        />,
      )
      expect(
        StyleSheet.flatten(view.getByTestId("save").props.style),
      ).toMatchObject({
        backgroundColor: Colors.light.primaryStrong,
        minHeight,
        opacity: 0.55,
      })
    },
  )

  it("keeps busy progress inside the one accessible button", async () => {
    const view = await render(
      <PrimaryAction label="Save" onPress={jest.fn()} testID="save" busy />,
    )
    expect(view.getByTestId("save")).toHaveProp("accessibilityState", {
      disabled: true,
      busy: true,
    })
    expect(
      view.getByTestId("save-progress", { includeHiddenElements: true }),
    ).toHaveProp("accessible", false)
  })
})
