import { StyleSheet, View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import { Spacing, useTheme } from "@/theme"

export function OwnedCalendarShell({ heading }: { heading: string }) {
  const theme = useTheme()

  return (
    <View
      testID="owned-calendar-shell"
      style={[styles.shell, { backgroundColor: theme.background }]}
    >
      <ThemedText type="subtitle" style={styles.heading}>
        {heading}
      </ThemedText>
      <View
        testID="owned-calendar-canvas"
        accessibilityLabel={heading}
        style={[
          styles.canvas,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.separator,
          },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  heading: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  canvas: {
    flex: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
})
