import { render, screen } from "@testing-library/react-native"
import { StyleSheet } from "react-native"

import i18n from "@/i18n"
import { Colors } from "@/theme"

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

  it("renders partial inline progress and stays out of the accessibility tree", async () => {
    await render(<ChecklistProgressIndicator progress={partial} />)

    const indicator = screen.getByTestId("checklist-progress-inline", {
      includeHiddenElements: true,
    })
    expect(
      screen.getByTestId("checklist-progress-glyph", {
        includeHiddenElements: true,
      }).props.name,
    ).toBeDefined()
    expect(
      screen.getByText("1/3", { includeHiddenElements: true }),
    ).toBeTruthy()
    expect(indicator.props.accessibilityElementsHidden).toBe(true)
    expect(indicator.props.importantForAccessibility).toBe(
      "no-hide-descendants",
    )
  })

  it("uses an explicit checked glyph and positive light/dark theme tokens when complete", async () => {
    const light = await render(
      <ChecklistProgressIndicator progress={complete} />,
    )
    expect(
      screen.getByTestId("checklist-progress-glyph", {
        includeHiddenElements: true,
      }).props.tintColor,
    ).toBe(Colors.light.positive)

    await light.unmount()
    mockScheme = "dark"
    await render(<ChecklistProgressIndicator progress={complete} />)
    expect(
      screen.getByTestId("checklist-progress-glyph", {
        includeHiddenElements: true,
      }).props.tintColor,
    ).toBe(Colors.dark.positive)
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
