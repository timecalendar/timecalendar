import {
  Platform,
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
} from "react-native"

import { MinTouchTarget, Radii, Spacing, StateOpacity, useTheme } from "@/theme"

import { FieldChrome, type TextFieldLayoutStyle } from "./text-field"

export type ColorSwatchOption = { color: string; label: string }

export type ColorSwatchFieldProps = {
  label: string
  options: readonly ColorSwatchOption[]
  value: string
  onChange: (color: string) => void
  testID: string
  error?: string | null
  disabled?: boolean
  style?: StyleProp<TextFieldLayoutStyle>
}

const SELECTED_RING_WIDTH = 3

const swatchTestID = (testID: string, color: string) => `${testID}-${color}`

export function ColorSwatchField({
  label,
  options,
  value,
  onChange,
  testID,
  error,
  disabled = false,
  style,
}: ColorSwatchFieldProps) {
  const theme = useTheme()
  const ios = Platform.OS === "ios"

  return (
    <FieldChrome
      label={label}
      error={error}
      disabled={disabled}
      testID={testID}
      style={style}
    >
      <View style={styles.row} accessibilityRole="radiogroup">
        {options.map((option) => {
          const selected = option.color === value
          return (
            <Pressable
              key={option.color}
              testID={swatchTestID(testID, option.color)}
              // UIKit has no radio trait: VoiceOver reads a selected button.
              accessibilityRole={ios ? "button" : "radio"}
              accessibilityState={
                ios ? { selected, disabled } : { checked: selected, disabled }
              }
              accessibilityLabel={option.label}
              disabled={disabled}
              onPress={() => onChange(option.color)}
              android_ripple={
                ios || disabled
                  ? undefined
                  : { color: theme.ripple, foreground: true }
              }
              style={({ pressed }) =>
                StyleSheet.flatten([
                  styles.swatch,
                  {
                    backgroundColor: option.color,
                    borderColor: selected ? theme.text : "transparent",
                    opacity:
                      pressed && ios && !disabled ? StateOpacity.pressed : 1,
                  },
                ])
              }
            />
          )
        })}
      </View>
    </FieldChrome>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  swatch: {
    width: MinTouchTarget,
    height: MinTouchTarget,
    borderRadius: Radii.pill,
    borderWidth: SELECTED_RING_WIDTH,
    overflow: "hidden",
  },
})
