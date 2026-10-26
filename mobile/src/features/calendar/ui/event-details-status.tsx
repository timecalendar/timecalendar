import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { RootPage, StatusView } from "@/design"
import { Spacing } from "@/theme"

import { EventDetailsHeader } from "./event-details-actions"

export function EventDetailsLoading() {
  const { t } = useTranslation()

  return (
    <EventDetailsStatus>
      <StatusView
        kind="loading"
        presentation="screen"
        title={t("eventDetails.loading")}
      />
    </EventDetailsStatus>
  )
}

export function EventDetailsNotFound() {
  const { t } = useTranslation()

  return (
    <EventDetailsStatus>
      <StatusView
        kind="empty"
        presentation="screen"
        symbol={{
          ios: "calendar.badge.exclamationmark",
          android: "event_busy",
        }}
        title={t("eventDetails.notFound")}
      />
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
    paddingTop: Spacing.four,
  },
})
