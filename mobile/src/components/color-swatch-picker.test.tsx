import { fireEvent, render } from "@testing-library/react-native"

import { ColorSwatchPicker, SWATCH_PRESETS } from "./color-swatch-picker"

// Presentational (70% floor): renders the preset swatches with labels +
// selected state, and reports the chosen #RRGGBB on press. Localized labels
// resolve through the real i18n tree (setup-i18n).
describe("ColorSwatchPicker", () => {
  it("renders a swatch per preset with a localized accessible label", async () => {
    const { getByTestId } = await render(
      <ColorSwatchPicker value={SWATCH_PRESETS[0]} onChange={() => {}} />,
    )
    for (const hex of SWATCH_PRESETS) {
      const swatch = getByTestId(`color-swatch-${hex}`)
      expect(swatch.props.accessibilityLabel).toBe(`Color ${hex}`)
    }
  })

  it("marks the current value selected for assistive technology", async () => {
    const { getByTestId } = await render(
      <ColorSwatchPicker value={SWATCH_PRESETS[1]} onChange={() => {}} />,
    )
    expect(
      getByTestId(`color-swatch-${SWATCH_PRESETS[1]}`).props.accessibilityState
        .selected,
    ).toBe(true)
    expect(
      getByTestId(`color-swatch-${SWATCH_PRESETS[0]}`).props.accessibilityState
        .selected,
    ).toBe(false)
  })

  it("reports the swatch hex on press", async () => {
    const onChange = jest.fn()
    const { getByTestId } = await render(
      <ColorSwatchPicker value={SWATCH_PRESETS[0]} onChange={onChange} />,
    )
    fireEvent.press(getByTestId(`color-swatch-${SWATCH_PRESETS[2]}`))
    expect(onChange).toHaveBeenCalledWith(SWATCH_PRESETS[2])
  })
})
