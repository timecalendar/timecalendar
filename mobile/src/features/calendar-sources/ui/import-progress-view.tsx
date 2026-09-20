import { ActivityIndicator, StyleSheet, View } from "react-native"

import { RootPage } from "@/components/root-page"
import { ThemedText } from "@/components/themed-text"
import { Spacing, useTheme } from "@/theme"

interface ImportProgressViewProps {
  message: string
  testID?: string
}

export function ImportProgressView({
  message,
  testID = "calendar-import-progress",
}: ImportProgressViewProps) {
  const theme = useTheme()
  return (
    <RootPage testID={testID} lane="readable">
      <View style={styles.content} accessibilityLiveRegion="polite">
        <ActivityIndicator color={theme.primary} accessible={false} />
        <ThemedText accessibilityRole="text" style={styles.centered}>
          {message}
        </ThemedText>
      </View>
    </RootPage>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
  },
  centered: { textAlign: "center" },
})
