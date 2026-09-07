import { useTranslation } from "react-i18next"
import { ActivityIndicator, StyleSheet, View } from "react-native"

import { RootPage } from "@/components/root-page"
import { ThemedText } from "@/components/themed-text"

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
    <>
      <EventDetailsHeader />
      <RootPage testID="event-details-status-responsive-owner" lane="readable">
        {(layout) => (
          <View
            testID="event-details-status-responsive-lane"
            style={[layout.laneStyle, styles.lane]}
          >
            {children}
          </View>
        )}
      </RootPage>
    </>
  )
}

const styles = StyleSheet.create({
  lane: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
})
