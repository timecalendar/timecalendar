import { useTranslation } from "react-i18next"
import { ActivityIndicator, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

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
  return (
    <ThemedView style={styles.container}>
      <EventDetailsHeader />
      <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
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
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
})
