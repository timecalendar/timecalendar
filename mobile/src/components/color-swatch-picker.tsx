import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, View } from "react-native"

import { Radii, Spacing, useTheme } from "@/theme"

// A small preset-palette color picker (design D4): a row of single-select
// swatches, custom RN (no new native dep). The chosen color is a #RRGGBB string
// stored verbatim by the data layer (ADR 011) — the UI never re-encodes it.
//
// The PRESETS below are the one allowed cluster of #RRGGBB literals in the UI:
// they are DATA (event colors stored verbatim per ADR 011), not chrome styling
// — chrome (the selection ring, spacing) uses @/theme tokens. A brand-adjacent
// palette; the default for a new event is the first entry (the brand pink).
// Arbitrary custom color (a native ColorPicker / hex input) is the recorded
// deferral (D4) — earned by a real user need (R-2).
export const SWATCH_PRESETS = [
  "#E91E63", // brand pink (default)
  "#9C27B0",
  "#3F51B5",
  "#03A9F4",
  "#009688",
  "#4CAF50",
  "#FF9800",
  "#795548",
] as const

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
