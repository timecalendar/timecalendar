import { fireEvent, render } from "@testing-library/react-native"
import type { Pressable, PressableProps, View } from "react-native"

import { useColorScheme } from "@/hooks/use-color-scheme"
import { usePlatform } from "@/test-support/platform"
import {
  Colors,
  MinTouchTarget,
  Spacing,
  StateOpacity,
  type ThemeColor,
  TypeRamp,
} from "@/theme"

import { Button, type ButtonSize, type ButtonVariant } from "./button"

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn(),
}))

const mockSymbolView = jest.fn()
jest.mock("expo-symbols", () => ({
  SymbolView: (props: unknown) => {
    mockSymbolView(props)
    const { createElement } =
      jest.requireActual<typeof import("react")>("react")
    const { View } =
      jest.requireActual<typeof import("react-native")>("react-native")
    return createElement(View, { testID: "symbol" })
  },
}))

const mockPressableProps = jest.fn<void, [PressableProps]>()
jest.mock("react-native/Libraries/Components/Pressable/Pressable", () => {
  const { createElement, forwardRef } =
    jest.requireActual<typeof import("react")>("react")
  const Actual = jest.requireActual<{ default: typeof Pressable }>(
    "react-native/Libraries/Components/Pressable/Pressable",
  ).default
  return {
    __esModule: true,
    default: forwardRef<View, PressableProps>((props, ref) => {
      mockPressableProps(props)
      return createElement(Actual, { ...props, ref })
    }),
  }
})

const mockUseColorScheme = useColorScheme as jest.MockedFunction<
  typeof useColorScheme
>

beforeEach(() => {
  mockUseColorScheme.mockReturnValue("light")
  mockSymbolView.mockClear()
  mockPressableProps.mockClear()
})

const pressableStyle = (pressed = false) => {
  const { style } = lastPressable()
  if (typeof style !== "function") throw new Error("expected a style callback")
  return style({ pressed, hovered: false }) as Record<string, unknown>
}

const ripple = () => lastPressable().android_ripple

const lastPressable = () => {
  const props = mockPressableProps.mock.lastCall?.[0]
  if (props === undefined) throw new Error("no Pressable rendered")
  return props
}

const tokens: [
  ButtonVariant,
  { fill?: ThemeColor; border?: ThemeColor; label: ThemeColor },
][] = [
  ["filled", { fill: "primaryStrong", label: "onPrimary" }],
  ["tonal", { fill: "backgroundElement", label: "text" }],
  ["outlined", { border: "outline", label: "actionText" }],
  ["text", { label: "actionText" }],
  ["destructive", { fill: "backgroundElement", label: "destructive" }],
]

describe.each(["ios" as const, "android" as const])("Button on %s", (os) => {
  usePlatform(os)

  describe.each(["light" as const, "dark" as const])("%s scheme", (scheme) => {
    beforeEach(() => mockUseColorScheme.mockReturnValue(scheme))

    it.each(tokens)("pairs the %s tokens", async (variant, expected) => {
      const colors = Colors[scheme]
      const view = await render(
        <Button
          variant={variant}
          label="Save"
          onPress={jest.fn()}
          testID="button"
          icon={{ ios: "plus", android: "add" }}
        />,
      )
      const style = pressableStyle()
      expect((style as { backgroundColor?: string }).backgroundColor).toBe(
        expected.fill ? colors[expected.fill] : undefined,
      )
      if (expected.border) {
        expect(style).toMatchObject({
          borderWidth: 1,
          borderColor: colors[expected.border],
        })
      } else {
        expect(style).not.toHaveProperty("borderWidth")
      }
      expect(view.getByText("Save")).toHaveStyle({
        color: colors[expected.label],
      })
      if (os === "ios") {
        expect(mockSymbolView).toHaveBeenCalledWith(
          expect.objectContaining({ tintColor: colors[expected.label] }),
        )
      } else {
        expect(
          view.getByText(String.fromCodePoint(0xe145), {
            includeHiddenElements: true,
          }),
        ).toHaveStyle({ color: colors[expected.label] })
      }
    })
  })

  it.each([
    ["small", MinTouchTarget, "label"],
    ["medium", MinTouchTarget, "label"],
    ["large", MinTouchTarget + Spacing.two, "headline"],
  ] as const)(
    "keeps the %s size at the touch target",
    async (size: ButtonSize, minHeight, step) => {
      const view = await render(
        <Button
          variant="filled"
          size={size}
          label="Save"
          onPress={jest.fn()}
          testID="button"
        />,
      )
      expect(pressableStyle()).toMatchObject({
        minHeight,
        minWidth: MinTouchTarget,
      })
      expect(view.getByText("Save")).toHaveStyle(TypeRamp[step].style)
      expect(view.getByText("Save")).toHaveProp("numberOfLines", 16)
    },
  )

  it("uses compact horizontal padding on the text variant", async () => {
    await render(
      <Button
        variant="text"
        label="Skip"
        onPress={jest.fn()}
        testID="button"
      />,
    )
    expect(pressableStyle()).toMatchObject({
      paddingHorizontal: Spacing.twoHalf,
    })
  })

  it("is a button named by its label by default", async () => {
    const onPress = jest.fn()
    const view = await render(
      <Button
        variant="filled"
        label="Save"
        onPress={onPress}
        testID="button"
      />,
    )
    const button = view.getByRole("button", { name: "Save" })
    expect(button).toHaveProp("accessibilityState", {
      disabled: false,
      busy: false,
    })
    await fireEvent.press(button)
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it("passes a declared role, label and hint through", async () => {
    const view = await render(
      <Button
        variant="outlined"
        label="ESILV"
        accessibilityLabel="Open the ESILV intranet"
        accessibilityHint="Opens in the browser"
        accessibilityRole="link"
        onPress={jest.fn()}
        testID="button"
      />,
    )
    const link = view.getByRole("link", { name: "Open the ESILV intranet" })
    expect(link).toHaveProp("accessibilityHint", "Opens in the browser")
    expect(view.getByText("ESILV")).toBeTruthy()
  })

  it("blocks activation while disabled", async () => {
    const onPress = jest.fn()
    const view = await render(
      <Button
        variant="filled"
        label="Save"
        onPress={onPress}
        testID="button"
        disabled
      />,
    )
    const button = view.getByTestId("button")
    await fireEvent.press(button)
    expect(onPress).not.toHaveBeenCalled()
    expect(button).toBeDisabled()
    expect(button).toHaveProp("accessibilityState", {
      disabled: true,
      busy: false,
    })
    expect(ripple()).toBeUndefined()
    expect(pressableStyle(true)).toMatchObject({
      opacity: StateOpacity.disabled,
    })
  })

  it("keeps the label as the name while busy", async () => {
    const onPress = jest.fn()
    const view = await render(
      <Button
        variant="filled"
        label="Save"
        onPress={onPress}
        testID="button"
        icon={{ ios: "plus", android: "add" }}
        busy
      />,
    )
    const button = view.getByTestId("button")
    await fireEvent.press(button)
    expect(onPress).not.toHaveBeenCalled()
    expect(button).toHaveProp("accessibilityState", {
      disabled: true,
      busy: true,
    })
    expect(button).toHaveProp("accessibilityLabel", "Save")
    expect(view.getByText("Save")).toBeTruthy()
    const progress = view.getByTestId("button-progress", {
      includeHiddenElements: true,
    })
    expect(progress).toHaveProp("accessible", false)
    expect(progress.parent).toHaveProp("accessibilityElementsHidden", true)
    expect(progress.parent).toHaveProp(
      "importantForAccessibility",
      "no-hide-descendants",
    )
    expect(view.queryByTestId("button-progress")).toBeNull()
    expect(mockSymbolView).not.toHaveBeenCalled()
    expect(
      view.queryByText(String.fromCodePoint(0xe145), {
        includeHiddenElements: true,
      }),
    ).toBeNull()
  })

  it("omits the progress testID without a button testID", async () => {
    const view = await render(
      <Button variant="filled" label="Save" onPress={jest.fn()} busy />,
    )
    expect(view.getByRole("button", { name: "Save" })).toBeTruthy()
  })

  it("gives platform press feedback", async () => {
    await render(
      <Button
        variant="filled"
        label="Save"
        onPress={jest.fn()}
        testID="button"
      />,
    )
    if (os === "ios") {
      expect(pressableStyle(true)).toMatchObject({
        opacity: StateOpacity.pressed,
        borderCurve: "continuous",
      })
      expect(ripple()).toBeUndefined()
    } else {
      expect(pressableStyle(true)).toMatchObject({
        opacity: 1,
        overflow: "hidden",
      })
      expect(ripple()).toEqual({
        color: Colors.light.ripple,
        foreground: true,
      })
    }
    expect(pressableStyle(false)).toMatchObject({ opacity: 1 })
  })

  it("merges the layout style last into one object", async () => {
    const view = await render(
      <Button
        variant="filled"
        label="Save"
        onPress={jest.fn()}
        testID="button"
        style={[{ alignSelf: "flex-end" }, { width: 120 }]}
      />,
    )
    expect(pressableStyle()).toMatchObject({
      alignSelf: "flex-end",
      width: 120,
    })
    const host = view.getByTestId("button").props.style as unknown
    expect(Array.isArray(host)).toBe(false)
    expect(host).toMatchObject({ alignSelf: "flex-end", width: 120 })
  })

  it.each(["leading", "trailing"] as const)(
    "places a %s icon beside the label",
    async (iconPosition) => {
      const view = await render(
        <Button
          variant="text"
          label="Next"
          onPress={jest.fn()}
          testID="button"
          icon={{ ios: "arrow.forward", android: "arrow_forward" }}
          iconPosition={iconPosition}
        />,
      )
      const children = view.getByTestId("button").children
      const labelIndex = children.findIndex(
        (child) => typeof child !== "string" && child.props.children === "Next",
      )
      expect(children).toHaveLength(2)
      expect(labelIndex).toBe(iconPosition === "leading" ? 1 : 0)
    },
  )
})

it("rejects non-layout style keys and a missing variant", () => {
  const props = { label: "Save", onPress: () => {} }
  const elements = [
    <Button
      key="fill"
      variant="filled"
      {...props}
      // @ts-expect-error a fill is the variant's decision
      style={{ backgroundColor: "red" }}
    />,
    <Button
      key="height"
      variant="filled"
      {...props}
      // @ts-expect-error the height is the size's decision
      style={{ minHeight: 1 }}
    />,
    <Button
      key="opacity"
      variant="filled"
      {...props}
      // @ts-expect-error opacity belongs to the state
      style={{ opacity: 1 }}
    />,
    // @ts-expect-error variant is required
    <Button key="variant" {...props} />,
  ]
  expect(elements).toHaveLength(4)
})
