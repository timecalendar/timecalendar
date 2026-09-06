import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, View } from "react-native"

import { Radii, Spacing, useTheme } from "@/theme"

import { SWATCH_PRESETS } from "./color-swatch-presets"

// A small preset-palette color picker (design D4): a row of single-select
// swatches, custom RN (no new native dep). The chosen color is a #RRGGBB string
// stored verbatim by the data layer (ADR 011) — the UI never re-encodes it.
//
export interface ColorSwatchPickerProps {
  value: string
  onChange: (hex: string) => void
}

export function ColorSwatchPicker({ value, onChange }: ColorSwatchPickerProps) {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {SWATCH_PRESETS.map((hex) => {
        const selected = hex === value
        return (
          <Pressable
            key={hex}
            testID={`color-swatch-${hex}`}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={t("personalEvents.color.swatchLabel", {
              color: hex,
            })}
            hitSlop={Spacing.two}
            onPress={() => onChange(hex)}
            style={[
              styles.swatch,
              { backgroundColor: hex },
              selected && {
                borderColor: theme.text,
                borderWidth: 3,
              },
            ]}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: Radii.medium,
    borderColor: "transparent",
    borderWidth: 3,
  },
})
