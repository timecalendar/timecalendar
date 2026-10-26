import { render, screen } from "@testing-library/react-native"
import { StyleSheet } from "react-native"

import { EventSurface } from "@/design/event-surface/event-surface"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { usePlatform } from "@/test-support/platform"
import {
  Colors,
  Radii,
  resolveEventAppearance,
  Spacing,
  type ThemeColor,
  TypeRamp,
} from "@/theme"

import { Badge, type BadgeTone } from "./badge"

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn(),
}))

const mockSymbolView = jest.fn()
jest.mock("expo-symbols", () => ({
  SymbolView: (props: { testID?: string }) => {
    mockSymbolView(props)
    const { createElement } =
      jest.requireActual<typeof import("react")>("react")
    const { View } =
      jest.requireActual<typeof import("react-native")>("react-native")
    return createElement(View, { testID: props.testID })
  },
}))

jest.mock("expo-font", () => ({ useFonts: () => [true, null] }))

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

const mockUseColorScheme = useColorScheme as jest.MockedFunction<
  typeof useColorScheme
>

beforeEach(() => {
  mockUseColorScheme.mockReturnValue("light")
  mockSymbolView.mockClear()
  mockFontScale = 1
})

const styleOf = (testID: string) =>
  StyleSheet.flatten(
    screen.getByTestId(testID, { includeHiddenElements: true }).props.style,
  ) as Record<string, unknown>

const appearance: [
  BadgeTone,
  { fill?: ThemeColor; stroke?: ThemeColor; label: ThemeColor },
][] = [
  ["brand", { fill: "primarySoft", label: "onPrimarySoft" }],
  ["neutral", { fill: "backgroundElement", label: "textSecondary" }],
  ["positive", { stroke: "positive", label: "positive" }],
  ["informational", { stroke: "informational", label: "informational" }],
  ["destructive", { stroke: "destructive", label: "destructive" }],
]

describe.each(["ios", "android"] as const)("Badge on %s", (platform) => {
  usePlatform(platform)

  describe.each(["light", "dark"] as const)("in %s", (scheme) => {
    it.each(appearance)(
      "draws the %s tone from the scheme's tokens",
      async (tone, { fill, stroke, label }) => {
        mockUseColorScheme.mockReturnValue(scheme)
        await render(
          <Badge label="4" tone={tone} accessibilityLabel="4" testID="b" />,
        )
        const root = styleOf("b")
        expect(root.backgroundColor).toBe(
          fill === undefined ? undefined : Colors[scheme][fill],
        )
        expect(root.borderColor).toBe(
          stroke === undefined ? undefined : Colors[scheme][stroke],
        )
        expect(root.borderWidth).toBe(stroke === undefined ? undefined : 1)
        expect(styleOf("b-label").color).toBe(Colors[scheme][label])
      },
    )
  })

  it.each([
    ["small", "caption", Spacing.two, Spacing.half],
    ["medium", "label", Spacing.twoHalf, Spacing.one],
  ] as const)(
    "maps the %s size to the %s type and its padding",
    async (size, type, horizontal, vertical) => {
      await render(
        <Badge
          label="4"
          tone="neutral"
          size={size}
          accessibilityLabel="4"
          testID="b"
        />,
      )
      expect(styleOf("b")).toMatchObject({
        paddingHorizontal: horizontal,
        paddingVertical: vertical,
        borderRadius: Radii.pill,
      })
      expect(styleOf("b-label").fontSize).toBe(TypeRamp[type].style.fontSize)
    },
  )

  it("defaults to the medium size", async () => {
    await render(
      <Badge label="4" tone="neutral" accessibilityLabel="4" testID="b" />,
    )
    expect(styleOf("b-label").fontSize).toBe(TypeRamp.label.style.fontSize)
  })

  it("wraps to two lines and never shrinks the label", async () => {
    await render(
      <Badge label="4" tone="brand" accessibilityLabel="4" testID="b" />,
    )
    const label = screen.getByTestId("b-label")
    expect(label.props.numberOfLines).toBe(2)
    expect(label.props.adjustsFontSizeToFit).toBeUndefined()
    expect(label.props.ellipsizeMode).toBeUndefined()
    expect(styleOf("b-label").textAlign).toBe("center")
    expect(styleOf("b").height).toBeUndefined()
  })

  it("draws no icon without one", async () => {
    await render(
      <Badge label="4" tone="brand" accessibilityLabel="4" testID="b" />,
    )
    expect(
      screen.queryByTestId("b-icon", { includeHiddenElements: true }),
    ).toBeNull()
  })

  it.each([1, 3])(
    "scales the icon with the text at font scale %s",
    async (fontScale) => {
      mockFontScale = fontScale
      await render(
        <Badge
          label="2/5"
          tone="positive"
          icon={{ ios: "checkmark.square.fill", android: "check_box" }}
          accessibilityLabel={null}
          testID="b"
        />,
      )
      const base = TypeRamp.label.style.fontSize as number
      if (platform === "ios") {
        expect(mockSymbolView).toHaveBeenLastCalledWith(
          expect.objectContaining({
            size: base * fontScale,
            tintColor: Colors.light.positive,
          }),
        )
      } else {
        expect(styleOf("b-icon").width).toBe(base * fontScale)
      }
    },
  )

  it("is one text element named by its accessibility label", async () => {
    await render(
      <Badge
        label="2/5"
        tone="informational"
        accessibilityLabel="2 of 5 checklist items completed"
        testID="b"
      />,
    )
    const badge = screen.getByRole("text", {
      name: "2 of 5 checklist items completed",
    })
    expect(badge.props.testID).toBe("b")
    expect(badge.props.accessible).toBe(true)
    expect(badge).toContainElement(screen.getByText("2/5"))
  })

  it("is hidden from assistive technology with a null label", async () => {
    await render(
      <Badge
        label="2/5"
        tone="positive"
        accessibilityLabel={null}
        testID="b"
      />,
    )
    expect(screen.queryByTestId("b")).toBeNull()
    const root = screen.getByTestId("b", { includeHiddenElements: true })
    expect(root.props.accessibilityElementsHidden).toBe(true)
    expect(root.props.importantForAccessibility).toBe("no-hide-descendants")
  })

  it("applies the layout style last", async () => {
    await render(
      <Badge
        label="4"
        tone="brand"
        accessibilityLabel="4"
        testID="b"
        style={{ alignSelf: "center", marginTop: Spacing.one }}
      />,
    )
    expect(styleOf("b")).toMatchObject({
      alignSelf: "center",
      marginTop: Spacing.one,
    })
  })

  it("renders without a testID", async () => {
    await render(
      <Badge
        label="Beta"
        tone="brand"
        icon={{ ios: "bolt" }}
        accessibilityLabel="Beta version"
      />,
    )
    expect(screen.getByRole("text", { name: "Beta version" })).toBeOnTheScreen()
  })
})

describe.each(["light", "dark"] as const)(
  "onEventSurface tone in %s",
  (scheme) => {
    it("draws its outline and label in the surface foreground", async () => {
      mockUseColorScheme.mockReturnValue(scheme)
      await render(
        <EventSurface
          eventColor="#E91E63"
          accessibilityLabel="Lecture"
          onPress={jest.fn()}
        >
          <Badge
            label="2/5"
            tone="onEventSurface"
            accessibilityLabel={null}
            testID="b"
          />
        </EventSurface>,
      )
      const { foreground } = resolveEventAppearance({
        color: "#E91E63",
        scheme,
        increasedContrast: false,
      })
      const root = styleOf("b")
      expect(root.borderWidth).toBe(1)
      expect(root.borderColor).toBe(foreground)
      expect(root.backgroundColor).toBeUndefined()
      expect(styleOf("b-label").color).toBe(foreground)
    })
  },
)

it("throws for the onEventSurface tone outside an event surface", async () => {
  const consoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => undefined)
  try {
    await expect(
      render(
        <Badge label="2/5" tone="onEventSurface" accessibilityLabel={null} />,
      ),
    ).rejects.toThrow("inside an EventSurface")
  } finally {
    consoleError.mockRestore()
  }
})

it("rejects a missing accessibility choice, a color and a font style", () => {
  const elements = [
    // @ts-expect-error the accessibility choice is required
    <Badge key="a" label="4" tone="brand" />,
    <Badge
      key="b"
      label="4"
      tone="brand"
      accessibilityLabel="4"
      // @ts-expect-error a badge takes no color
      color="#f00"
    />,
    <Badge
      key="c"
      label="4"
      tone="brand"
      accessibilityLabel="4"
      // @ts-expect-error a badge style takes layout keys only
      style={{ fontSize: 30 }}
    />,
  ]
  expect(elements).toHaveLength(3)
})
