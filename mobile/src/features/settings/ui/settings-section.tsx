import type { PropsWithChildren } from "react"
import { Platform, StyleSheet, View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import { Radii, Spacing, useTheme } from "@/theme"

interface SettingsSectionProps extends PropsWithChildren {
  title?: string
  testID?: string
}

export function SettingsSection({
  title,
  testID,
  children,
}: SettingsSectionProps) {
  const theme = useTheme()
  return (
    <View style={styles.section} testID={testID}>
      {title ? (
        <ThemedText
          type="smallBold"
          themeColor="textSecondary"
          style={styles.title}
        >
          {title}
        </ThemedText>
      ) : null}
      <View
        style={[
          styles.surface,
          {
            backgroundColor: theme.backgroundElement,
            borderRadius: Platform.OS === "ios" ? Radii.large : Radii.medium,
          },
        ]}
      >
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  title: {
    paddingHorizontal: Spacing.three,
    textTransform: "uppercase",
  },
  surface: { overflow: "hidden" },
})
