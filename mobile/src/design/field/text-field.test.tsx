import { fireEvent, render, screen } from "@testing-library/react-native"
import { createRef, useState } from "react"
import { AccessibilityInfo, Pressable, StyleSheet } from "react-native"

import { usePlatform } from "@/test-support/platform"
import { Colors, MinTouchTarget, StateOpacity } from "@/theme"

import { FieldInset } from "./field-box"
import { TextField, type TextFieldRef } from "./text-field"

let mockFontScale = 1
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({
    width: 390,
    height: 844,
    scale: 3,
    fontScale: mockFontScale,
  }),
}))

const announce = jest.spyOn(
  AccessibilityInfo,
  "announceForAccessibilityWithOptions",
)

beforeEach(() => {
  mockFontScale = 1
  announce.mockClear()
})

const input = () => screen.getByTestId("name")
const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style)

function ToggleError() {
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>("Too long")
  return (
    <>
      <TextField
        testID="name"
        label="Name"
        error={error}
        value={value}
        onChangeText={setValue}
      />
      <Pressable
        testID="set-other"
        accessibilityRole="button"
        onPress={() => setError("Other")}
      />
      <Pressable
        testID="clear"
        accessibilityRole="button"
        onPress={() => setError(null)}
      />
    </>
  )
}

describe.each(["ios", "android"] as const)("TextField on %s", (os) => {
  usePlatform(os)

  it("shows the label and names the input with it", async () => {
    await render(<TextField testID="name" label="Name" placeholder="Ada" />)
    expect(screen.getByTestId("name-label")).toHaveTextContent("Name")
    expect(input().props.accessibilityLabel).toBe("Name")
    expect(input().props.placeholder).toBe("Ada")
    expect(input().props.accessibilityLabelledBy).toBe(
      os === "android"
        ? screen.getByTestId("name-label").props.nativeID
        : undefined,
    )
  })

  it("lets a fuller accessible name win", async () => {
    await render(
      <TextField testID="name" label="Name" accessibilityLabel="Full name" />,
    )
    expect(input().props.accessibilityLabel).toBe("Full name")
  })

  it("puts the testID on the native input", async () => {
    await render(<TextField testID="name" label="Name" />)
    expect(input().type).toBe("TextInput")
  })

  it.each([
    [{ error: "Bad" }, "Bad"],
    [{ error: "Bad", helper: "Help" }, "Bad. Help"],
    [{ error: "Bad", helper: "Help", hint: "Own" }, "Bad. Help. Own"],
    [{ helper: "Help" }, "Help"],
    [{ hint: "Own" }, "Own"],
    [{}, undefined],
  ])("folds %p into the hint %p", async (props, hint) => {
    await render(<TextField testID="name" label="Name" {...props} />)
    expect(input().props.accessibilityHint).toBe(hint)
  })

  it("hides the helper from assistive technology", async () => {
    await render(<TextField testID="name" label="Name" helper="Help" />)
    expect(screen.queryByTestId("name-helper")).toBeNull()
    const helper = screen.getByTestId("name-helper", {
      includeHiddenElements: true,
    })
    expect(helper).toHaveTextContent("Help")
    expect(helper.props.importantForAccessibility).toBe("no-hide-descendants")
  })

  it("renders the error under the field with the error border", async () => {
    await render(<TextField testID="name" label="Name" error="Too long" />)
    expect(screen.getByTestId("name-error")).toHaveTextContent("Too long")
    expect(screen.getByTestId("name-error").props.accessibilityLiveRegion).toBe(
      os === "android" ? "polite" : undefined,
    )
    expect(flat("name-field").borderColor).toBe(Colors.light.error)
  })

  it("announces an error once while it stays, and again when it changes", async () => {
    await render(<ToggleError />)
    const calls = () => (os === "ios" ? announce.mock.calls.length : 1)
    expect(calls()).toBe(1)
    await fireEvent.changeText(input(), "abc")
    await fireEvent.changeText(input(), "abcd")
    expect(calls()).toBe(1)
    await fireEvent.press(screen.getByTestId("set-other"))
    expect(screen.getByTestId("name-error")).toHaveTextContent("Other")
    if (os === "ios") expect(announce).toHaveBeenCalledTimes(2)
    await fireEvent.press(screen.getByTestId("clear"))
    expect(screen.queryByTestId("name-error")).toBeNull()
    expect(input().props.accessibilityHint).toBeUndefined()
  })

  it("disables the input and dims all but the error", async () => {
    await render(
      <TextField
        testID="name"
        label="Name"
        helper="Shown in the list"
        error="Required"
        disabled
      />,
    )
    expect(input().props.editable).toBe(false)
    expect(input().props.accessibilityState).toEqual({ disabled: true })
    const opacity = (id: string) =>
      StyleSheet.flatten(
        screen.getByTestId(id, { includeHiddenElements: true }).props.style,
      ).opacity
    expect(opacity("name-label")).toBe(StateOpacity.disabled)
    expect(opacity("name-helper")).toBe(StateOpacity.disabled)
    expect(
      StyleSheet.flatten(screen.getByTestId("name-field").parent?.props.style)
        .opacity,
    ).toBe(StateOpacity.disabled)
    expect(opacity("name-error")).toBeUndefined()
    expect(
      StyleSheet.flatten(screen.getByTestId("name-label").parent?.props.style)
        .opacity,
    ).toBeUndefined()
  })

  it("is editable and enabled by default", async () => {
    await render(<TextField testID="name" label="Name" />)
    expect(input().props.editable).toBe(true)
    expect(input().props.accessibilityState).toEqual({ disabled: false })
  })

  it("makes multiline fields top-aligned, newline on Return and at least four lines tall", async () => {
    const view = await render(
      <TextField testID="name" label="Name" multiline />,
    )
    expect(input().props.submitBehavior).toBe("newline")
    expect(input().props.textAlignVertical).toBe("top")
    expect(input().props.clearButtonMode).toBe("never")
    const atOne = flat("name").minHeight as number
    expect(flat("name").height).toBeUndefined()

    mockFontScale = 2
    await view.rerender(<TextField testID="name" label="Name" multiline />)
    expect(flat("name").minHeight as number).toBeGreaterThan(atOne)
    expect(flat("name").height).toBeUndefined()
  })

  it.each([1, 2])(
    "keeps a single-line field unfixed in height at font scale %p",
    async (scale) => {
      mockFontScale = scale
      await render(<TextField testID="name" label="Name" />)
      expect(flat("name").height).toBeUndefined()
      expect(flat("name").minHeight).toBeGreaterThanOrEqual(MinTouchTarget)
      expect(flat("name").lineHeight).toBeUndefined()
      expect(input().props.submitBehavior).toBeUndefined()
    },
  )

  it("passes keyboard and autofill props through", async () => {
    await render(
      <TextField
        testID="name"
        label="Email"
        returnKeyType="next"
        submitBehavior="submit"
        textContentType="emailAddress"
        autoComplete="email"
        keyboardType="email-address"
        maxLength={40}
      />,
    )
    expect(input().props).toMatchObject({
      returnKeyType: "next",
      submitBehavior: "submit",
      textContentType: "emailAddress",
      autoComplete: "email",
      keyboardType: "email-address",
      maxLength: 40,
    })
  })

  it("calls the caller's focus handlers", async () => {
    const onFocus = jest.fn()
    const onBlur = jest.fn()
    await render(
      <TextField
        testID="name"
        label="Name"
        onFocus={onFocus}
        onBlur={onBlur}
      />,
    )
    await fireEvent(input(), "focus")
    await fireEvent(input(), "blur")
    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(onBlur).toHaveBeenCalledTimes(1)
  })

  it("tracks focus without handlers", async () => {
    await render(<TextField testID="name" label="Name" />)
    await fireEvent(input(), "focus")
    await fireEvent(input(), "blur")
    expect(input()).toBeOnTheScreen()
  })

  it("forwards the ref to the native input", async () => {
    const ref = createRef<TextFieldRef>()
    await render(<TextField testID="name" label="Name" ref={ref} />)
    expect(typeof ref.current?.focus).toBe("function")
  })

  it("merges the caller's layout style last", async () => {
    await render(
      <TextField testID="name" label="Name" style={{ marginTop: 99 }} />,
    )
    const root = screen.getByTestId("name-label").parent
    expect(StyleSheet.flatten(root?.props.style).marginTop).toBe(99)
  })

  it("renders without a testID", async () => {
    await render(<TextField label="Name" helper="Help" error="Bad" />)
    expect(screen.getByText("Bad")).toBeOnTheScreen()
  })
})

describe("on iOS", () => {
  usePlatform("ios")

  it("offers the clear button on single-line fields and keeps the border on focus", async () => {
    await render(<TextField testID="name" label="Name" />)
    expect(input().props.clearButtonMode).toBe("while-editing")
    const rest = flat("name-field")
    await fireEvent(input(), "focus")
    expect(flat("name-field")).toEqual(rest)
    expect(rest.borderColor).toBe(Colors.light.outline)
    expect(rest.backgroundColor).toBe(Colors.light.backgroundElement)
  })
})

describe("on Android", () => {
  usePlatform("android")

  const offset = () =>
    (flat("name-field").borderWidth as number) +
    (flat("name").paddingHorizontal as number)

  it("thickens the border to the brand color on focus without moving text", async () => {
    await render(<TextField testID="name" label="Name" />)
    expect(input().props.clearButtonMode).toBe("never")
    expect(flat("name-field")).toMatchObject({
      borderWidth: 1,
      borderColor: Colors.light.outline,
      backgroundColor: "transparent",
    })
    const rest = offset()
    await fireEvent(input(), "focus")
    expect(flat("name-field")).toMatchObject({
      borderWidth: 2,
      borderColor: Colors.light.primary,
    })
    expect(offset()).toBe(rest)
    expect(rest).toBe(FieldInset.horizontal)
  })

  it("keeps the error color when focused", async () => {
    await render(<TextField testID="name" label="Name" error="Bad" />)
    await fireEvent(input(), "focus")
    expect(flat("name-field")).toMatchObject({
      borderWidth: 2,
      borderColor: Colors.light.error,
    })
  })
})

it("rejects a missing label and visual overrides at compile time", () => {
  const typeChecks = [
    // @ts-expect-error a field always has a visible label
    <TextField key="a" />,
    // @ts-expect-error style is layout-only
    <TextField key="b" label="x" style={{ backgroundColor: "red" }} />,
    // @ts-expect-error the field owns its placeholder color
    <TextField key="c" label="x" placeholderTextColor="red" />,
    // @ts-expect-error blurOnSubmit is replaced by submitBehavior
    <TextField key="d" label="x" blurOnSubmit={false} />,
    // @ts-expect-error disabled replaces editable
    <TextField key="e" label="x" editable={false} />,
  ]
  expect(typeChecks).toHaveLength(5)
})
