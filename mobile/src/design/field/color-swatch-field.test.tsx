import { fireEvent, render, screen } from "@testing-library/react-native"
import type { Pressable, PressableProps, View } from "react-native"
import { StyleSheet } from "react-native"

import { usePlatform } from "@/test-support/platform"
import { Colors, MinTouchTarget, Radii, StateOpacity } from "@/theme"

import {
  ColorSwatchField,
  type ColorSwatchFieldProps,
} from "./color-swatch-field"

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

beforeEach(() => mockPressableProps.mockClear())

const options = [
  { color: "#E91E63", label: "Pink" },
  { color: "#3F51B5", label: "Indigo" },
  { color: "#009688", label: "Teal" },
] as const

async function renderField(props: Partial<ColorSwatchFieldProps> = {}) {
  const onChange = jest.fn()
  const view = await render(
    <ColorSwatchField
      testID="color"
      label="Color"
      options={options}
      value="#3F51B5"
      onChange={onChange}
      {...props}
    />,
  )
  return { onChange, view }
}

const swatchProps = (color: string) => {
  const props = mockPressableProps.mock.calls
    .map(([call]) => call)
    .filter((call) => call.testID === `color-${color}`)
    .at(-1)
  if (props === undefined) throw new Error(`no swatch for ${color}`)
  return props
}

const swatchStyle = (color: string, pressed = false) => {
  const { style } = swatchProps(color)
  if (typeof style !== "function") throw new Error("expected a style callback")
  return style({ pressed, hovered: false }) as Record<string, unknown>
}

describe("on Android", () => {
  usePlatform("android")

  it("is a radio group of named radios with only the value checked", async () => {
    await renderField()
    expect(
      screen.getByTestId("color-#E91E63").parent?.props.accessibilityRole,
    ).toBe("radiogroup")
    for (const option of options) {
      const swatch = screen.getByTestId(`color-${option.color}`)
      expect(swatch.props.accessibilityRole).toBe("radio")
      expect(swatch.props.accessibilityLabel).toBe(option.label)
      expect(swatch.props.accessibilityState).toEqual({
        checked: option.color === "#3F51B5",
        disabled: false,
      })
    }
  })

  it("ripples inside the circle when enabled", async () => {
    await renderField()
    expect(swatchProps("#E91E63").android_ripple).toEqual({
      color: Colors.light.ripple,
      foreground: true,
    })
    expect(swatchStyle("#E91E63").overflow).toBe("hidden")
    expect(swatchStyle("#E91E63", true).opacity).toBe(1)
  })

  it("draws no ripple when disabled", async () => {
    await renderField({ disabled: true })
    expect(swatchProps("#E91E63").android_ripple).toBeUndefined()
  })
})

describe("on iOS", () => {
  usePlatform("ios")

  it("renders named buttons with the value selected", async () => {
    await renderField()
    for (const option of options) {
      const swatch = screen.getByTestId(`color-${option.color}`)
      expect(swatch.props.accessibilityRole).toBe("button")
      expect(swatch.props.accessibilityLabel).toBe(option.label)
      expect(swatch.props.accessibilityState).toEqual({
        selected: option.color === "#3F51B5",
        disabled: false,
      })
    }
  })

  it("dims while pressed and draws no ripple", async () => {
    await renderField()
    expect(swatchProps("#E91E63").android_ripple).toBeUndefined()
    expect(swatchStyle("#E91E63", true).opacity).toBe(StateOpacity.pressed)
    expect(swatchStyle("#E91E63").opacity).toBe(1)
  })

  it("does not dim a disabled swatch while pressed", async () => {
    await renderField({ disabled: true })
    expect(swatchStyle("#E91E63", true).opacity).toBe(1)
  })
})

describe.each(["ios", "android"] as const)("on %s", (platform) => {
  usePlatform(platform)

  it("reports the pressed option's color verbatim", async () => {
    const { onChange } = await renderField()
    await fireEvent.press(screen.getByTestId("color-#009688"))
    expect(onChange).toHaveBeenCalledWith("#009688")
  })

  it("sizes each swatch as a touch-target circle with no hit slop", async () => {
    await renderField()
    const style = swatchStyle("#E91E63")
    expect(style).toMatchObject({
      width: MinTouchTarget,
      height: MinTouchTarget,
      borderRadius: Radii.pill,
    })
    expect(swatchProps("#E91E63").hitSlop).toBeUndefined()
  })

  it("rings the selected swatch without shifting the unselected ones", async () => {
    await renderField()
    expect(swatchStyle("#3F51B5")).toMatchObject({
      borderColor: Colors.light.text,
      borderWidth: 3,
    })
    expect(swatchStyle("#E91E63")).toMatchObject({
      borderColor: "transparent",
      borderWidth: 3,
    })
  })

  it("ignores presses and marks every swatch disabled", async () => {
    const { onChange } = await renderField({ disabled: true })
    for (const option of options) {
      const swatch = screen.getByTestId(`color-${option.color}`)
      expect(swatch.props.accessibilityState.disabled).toBe(true)
      await fireEvent.press(swatch)
    }
    expect(onChange).not.toHaveBeenCalled()
    expect(
      StyleSheet.flatten(screen.getByTestId("color-label").props.style),
    ).toMatchObject({ opacity: StateOpacity.disabled })
  })

  it("renders the label and the error", async () => {
    await renderField({ error: "Choose a color." })
    expect(screen.getByTestId("color-label")).toHaveTextContent("Color")
    expect(screen.getByTestId("color-error")).toHaveTextContent(
      "Choose a color.",
    )
  })

  it("renders no error by default", async () => {
    await renderField()
    expect(screen.queryByTestId("color-error")).toBeNull()
  })

  it("merges the caller style last", async () => {
    const { view } = await renderField({ style: { marginTop: 7 } })
    const root = view.toJSON() as unknown as { props: { style: unknown } }
    expect(StyleSheet.flatten(root.props.style)).toMatchObject({
      marginTop: 7,
    })
  })
})
