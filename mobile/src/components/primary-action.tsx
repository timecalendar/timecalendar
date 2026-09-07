import {
  ActivityIndicator,
  Platform,
  Pressable,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from "react-native"

import { ThemedText } from "@/components/themed-text"
import { Radii, Spacing, useTheme } from "@/theme"

type PrimaryActionProps = {
  label: string
  accessibilityLabel?: string
  onPress: () => void
  testID?: string
  disabled?: boolean
  busy?: boolean
  style?: StyleProp<ViewStyle>
}

export function PrimaryAction({
  label,
  accessibilityLabel = label,
  onPress,
  testID,
  disabled = false,
  busy = false,
  style,
}: PrimaryActionProps) {
  const theme = useTheme()
  const blocked = disabled || busy

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: blocked, busy }}
      disabled={blocked}
      onPress={blocked ? undefined : onPress}
      style={[
        style,
        styles.action,
        {
          backgroundColor: theme.primaryStrong,
          minHeight: Platform.OS === "ios" ? 44 : 48,
        },
        blocked ? styles.blocked : styles.enabled,
      ]}
    >
      {busy ? (
        <ActivityIndicator
          testID={testID === undefined ? undefined : `${testID}-progress`}
          color={theme.onPrimary}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      ) : null}
      <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
        {label}
      </ThemedText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  action: {
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.medium,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Spacing.two,
  },
  blocked: {
    opacity: 0.55,
  },
  enabled: {
    opacity: 1,
  },
})
