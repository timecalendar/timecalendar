import { useTranslation } from "react-i18next"
import { ActivityIndicator, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { useAdaptiveLayout } from "@/components/adaptive-content"
import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"

import { EventDetailsHeader } from "./event-details-actions"

export function EventDetailsLoading() {
  const { t } = useTranslation()

  return (
    <EventDetailsStatus>
      <View
        style={styles.loading}
        accessibilityLiveRegion="polite"
        accessibilityRole="text"
        accessibilityLabel={t("eventDetails.loading")}
      >
        <ActivityIndicator />
      </View>
    </EventDetailsStatus>
  )
}

export function EventDetailsNotFound() {
  const { t } = useTranslation()

  return (
    <EventDetailsStatus>
      <ThemedText
        themeColor="textSecondary"
        accessibilityLiveRegion="polite"
        accessibilityRole="text"
      >
        {t("eventDetails.notFound")}
      </ThemedText>
    </EventDetailsStatus>
  )
}

function EventDetailsStatus({ children }: { children: React.ReactNode }) {
  const layout = useAdaptiveLayout("readable")

  return (
    <ThemedView style={styles.container}>
      <EventDetailsHeader />
      <SafeAreaView
        testID="event-details-status-responsive-owner"
        style={styles.safeArea}
        onLayout={layout.onLayout}
      >
        <View
          testID="event-details-status-responsive-lane"
          style={[layout.laneStyle, styles.lane]}
        >
          {children}
        </View>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  lane: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
})
