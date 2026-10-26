import { fireEvent, render, screen } from "@testing-library/react-native"
import {
  type Pressable,
  type PressableProps,
  StyleSheet,
  Text,
} from "react-native"

import { useColorScheme } from "@/hooks/use-color-scheme"
import { useIncreasedContrast } from "@/hooks/use-increased-contrast"
import { usePlatform } from "@/test-support/platform"
import {
  Colors,
  EventFallbackColor,
  MinTouchTarget,
  Radii,
  resolveEventAppearance,
  Spacing,
  StateOpacity,
} from "@/theme"

import {
  EVENT_STRIPE_WIDTH,
  EventSurface,
  type EventSurfaceProps,
  EventSurfaceText,
} from "./event-surface"
import { useEventSurfaceAppearance } from "./event-surface-context"

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn(),
}))
jest.mock("@/hooks/use-increased-contrast", () => ({
  useIncreasedContrast: jest.fn(),
}))

const mockUseColorScheme = useColorScheme as jest.MockedFunction<
  typeof useColorScheme
>
const mockUseIncreasedContrast = useIncreasedContrast as jest.MockedFunction<
  typeof useIncreasedContrast
>

beforeEach(() => {
  mockUseColorScheme.mockReturnValue("light")
  mockUseIncreasedContrast.mockReturnValue(false)
})

const PINK = "#E91E63"

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

function pressableProps(): PressableProps {
  const props = mockPressableProps.mock.calls.at(-1)?.[0]
  if (props === undefined) throw new Error("no Pressable rendered")
  return props
}

function surfaceStyle(pressed = false) {
  const { style } = pressableProps()
  if (typeof style !== "function") throw new Error("expected a style callback")
  return (StyleSheet.flatten(style({ pressed, hovered: false })) ??
    {}) as Record<string, unknown>
}

const stripeStyle = () =>
  StyleSheet.flatten(screen.getByTestId("tile-stripe").props.style) as Record<
    string,
    unknown
  >

function tile(props: Partial<EventSurfaceProps> = {}) {
  return (
    <EventSurface
      eventColor={PINK}
      accessibilityLabel="Lecture, 09:00 – 10:00"
      onPress={jest.fn()}
      testID="tile"
      {...props}
    >
      <EventSurfaceText type="label" numberOfLines={2} testID="title">
        Lecture
      </EventSurfaceText>
      <EventSurfaceText type="callout" numberOfLines={1} testID="time">
        09:00 – 10:00
      </EventSurfaceText>
    </EventSurface>
  )
}

describe.each(["ios", "android"] as const)("EventSurface on %s", (platform) => {
  usePlatform(platform)

  describe.each(["light", "dark"] as const)("in %s", (scheme) => {
    const expected = resolveEventAppearance({
      color: PINK,
      scheme,
      increasedContrast: false,
    })

    beforeEach(() => mockUseColorScheme.mockReturnValue(scheme))

    it("draws the resolved surface, a straight accent stripe and no shadow", async () => {
      await render(tile())
      const root = surfaceStyle()
      expect(root.backgroundColor).toBe(expected.surface)
      expect(root.borderRadius).toBe(Radii.medium)
      expect(root.overflow).toBe("hidden")
      expect(root.borderWidth).toBeUndefined()
      expect(root.borderLeftWidth).toBeUndefined()
      for (const key of [
        "shadowColor",
        "shadowOpacity",
        "shadowRadius",
        "shadowOffset",
        "elevation",
        "boxShadow",
      ]) {
        expect(root[key]).toBeUndefined()
      }
      expect(stripeStyle()).toMatchObject({
        position: "absolute",
        start: 0,
        top: 0,
        bottom: 0,
        width: EVENT_STRIPE_WIDTH,
        backgroundColor: expected.accent,
      })
      expect(EVENT_STRIPE_WIDTH).toBe(3)
    })

    it("draws every line in the resolved foreground", async () => {
      await render(tile())
      for (const id of ["title", "time"]) {
        expect(
          StyleSheet.flatten(screen.getByTestId(id).props.style).color,
        ).toBe(expected.foreground)
      }
    })

    it("outlines the surface under increased contrast", async () => {
      mockUseIncreasedContrast.mockReturnValue(true)
      const contrast = resolveEventAppearance({
        color: PINK,
        scheme,
        increasedContrast: true,
      })
      await render(tile())
      const root = surfaceStyle()
      expect(root.backgroundColor).toBe(contrast.surface)
      expect(root.borderWidth).toBe(2)
      expect(root.borderColor).toBe(contrast.outline)
      expect(stripeStyle().backgroundColor).toBe(contrast.accent)
    })
  })

  it("renders an invalid color as the fallback appearance", async () => {
    await render(tile({ eventColor: "not-a-color" }))
    const fallback = resolveEventAppearance({
      color: EventFallbackColor,
      scheme: "light",
      increasedContrast: false,
    })
    expect(surfaceStyle().backgroundColor).toBe(fallback.surface)
    expect(stripeStyle().backgroundColor).toBe(fallback.accent)
  })

  it("is one button with its label and hint, and lines are not separate elements", async () => {
    await render(tile({ accessibilityHint: "Opens the event" }))
    const root = screen.getByRole("button", { name: "Lecture, 09:00 – 10:00" })
    expect(root.props.testID).toBe("tile")
    expect(root.props.accessible).toBe(true)
    expect(root.props.accessibilityHint).toBe("Opens the event")
    expect(screen.getAllByRole("button")).toHaveLength(1)
    expect(screen.getByTestId("title").props.accessible).toBe(false)
    expect(screen.getByTestId("time").props.accessible).toBe(false)
  })

  it("calls onPress", async () => {
    const onPress = jest.fn()
    await render(tile({ onPress }))
    await fireEvent.press(screen.getByRole("button"))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it("shows the platform's pressed feedback", async () => {
    await render(tile())
    const ripple = pressableProps().android_ripple
    if (platform === "ios") {
      expect(ripple).toBeUndefined()
      expect(surfaceStyle(true).opacity).toBe(StateOpacity.pressed)
    } else {
      expect(ripple).toEqual({
        color: Colors.light.ripple,
        foreground: true,
      })
      expect(surfaceStyle(true).opacity).toBeUndefined()
    }
    expect(surfaceStyle(false).opacity).toBeUndefined()
  })
})

describe("EventSurface geometry", () => {
  it("flows with a minimum touch target and regular padding by default", async () => {
    await render(tile())
    const root = surfaceStyle()
    expect(root.minHeight).toBe(MinTouchTarget)
    expect(root.justifyContent).toBe("center")
    expect(root.position).toBeUndefined()
    expect(root.padding).toBe(Spacing.three)
    expect(root.paddingStart).toBe(Spacing.three + EVENT_STRIPE_WIDTH)
  })

  it("takes the caller's geometry when absolute, with compact padding", async () => {
    await render(
      tile({
        placement: "absolute",
        density: "compact",
        style: { top: 10, left: 20, width: 120, height: 70 },
      }),
    )
    const root = surfaceStyle()
    expect(root).toMatchObject({
      position: "absolute",
      top: 10,
      left: 20,
      width: 120,
      height: 70,
      padding: Spacing.two,
      paddingStart: Spacing.two + EVENT_STRIPE_WIDTH,
    })
    expect(root.minHeight).toBeUndefined()
  })

  it("merges the layout style last", async () => {
    await render(tile({ style: { flex: 1, height: 12 } }))
    expect(surfaceStyle()).toMatchObject({ flex: 1, height: 12 })
  })

  it("renders without a testID", async () => {
    await render(
      <EventSurface
        eventColor={PINK}
        accessibilityLabel="A"
        onPress={jest.fn()}
      >
        <EventSurfaceText numberOfLines={1}>A</EventSurfaceText>
      </EventSurface>,
    )
    expect(screen.getByRole("button", { name: "A" })).toBeOnTheScreen()
  })

  it("provides its appearance to descendants", async () => {
    let seen: unknown
    function Probe() {
      seen = useEventSurfaceAppearance()
      return null
    }
    await render(
      <EventSurface
        eventColor={PINK}
        accessibilityLabel="A"
        onPress={jest.fn()}
      >
        <Probe />
      </EventSurface>,
    )
    expect(seen).toEqual(
      resolveEventAppearance({
        color: PINK,
        scheme: "light",
        increasedContrast: false,
      }),
    )
  })
})

describe("EventSurfaceText", () => {
  it("keeps its line cap and grows with the text size", async () => {
    await render(tile())
    const title = screen.getByTestId("title")
    expect(title.props.numberOfLines).toBe(2)
    expect(title.props.adjustsFontSizeToFit).toBeUndefined()
    expect(title.props.allowFontScaling).not.toBe(false)
    expect(title.props.maxFontSizeMultiplier).toBeUndefined()
  })

  it("throws outside an EventSurface", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined)
    await expect(
      render(<EventSurfaceText numberOfLines={1}>Orphan</EventSurfaceText>),
    ).rejects.toThrow(
      "EventSurfaceText must be rendered inside an EventSurface",
    )
    jest.mocked(console.error).mockRestore()
  })
})

it("rejects a missing label or cap, paint keys, a color and shrink-to-fit", () => {
  const onPress = () => undefined
  const elements = [
    // @ts-expect-error accessibilityLabel is required
    <EventSurface key="a" eventColor={PINK} onPress={onPress}>
      <Text>x</Text>
    </EventSurface>,
    <EventSurface
      key="b"
      eventColor={PINK}
      accessibilityLabel="x"
      onPress={onPress}
      // @ts-expect-error the fill comes from the event color
      style={{ backgroundColor: "#FFFFFF" }}
    >
      <Text>x</Text>
    </EventSurface>,
    <EventSurface
      key="c"
      eventColor={PINK}
      accessibilityLabel="x"
      onPress={onPress}
      // @ts-expect-error an event tile has no shadow
      style={{ shadowOpacity: 0.1 }}
    >
      <Text>x</Text>
    </EventSurface>,
    <EventSurface
      key="d"
      eventColor={PINK}
      accessibilityLabel="x"
      onPress={onPress}
      // @ts-expect-error the radius is fixed
      style={{ borderRadius: 16 }}
    >
      <Text>x</Text>
    </EventSurface>,
    <EventSurface
      key="e"
      eventColor={PINK}
      accessibilityLabel="x"
      onPress={onPress}
      // @ts-expect-error there is no color prop
      color={PINK}
    >
      <Text>x</Text>
    </EventSurface>,
    // @ts-expect-error numberOfLines is required
    <EventSurfaceText key="f">x</EventSurfaceText>,
    // @ts-expect-error a tile line is never clipped mid-glyph
    <EventSurfaceText key="g" numberOfLines={1} ellipsizeMode="clip">
      x
    </EventSurfaceText>,
    // @ts-expect-error tile text never shrinks to fit
    <EventSurfaceText key="h" numberOfLines={1} adjustsFontSizeToFit>
      x
    </EventSurfaceText>,
    // @ts-expect-error the color is the surface foreground
    <EventSurfaceText key="i" numberOfLines={1} tone="secondary">
      x
    </EventSurfaceText>,
  ]
  expect(elements).toHaveLength(9)
})
