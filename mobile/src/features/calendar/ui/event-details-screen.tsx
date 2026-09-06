import { useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

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
    <ThemedView style={styles.container}>
      <EventDetailsHeader action={action} />
      <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
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
  hideError: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
  },
})
