import { render, screen } from "@testing-library/react-native"
import type { ReactNode } from "react"
import { StyleSheet } from "react-native"

import { EventSurface } from "@/design"
import i18n from "@/i18n"
import { Colors, resolveEventAppearance } from "@/theme"

import {
  ChecklistProgressIndicator,
  checklistProgressLabel,
} from "./checklist-progress-indicator"

let mockScheme: "light" | "dark" = "light"
jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => mockScheme,
}))

const partial = { completed: 1, total: 3, isComplete: false }
const complete = { completed: 3, total: 3, isComplete: true }

describe("ChecklistProgressIndicator", () => {
  beforeEach(() => {
    mockScheme = "light"
  })

  it("omits zero or absent progress", async () => {
    const view = await render(
      <ChecklistProgressIndicator
        progress={{ completed: 0, total: 0, isComplete: false }}
      />,
    )
    expect(view.toJSON()).toBeNull()
  })

  const hidden = { includeHiddenElements: true }
  const styleOf = (testID: string) =>
    StyleSheet.flatten(screen.getByTestId(testID, hidden).props.style)

  it("renders partial inline progress as an informational badge out of the accessibility tree", async () => {
    await render(<ChecklistProgressIndicator progress={partial} />)

    const indicator = screen.getByTestId("checklist-progress-inline", hidden)
    expect(screen.queryByTestId("checklist-progress-inline")).toBeNull()
    expect(indicator.props.accessibilityElementsHidden).toBe(true)
    expect(indicator.props.importantForAccessibility).toBe(
      "no-hide-descendants",
    )
    expect(
      screen.getByTestId("checklist-progress-inline-label", hidden),
    ).toHaveTextContent("1/3")
    expect(
      screen.getByTestId("checklist-progress-inline-icon", hidden).props.name,
    ).toBe("square")
    expect(styleOf("checklist-progress-inline")).toMatchObject({
      borderWidth: 1,
      borderColor: Colors.light.informational,
    })
    expect(styleOf("checklist-progress-inline-label").color).toBe(
      Colors.light.informational,
    )
  })

  it.each(["light", "dark"] as const)(
    "switches the inline badge to the checked glyph and the %s positive tone when complete",
    async (scheme) => {
      mockScheme = scheme
      await render(<ChecklistProgressIndicator progress={complete} />)
      const icon = screen.getByTestId("checklist-progress-inline-icon", hidden)
      expect(icon.props.name).toBe("checkmark.square.fill")
      expect(icon.props.tintColor).toBe(Colors[scheme].positive)
      expect(styleOf("checklist-progress-inline").borderColor).toBe(
        Colors[scheme].positive,
      )
      expect(styleOf("checklist-progress-inline-label").color).toBe(
        Colors[scheme].positive,
      )
    },
  )

  it("draws the compact glyph in the tone color", async () => {
    await render(
      <ChecklistProgressIndicator progress={complete} variant="compact" />,
    )
    expect(
      screen.getByTestId("checklist-progress-glyph", hidden).props.tintColor,
    ).toBe(Colors.light.positive)
    expect(
      screen.getByTestId("checklist-progress-count", hidden),
    ).toHaveTextContent("3/3")
  })

  it("bounds compact output and clamps the numeric count", async () => {
    await render(
      <ChecklistProgressIndicator progress={partial} variant="compact" />,
    )

    const compactStyle = StyleSheet.flatten(
      screen.getByTestId("checklist-progress-compact", {
        includeHiddenElements: true,
      }).props.style,
    )
    const count = screen.getByTestId("checklist-progress-count", {
      includeHiddenElements: true,
    })
    expect(compactStyle.maxWidth).toBe(64)
    expect(count.props.numberOfLines).toBe(1)
    expect(count.props.adjustsFontSizeToFit).toBe(true)
    expect(count.props.minimumFontScale).toBe(0.75)
  })

  it.each([
    [{ width: 40, height: 30 }, true],
    [{ width: 60, height: 20 }, true],
    [{ width: 60, height: 30 }, false],
  ])("packs compact output into tight bounds %o", async (bounds, dense) => {
    await render(
      <ChecklistProgressIndicator
        progress={partial}
        variant="compact"
        bounds={bounds}
      />,
    )

    const style = StyleSheet.flatten(
      screen.getByTestId("checklist-progress-compact", {
        includeHiddenElements: true,
      }).props.style,
    )
    const countStyle = StyleSheet.flatten(
      screen.getByTestId("checklist-progress-count", {
        includeHiddenElements: true,
      }).props.style,
    )
    expect(style.maxWidth).toBe(bounds.width)
    expect(style.maxHeight).toBe(bounds.height)
    expect(style.paddingHorizontal).toBe(dense ? 0 : 4)
    expect(countStyle.fontSize === 8).toBe(dense)
  })

  describe.each(["light", "dark"] as const)(
    "inside an event surface in %s",
    (scheme) => {
      const foreground = resolveEventAppearance({
        color: "#E91E63",
        scheme,
        increasedContrast: false,
      }).foreground
      const onSurface = (node: ReactNode) => (
        <EventSurface
          eventColor="#E91E63"
          accessibilityLabel="Lecture"
          onPress={jest.fn()}
        >
          {node}
        </EventSurface>
      )

      beforeEach(() => {
        mockScheme = scheme
      })

      it.each([
        [partial, "square"],
        [complete, "checkmark.square.fill"],
      ])(
        "draws the inline pill in the surface foreground (%o)",
        async (progress, glyph) => {
          await render(
            onSurface(<ChecklistProgressIndicator progress={progress} />),
          )
          expect(styleOf("checklist-progress-inline")).toMatchObject({
            borderWidth: 1,
            borderColor: foreground,
          })
          expect(styleOf("checklist-progress-inline-label").color).toBe(
            foreground,
          )
          expect(
            screen.getByTestId("checklist-progress-inline-icon", hidden).props
              .name,
          ).toBe(glyph)
        },
      )

      it.each([partial, complete])(
        "draws the compact pill in the surface foreground (%o)",
        async (progress) => {
          await render(
            onSurface(
              <ChecklistProgressIndicator
                progress={progress}
                variant="compact"
              />,
            ),
          )
          expect(styleOf("checklist-progress-compact").borderColor).toBe(
            foreground,
          )
          expect(
            screen.getByTestId("checklist-progress-glyph", hidden).props
              .tintColor,
          ).toBe(foreground)
          expect(styleOf("checklist-progress-count").color).toBe(foreground)
        },
      )
    },
  )

  it("keeps the status tones outside a surface", async () => {
    await render(
      <ChecklistProgressIndicator progress={partial} variant="compact" />,
    )
    expect(styleOf("checklist-progress-compact").borderColor).toBe(
      Colors.light.informational,
    )
  })

  it("builds the localized phrase only for nonzero progress", async () => {
    await i18n.changeLanguage("en")
    expect(checklistProgressLabel(i18n.t, partial)).toBe(
      "1 of 3 checklist items completed",
    )
    expect(
      checklistProgressLabel(i18n.t, {
        completed: 0,
        total: 0,
        isComplete: false,
      }),
    ).toBeUndefined()
  })
})
