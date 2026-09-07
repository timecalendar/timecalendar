import { useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet } from "react-native"

import { RootPage } from "@/components/root-page"
import { ThemedView } from "@/components/themed-view"
import { WriteErrorNotice } from "@/components/write-error-notice"
import {
  type EventDetails,
  resolveLocale,
  useEventDetails,
} from "@/features/calendar/data"
import { useDisplayZone } from "@/features/settings/prefs"
import { Spacing } from "@/theme"

import {
  EventDetailsHeader,
  useEventDetailsAction,
} from "./event-details-actions"
import { EventDetailsContent } from "./event-details-content"
import {
  EventDetailsLoading,
  EventDetailsNotFound,
} from "./event-details-status"

// The route stays a thin re-export. This screen owns only route/data inputs and
// the three read outcomes; resolved-event actions and presentation remain
// feature-internal UI concerns.
export function EventDetailsScreen() {
  const { uid } = useLocalSearchParams<{ uid?: string }>()
  const { event, loading } = useEventDetails(uid)

  if (loading) return <EventDetailsLoading />
  if (event === null) return <EventDetailsNotFound />

  return <ResolvedEventDetails event={event} />
}

function ResolvedEventDetails({ event }: { event: EventDetails }) {
  const { t, i18n } = useTranslation()
  const locale = resolveLocale(i18n.language)
  const displayZone = useDisplayZone()
  const { action, failed } = useEventDetailsAction(event)

  return (
    <>
      <EventDetailsHeader action={action} />
      <RootPage testID="event-details-responsive-owner" lane="readable">
        {(layout) => (
          <ThemedView
            testID="event-details-responsive-lane"
            style={[layout.laneStyle, styles.lane]}
          >
            {failed && (
              <WriteErrorNotice
                message={t("eventDetails.hide.error")}
                style={styles.hideError}
              />
            )}
            <ScrollView contentContainerStyle={styles.content}>
              <EventDetailsContent
                event={event}
                locale={locale}
                displayZone={displayZone}
              />
            </ScrollView>
          </ThemedView>
        )}
      </RootPage>
    </>
  )
}

const styles = StyleSheet.create({
  lane: {
    flex: 1,
  },
  hideError: {
    paddingTop: Spacing.three,
  },
  content: {
    paddingVertical: Spacing.three,
    gap: Spacing.four,
  },
})
