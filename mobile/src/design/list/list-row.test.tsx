import { fireEvent, render, within } from "@testing-library/react-native"
import { router } from "expo-router"
import {
  Platform,
  type Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
} from "react-native"

import { Button } from "@/design/button/button"
import { usePlatform } from "@/test-support/platform"
import { Colors, ListGeometry, Spacing, StateOpacity } from "@/theme"

import { ListRow, ListRowSeparator } from "./list-row"
import { listRowPosition } from "./list-row-position"

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }))
jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}))

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
afterEach(() => {
  mockFontScale = 1
})

const mockPressableProps = jest.fn<void, [PressableProps]>()
jest.mock("react-native/Libraries/Components/Pressable/Pressable", () => {
  const { createElement, forwardRef } =
    jest.requireActual<typeof import("react")>("react")
  const Actual = jest.requireActual<{ default: typeof Pressable }>(
    "react-native/Libraries/Components/Pressable/Pressable",
  ).default
  return {
    __esModule: true,
    default: forwardRef<never, PressableProps>((props, ref) => {
      mockPressableProps(props)
      return createElement(Actual, { ...props, ref })
    }),
  }
})
beforeEach(() => mockPressableProps.mockClear())

function pressableProps(testID: string): PressableProps {
  const props = mockPressableProps.mock.calls
    .map(([call]) => call)
    .filter((call) => call.testID === testID)
    .at(-1)
  if (props === undefined) throw new Error(`no Pressable ${testID}`)
  return props
}

function pressableStyle(testID: string, pressed: boolean) {
  const { style } = pressableProps(testID)
  if (typeof style !== "function") throw new Error("expected a style callback")
  return StyleSheet.flatten(style({ pressed, hovered: false })) ?? {}
}

const theme = Colors.light

function flat(element: { props: { style?: unknown } }): TextStyle {
  return StyleSheet.flatten(element.props.style as StyleProp<TextStyle>) ?? {}
}

describe.each(["ios", "android"] as const)("ListRow on %s", (platform) => {
  usePlatform(platform)
  const ios = platform === "ios"
  const geometry = ios ? ListGeometry.ios : ListGeometry.android

  it("takes its minimum height and padding from ListGeometry", async () => {
    await render(<ListRow label="Row" onPress={jest.fn()} testID="row" />)
    const style = pressableStyle("row", false)
    expect(style.minHeight).toBe(geometry.rowMinHeight)
    expect(style.paddingVertical).toBe(geometry.rowPaddingVertical)
    expect(style.paddingHorizontal).toBe(ListGeometry.rowPaddingHorizontal)
  })

  it("draws no surface on a plain row and uses the theme text colors", async () => {
    const view = await render(
      <ListRow label="Plain" subtitle="Sub" onPress={jest.fn()} testID="row" />,
    )
    const container = view.getByTestId("row").parent!
    expect(flat(container).backgroundColor).toBeUndefined()
    expect(flat(view.getByText("Plain")).color).toBe(theme.text)
    expect(flat(view.getByText("Sub")).color).toBe(theme.textSecondary)
  })

  it("fills a grouped row with the list palette", async () => {
    const view = await render(
      <ListRow
        label="Grouped"
        subtitle="Sub"
        position="single"
        onPress={jest.fn()}
        testID="row"
      />,
    )
    const container = flat(view.getByTestId("row").parent!)
    expect(container.backgroundColor).toBe(
      ios ? theme.backgroundElement : "#surfaceContainer",
    )
    expect(flat(view.getByText("Grouped")).color).toBe(
      ios ? theme.text : "#onSurface",
    )
    expect(flat(view.getByText("Sub")).color).toBe(
      ios ? theme.textSecondary : "#onSurfaceVariant",
    )
  })

  it("activates through onPress and pushes an href", async () => {
    const onPress = jest.fn()
    const view = await render(
      <>
        <ListRow label="Act" onPress={onPress} testID="act" />
        <ListRow label="Go" href="/about" testID="go" />
      </>,
    )
    await fireEvent.press(view.getByTestId("act"))
    await fireEvent.press(view.getByTestId("go"))
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(router.push).toHaveBeenCalledWith("/about")
  })

  it("gives press feedback in the platform idiom", async () => {
    await render(<ListRow label="Press" onPress={jest.fn()} testID="row" />)
    if (ios) {
      expect(pressableStyle("row", true).backgroundColor).toBe(
        theme.backgroundSelected,
      )
      expect(pressableProps("row").android_ripple).toBeUndefined()
    } else {
      expect(pressableStyle("row", true).backgroundColor).toBeUndefined()
      expect(pressableProps("row").android_ripple).toEqual({
        color: theme.ripple,
        foreground: true,
      })
    }
    expect(pressableStyle("row", false).backgroundColor).toBeUndefined()
  })

  it("dims and blocks a disabled row", async () => {
    const onPress = jest.fn()
    const view = await render(
      <ListRow label="Off" disabled onPress={onPress} testID="row" />,
    )
    const row = view.getByTestId("row")
    await fireEvent.press(row)
    expect(onPress).not.toHaveBeenCalled()
    expect(pressableStyle("row", false).opacity).toBe(StateOpacity.disabled)
    expect(flat(row.parent!).opacity).toBeUndefined()
    expect(row.props.accessibilityState).toEqual({
      selected: false,
      disabled: true,
    })
    expect(pressableProps("row").android_ripple).toBeUndefined()
    expect(pressableStyle("row", true).backgroundColor).toBeUndefined()
  })

  it("composes the accessible name from overline, label, subtitle and details", async () => {
    const view = await render(
      <ListRow
        label="Title"
        subtitle="Time"
        details={["One", "Two"]}
        overline={{ text: "New", tone: "positive" }}
        value="Value"
        hint="Opens it"
        onPress={jest.fn()}
        testID="row"
      />,
    )
    const row = view.getByRole("button", { name: "New, Title, Time, One, Two" })
    expect(row.props.accessibilityValue).toEqual({ text: "Value" })
    expect(row.props.accessibilityHint).toBe("Opens it")
    expect(flat(view.getByText("New")).color).toBe(theme.positive)
  })

  it("prefers an explicit accessibility label and derives selected state", async () => {
    const view = await render(
      <ListRow
        label="Paris"
        accessibilityLabel="Paris, France"
        selected
        onPress={jest.fn()}
        testID="row"
      />,
    )
    const row = view.getByRole("button", { name: "Paris, France" })
    expect(row.props.accessibilityState).toEqual({
      selected: true,
      disabled: false,
    })
    expect(row.props.accessibilityHint).toBeUndefined()
    expect(row.props.accessibilityValue?.text).toBeUndefined()
  })

  it("groups a static row's text into one element and keeps its accessory reachable", async () => {
    const onAccessory = jest.fn()
    const view = await render(
      <ListRow
        label="Course"
        subtitle="Room"
        value="3"
        testID="row"
        trailing={
          <Button
            variant="text"
            size="small"
            label="Unhide"
            onPress={onAccessory}
            testID="accessory"
          />
        }
      />,
    )
    expect(view.getByTestId("row").props.accessibilityRole).toBeUndefined()
    expect(view.queryAllByRole("button")).toHaveLength(1)
    const text = view.getByLabelText("Course, Room")
    expect(text.props.accessible).toBe(true)
    expect(text.props.accessibilityValue).toEqual({ text: "3" })
    const trailing = view.getByText("3", {
      includeHiddenElements: true,
    }).parent!
    expect(trailing.props.importantForAccessibility).toBe("no-hide-descendants")
    expect(flat(trailing)).toMatchObject({
      maxWidth: "45%",
      marginStart: Spacing.two,
    })
    await fireEvent.press(view.getByTestId("accessory"))
    expect(onAccessory).toHaveBeenCalledTimes(1)
  })

  it("draws the chevron on iOS only and the check on both after the value", async () => {
    const view = await render(
      <>
        <ListRow label="Nav" trailing="chevron" href="/about" testID="nav" />
        <ListRow
          label="Pick"
          value="+01:00"
          selected
          onPress={jest.fn()}
          testID="pick"
        />
      </>,
    )
    if (ios) {
      expect(
        view.getByTestId("nav-chevron", { includeHiddenElements: true }),
      ).toBeOnTheScreen()
    } else {
      expect(
        view.queryByTestId("nav-chevron", { includeHiddenElements: true }),
      ).toBeNull()
    }
    const check = view.getByTestId("pick-check", {
      includeHiddenElements: true,
    })
    const value = view.getByText("+01:00", { includeHiddenElements: true })
    const gap = ios
      ? ListGeometry.ios.trailingGap
      : ListGeometry.android.trailingGap
    expect(flat(value.parent!)).toMatchObject({ marginEnd: gap })
    const children = check.parent!.children as unknown[]
    expect(children.indexOf(check)).toBeGreaterThan(
      children.findIndex(
        (child) => typeof child !== "string" && child === value,
      ),
    )
  })

  it("spaces the value from a chevron on iOS and leaves a bare value flush", async () => {
    const view = await render(
      <>
        <ListRow
          label="Language"
          value="English"
          trailing="chevron"
          onPress={jest.fn()}
          testID="language"
        />
        <ListRow label="Count" value="3" onPress={jest.fn()} testID="count" />
      </>,
    )
    const language = flat(
      view.getByText("English", { includeHiddenElements: true }).parent!,
    )
    if (ios) {
      expect(language.marginEnd).toBe(ListGeometry.ios.trailingGap)
    } else {
      expect(language.marginEnd).toBeUndefined()
    }
    expect(
      flat(view.getByText("3", { includeHiddenElements: true }).parent!)
        .marginEnd,
    ).toBeUndefined()
  })

  it("hides the leading element and icon from assistive technology", async () => {
    const view = await render(
      <>
        <ListRow
          label="Element"
          leading={{ element: <Text testID="swatch">x</Text>, width: 24 }}
          onPress={jest.fn()}
          testID="element"
        />
        <ListRow
          label="Icon"
          leading={{ icon: { ios: "info.circle", android: "today" } }}
          onPress={jest.fn()}
          testID="icon"
        />
      </>,
    )
    const box = view.getByTestId("swatch", {
      includeHiddenElements: true,
    }).parent!
    expect(box.props.importantForAccessibility).toBe("no-hide-descendants")
    expect(box.props.accessibilityElementsHidden).toBe(true)
    expect(flat(box).width).toBe(24)
  })

  it("caps every text line", async () => {
    const view = await render(
      <ListRow
        label="Label"
        subtitle="Sub"
        details={["Detail"]}
        overline={{ text: "Over", tone: "informational" }}
        value="Value"
        onPress={jest.fn()}
        testID="row"
      />,
    )
    expect(view.getByText("Label").props.numberOfLines).toBe(8)
    expect(view.getByText("Sub").props.numberOfLines).toBe(8)
    expect(view.getByText("Detail").props.numberOfLines).toBe(8)
    expect(view.getByText("Value").props.numberOfLines).toBe(4)
    expect(view.getByText("Over").props.numberOfLines).toBe(2)
    for (const text of ["Label", "Sub", "Detail", "Value", "Over"]) {
      expect(view.getByText(text).props.ellipsizeMode).not.toBe("clip")
    }
  })

  it("stacks the value under the label at accessibility sizes", async () => {
    const render1 = await render(
      <ListRow label="Zone" value="+01:00" onPress={jest.fn()} testID="row" />,
    )
    const trailing = render1.getByText("+01:00").parent!
    expect(flat(trailing).maxWidth).toBe("45%")
    expect(trailing.parent!.props.testID).toBe("row")
    await render1.unmount()

    mockFontScale = 3.571
    const large = await render(
      <ListRow label="Zone" value="+01:00" onPress={jest.fn()} testID="row" />,
    )
    expect(large.getByText("+01:00").parent!.props.testID).toBeUndefined()
    expect(large.getByText("+01:00").parent!.parent!.props.testID).not.toBe(
      "row",
    )
    expect(large.getByText("Zone").props.numberOfLines).toBe(1)
    expect(large.getByText("Zone").props.adjustsFontSizeToFit).toBe(true)
    expect(large.getByText("Zone").props.minimumFontScale).toBe(0.5)
  })

  it("keeps a static accessory beside the text at standard sizes", async () => {
    const onAccessory = jest.fn()
    const view = await render(
      <ListRow
        label="Seminar demo"
        testID="row"
        trailing={
          <Button
            variant="text"
            size="small"
            label="Un-hide"
            onPress={onAccessory}
            testID="accessory"
          />
        }
      />,
    )
    const text = view.getByLabelText("Seminar demo")
    expect(text.parent!.props.testID).toBe("row")
    expect(flat(view.getByTestId("accessory").parent!)).toMatchObject({
      marginStart: Spacing.two,
    })
  })

  it("stacks a static accessory under the text at accessibility sizes", async () => {
    mockFontScale = 3.571
    const onAccessory = jest.fn()
    const view = await render(
      <ListRow
        label="Seminar demo"
        value="3"
        testID="row"
        trailing={
          <Button
            variant="text"
            size="small"
            label="Un-hide"
            onPress={onAccessory}
            testID="accessory"
          />
        }
      />,
    )
    const text = view.getByLabelText("Seminar demo")
    expect(text.props.accessible).toBe(true)
    expect(text.props.accessibilityValue).toEqual({ text: "3" })
    expect(within(text).queryByTestId("accessory")).toBeNull()
    const accessorySlot = view.getByTestId("accessory").parent!
    expect(flat(accessorySlot)).toMatchObject({ alignSelf: "flex-start" })
    const column = accessorySlot.parent!
    expect(column).toBe(text.parent)
    expect(flat(column)).toMatchObject({ flex: 1 })
    expect(column.parent!.props.testID).toBe("row")
    expect(view.queryAllByRole("button")).toHaveLength(1)
    await fireEvent.press(view.getByTestId("accessory"))
    expect(onAccessory).toHaveBeenCalledTimes(1)
  })

  it("stacks an accessory-only row without an empty trailing line", async () => {
    mockFontScale = 3.571
    const view = await render(
      <ListRow
        label="Seminar demo"
        testID="row"
        trailing={<Text testID="accessory">Un-hide</Text>}
      />,
    )
    const text = view.getByLabelText("Seminar demo")
    expect(view.getByTestId("accessory").parent!.parent).toBe(text.parent)
    expect(text.children).toEqual([view.getByText("Seminar demo")])
  })

  it("keeps a null trailing row unstacked at accessibility sizes", async () => {
    mockFontScale = 3.571
    const view = await render(
      <ListRow label="Seminar demo" testID="row" trailing={null!} />,
    )
    const text = view.getByLabelText("Seminar demo")
    expect(text.parent!.props.testID).toBe("row")
    expect(flat(text)).toMatchObject({ flex: 1 })
  })

  it("wraps a multi-word label at accessibility sizes", async () => {
    mockFontScale = 3.571
    const view = await render(
      <ListRow label="Two words" onPress={jest.fn()} testID="row" />,
    )
    expect(view.getByText("Two words").props.numberOfLines).toBe(8)
    expect(
      view.getByText("Two words").props.adjustsFontSizeToFit,
    ).toBeUndefined()
  })

  it("paints a destructive label", async () => {
    const view = await render(
      <ListRow label="Delete" destructive onPress={jest.fn()} testID="row" />,
    )
    expect(flat(view.getByText("Delete")).color).toBe(theme.destructive)
  })

  it("draws ListRowSeparator only on iOS", async () => {
    const view = await render(<ListRowSeparator leadingWidth={40} />)
    expect(view.toJSON() === null).toBe(!ios)
  })
})

describe("grouped ListRow geometry on android", () => {
  usePlatform("android")

  it.each([
    ["first", 20, 4, 2],
    ["middle", 4, 4, 2],
    ["last", 4, 20, 0],
    ["single", 20, 20, 0],
  ] as const)("%s row corners and gap", async (position, top, bottom, gap) => {
    const view = await render(
      <ListRow
        label="Row"
        position={position}
        onPress={jest.fn()}
        testID="row"
      />,
    )
    const container = flat(view.getByTestId("row").parent!)
    expect(container.borderTopLeftRadius).toBe(top)
    expect(container.borderBottomRightRadius).toBe(bottom)
    expect(container.marginBottom).toBe(gap)
    expect(container.overflow).toBe("hidden")
    expect(
      view.queryByTestId("row-separator", { includeHiddenElements: true }),
    ).toBeNull()
  })

  it("draws a flat leading icon in the secondary palette color", async () => {
    const view = await render(
      <ListRow
        label="Icon"
        leading={{ icon: { ios: "info.circle", android: "today" } }}
        position="single"
        onPress={jest.fn()}
        testID="row"
      />,
    )
    expect(view.getByTestId("row")).toBeOnTheScreen()
  })
})

describe("grouped ListRow geometry on ios", () => {
  usePlatform("ios")
  let versionSpy: jest.SpyInstance | undefined
  afterEach(() => {
    versionSpy?.mockRestore()
    versionSpy = undefined
  })

  it.each([
    ["26.0", 26],
    ["18.4", 10],
  ])("rounds the group at iOS %s with radius %d", async (version, radius) => {
    versionSpy = jest.spyOn(Platform, "Version", "get").mockReturnValue(version)
    const view = await render(
      <>
        <ListRow label="A" position="first" onPress={jest.fn()} testID="a" />
        <ListRow label="B" position="last" onPress={jest.fn()} testID="b" />
      </>,
    )
    const first = flat(view.getByTestId("a").parent!)
    const last = flat(view.getByTestId("b").parent!)
    expect(first.borderTopLeftRadius).toBe(radius)
    expect(first.borderBottomLeftRadius).toBe(0)
    expect(last.borderBottomRightRadius).toBe(radius)
    expect(last.borderTopRightRadius).toBe(0)
  })

  it("separates grouped rows on iOS except the last, inset to the text", async () => {
    const view = await render(
      <>
        <ListRow label="A" position="first" onPress={jest.fn()} testID="a" />
        <ListRow
          label="B"
          position="middle"
          leading={{ element: <Text>x</Text>, width: 40 }}
          onPress={jest.fn()}
          testID="b"
        />
        <ListRow label="C" position="last" onPress={jest.fn()} testID="c" />
      </>,
    )
    expect(
      flat(view.getByTestId("a-separator", { includeHiddenElements: true }))
        .paddingStart,
    ).toBe(16)
    expect(
      flat(view.getByTestId("b-separator", { includeHiddenElements: true }))
        .paddingStart,
    ).toBe(16 + 40 + 16)
    expect(
      view.queryByTestId("c-separator", { includeHiddenElements: true }),
    ).toBeNull()
  })

  it("draws the iOS leading icon tile", async () => {
    const view = await render(
      <ListRow
        label="Icon"
        leading={{ icon: { ios: "info.circle", android: "today" } }}
        onPress={jest.fn()}
        testID="row"
      />,
    )
    expect(view.getByTestId("row")).toBeOnTheScreen()
  })
})

describe("listRowPosition", () => {
  it.each([
    [0, 1, "single"],
    [0, 3, "first"],
    [1, 3, "middle"],
    [2, 3, "last"],
  ] as const)("index %d of %d is %s", (index, count, position) => {
    expect(listRowPosition(index, count)).toBe(position)
  })
})

describe("ListRow props", () => {
  it("rejects invalid combinations at compile time", () => {
    const rows = [
      // @ts-expect-error an accessory cannot sit inside a pressable row
      <ListRow
        key="a"
        label="A"
        testID="a"
        onPress={() => {}}
        trailing={<Text />}
      />,
      // @ts-expect-error a row activates through onPress or href, not both
      <ListRow key="b" label="B" testID="b" onPress={() => {}} href="/about" />,
      <ListRow
        key="c"
        label="C"
        testID="c"
        onPress={() => {}}
        // @ts-expect-error style takes layout keys only
        style={{ backgroundColor: "red" }}
      />,
      // @ts-expect-error a hint needs an activation
      <ListRow key="d" label="D" testID="d" hint="Opens" />,
    ]
    expect(rows).toHaveLength(4)
  })
})
