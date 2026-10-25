import { act, fireEvent, render, screen } from "@testing-library/react-native"

import i18n from "@/i18n"
import { usePlatform } from "@/test-support/platform"

import { ColorSwatchPicker } from "./color-swatch-picker"
import { SWATCH_PRESETS } from "./color-swatch-presets"

const EN_NAMES = [
  "Pink",
  "Purple",
  "Indigo",
  "Light blue",
  "Teal",
  "Green",
  "Orange",
  "Brown",
]

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage("en")
  })
})

// Presentational (70% floor): swatches announce translated color names with
// each platform's selection semantics, and report the chosen #RRGGBB on press.
describe("ColorSwatchPicker on Android", () => {
  usePlatform("android")

  it("exposes each swatch as a named radio with its checked state", async () => {
    await render(
      <ColorSwatchPicker value={SWATCH_PRESETS[0]} onChange={() => {}} />,
    )

    expect(
      screen.getByRole("radio", { name: "Pink", checked: true }),
    ).toBeTruthy()
    for (const name of EN_NAMES.slice(1)) {
      expect(screen.getByRole("radio", { name, checked: false })).toBeTruthy()
    }
  })
})

describe("ColorSwatchPicker on iOS", () => {
  usePlatform("ios")

  it("exposes each swatch as a named button with the selected trait in French", async () => {
    await act(async () => {
      await i18n.changeLanguage("fr")
    })
    await render(
      <ColorSwatchPicker value={SWATCH_PRESETS[0]} onChange={() => {}} />,
    )

    expect(
      screen.getByRole("button", { name: "Rose", selected: true }),
    ).toBeTruthy()
    expect(
      screen.getByRole("button", { name: "Bleu clair", selected: false }),
    ).toBeTruthy()
  })

  it("reports the swatch hex on press", async () => {
    const onChange = jest.fn()
    await render(
      <ColorSwatchPicker value={SWATCH_PRESETS[0]} onChange={onChange} />,
    )
    fireEvent.press(screen.getByTestId(`color-swatch-${SWATCH_PRESETS[2]}`))
    expect(onChange).toHaveBeenCalledWith(SWATCH_PRESETS[2])
  })
})

describe.each(["en", "fr"])("ColorSwatchPicker names in %s", (language) => {
  it("never announces a hex code", async () => {
    await act(async () => {
      await i18n.changeLanguage(language)
    })
    await render(
      <ColorSwatchPicker value={SWATCH_PRESETS[0]} onChange={() => {}} />,
    )
    const labels = SWATCH_PRESETS.map(
      (hex) =>
        screen.getByTestId(`color-swatch-${hex}`).props
          .accessibilityLabel as string,
    )
    expect(new Set(labels).size).toBe(SWATCH_PRESETS.length)
    for (const label of labels) {
      expect(label).not.toContain("#")
      expect(label.length).toBeGreaterThan(0)
    }
  })
})
