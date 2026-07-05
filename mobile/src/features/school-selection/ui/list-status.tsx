import { type ReactNode, useEffect, useRef } from "react"
import { AccessibilityInfo, Platform, StyleSheet, View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import { Spacing } from "@/theme"

export function ListStatus({
  media,
  message,
  announceKey,
  alert = false,
  children,
}: {
  media: ReactNode
  message: string
  announceKey: string
  alert?: boolean
  children?: ReactNode
}) {
  // Live regions are Android-only, so announce for VoiceOver — once per state
  // kind, not per keystroke (the no-results message embeds the query).
  const lastAnnounced = useRef<string | null>(null)
  useEffect(() => {
    if (Platform.OS !== "ios" || lastAnnounced.current === announceKey) return
    lastAnnounced.current = announceKey
    AccessibilityInfo.announceForAccessibility(message)
  }, [announceKey, message])

  return (
    <View style={styles.status}>
      {media}
      <ThemedText
        themeColor="textSecondary"
        style={styles.statusText}
        accessibilityLiveRegion={alert ? "assertive" : "polite"}
        accessibilityRole={alert ? "alert" : "text"}
      >
        {message}
      </ThemedText>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  status: {
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
  },
  statusText: {
    textAlign: "center",
  },
})
