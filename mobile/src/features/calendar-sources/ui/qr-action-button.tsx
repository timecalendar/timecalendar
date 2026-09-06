import { Pressable, StyleSheet } from "react-native"

import { ThemedText } from "@/components/themed-text"
import { Radii, Spacing, useTheme } from "@/theme"

interface QrActionButtonProps {
  testID: string
  label: string
  text: string
  onPress: () => void
  disabled?: boolean
}

export function QrActionButton({
  testID,
  label,
  text,
  onPress,
  disabled,
}: QrActionButtonProps) {
  const theme = useTheme()
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={disabled === undefined ? undefined : { disabled }}
      disabled={disabled}
      hitSlop={Spacing.two}
      onPress={onPress}
      style={[
        styles.cta,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.primary,
        },
      ]}
    >
      <ThemedText type="smallBold">{text}</ThemedText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  cta: {
    minHeight: 48,
    paddingHorizontal: Spacing.four,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: Radii.medium,
    borderWidth: 2,
  },
})
