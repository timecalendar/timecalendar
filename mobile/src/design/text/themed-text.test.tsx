import { render } from "@testing-library/react-native"
import { StyleSheet } from "react-native"

import { useColorScheme } from "@/hooks/use-color-scheme"
import { Colors, type ThemeColor, TypeRamp, type TypeVariant } from "@/theme"

import { type TextTone, ThemedText, type ThemedTextType } from "./themed-text"

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn(),
}))

const mockUseColorScheme = useColorScheme as jest.MockedFunction<
  typeof useColorScheme
>

beforeEach(() => mockUseColorScheme.mockReturnValue("light"))

const expectations: Record<
  ThemedTextType,
  { step: TypeVariant; heading: boolean }
> = {
  largeTitle: { step: "largeTitle", heading: true },
  title: { step: "title", heading: true },
  title2: { step: "title2", heading: true },
  sectionTitle: { step: "sectionTitle", heading: true },
  headline: { step: "headline", heading: false },
  body: { step: "body", heading: false },
  callout: { step: "callout", heading: false },
  label: { step: "label", heading: false },
  footnote: { step: "footnote", heading: false },
  caption: { step: "caption", heading: false },
  captionSmall: { step: "captionSmall", heading: false },
  default: { step: "body", heading: false },
  small: { step: "callout", heading: false },
  smallBold: { step: "label", heading: false },
  subtitle: { step: "sectionTitle", heading: true },
}

const tones: Record<TextTone, ThemeColor> = {
  primary: "text",
  secondary: "textSecondary",
  action: "actionText",
  destructive: "destructive",
  onPrimary: "onPrimary",
}

describe("ThemedText", () => {
  // Smoke test: proves the jest-expo harness transforms RN/Expo modules and that
  // React Native Testing Library can render and query a real component.
  it("renders its children as text", async () => {
    const { getByText } = await render(
      <ThemedText>Hello from the harness</ThemedText>,
    )

    expect(getByText("Hello from the harness")).toBeTruthy()
  })

  it.each(
    Object.entries(expectations) as [
      ThemedTextType,
      { step: TypeVariant; heading: boolean },
    ][],
  )(
    "renders type=%s as its ramp step and heading role",
    async (type, { step, heading }) => {
      const { getByText, queryByRole } = await render(
        <ThemedText type={type}>Text</ThemedText>,
      )
      const node = getByText("Text")

      if (heading) {
        expect(queryByRole("header")).not.toBeNull()
      } else {
        expect(queryByRole("header")).toBeNull()
      }
      expect(StyleSheet.flatten(node.props.style)).toMatchObject(
        TypeRamp[step].style,
      )
      expect(node.props.dynamicTypeRamp).toBe(TypeRamp[step].dynamicTypeRamp)
    },
  )

  it("renders the body step with no header role when no type is given", async () => {
    const { getByText, queryByRole } = await render(
      <ThemedText>Body</ThemedText>,
    )

    expect(queryByRole("header")).toBeNull()
    expect(StyleSheet.flatten(getByText("Body").props.style)).toMatchObject({
      ...TypeRamp.body.style,
      color: Colors.light.text,
    })
    expect(getByText("Body").props.dynamicTypeRamp).toBe(
      TypeRamp.body.dynamicTypeRamp,
    )
  })

  it.each(Object.entries(tones) as [TextTone, ThemeColor][])(
    "colors tone=%s with the light %s token",
    async (tone, token) => {
      const { getByText } = await render(
        <ThemedText tone={tone}>Toned</ThemedText>,
      )

      expect(StyleSheet.flatten(getByText("Toned").props.style).color).toBe(
        Colors.light[token],
      )
    },
  )

  it("colors a tone with its dark token under the dark scheme", async () => {
    mockUseColorScheme.mockReturnValue("dark")
    const { getByText } = await render(
      <ThemedText tone="action">Dark</ThemedText>,
    )

    expect(StyleSheet.flatten(getByText("Dark").props.style).color).toBe(
      Colors.dark.actionText,
    )
  })

  it("still resolves themeColor", async () => {
    const { getByText } = await render(
      <ThemedText themeColor="textSecondary">Legacy</ThemedText>,
    )

    expect(StyleSheet.flatten(getByText("Legacy").props.style).color).toBe(
      Colors.light.textSecondary,
    )
  })

  it("lets a caller style win over the ramp", async () => {
    const { getByText } = await render(
      <ThemedText type="title" style={{ fontSize: 30 }}>
        Sized
      </ThemedText>,
    )

    expect(StyleSheet.flatten(getByText("Sized").props.style)).toMatchObject({
      fontSize: 30,
      lineHeight: TypeRamp.title.style.lineHeight,
    })
  })

  it("lets a caller-supplied accessibilityRole win over the header default", async () => {
    const { getByRole, queryByRole } = await render(
      <ThemedText type="title" accessibilityRole="summary">
        Title
      </ThemedText>,
    )

    expect(getByRole("summary")).toBeTruthy()
    expect(queryByRole("header")).toBeNull()
  })

  it("lets a caller-supplied dynamicTypeRamp win over the step's ramp", async () => {
    const { getByText } = await render(
      <ThemedText type="body" dynamicTypeRamp="caption2">
        Ramp
      </ThemedText>,
    )

    expect(getByText("Ramp").props.dynamicTypeRamp).toBe("caption2")
  })

  it("rejects tones and types outside the closed unions", () => {
    const probes = [
      // @ts-expect-error brand pink is not a tone
      <ThemedText key="brand" tone="brand" />,
      // @ts-expect-error the decorative tertiary token is not a text tone
      <ThemedText key="tertiary" tone="tertiary" />,
      // @ts-expect-error unknown ramp step
      <ThemedText key="huge" type="huge" />,
      // @ts-expect-error tone and themeColor are mutually exclusive
      <ThemedText key="both" tone="secondary" themeColor="text" />,
    ]

    expect(probes).toHaveLength(4)
  })
})
