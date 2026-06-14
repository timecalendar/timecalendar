import { Link } from "expo-router"
import { useTranslation } from "react-i18next"
import { FlatList, Pressable, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import {
  type PersonalEvent,
  usePersonalEvents,
} from "@/features/personal-events/data"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

// The Home-tab personal-events list (B2 / TIM-133) — PRESENTATIONAL (70% floor):
// it reads B1's reactive usePersonalEvents() (useLiveQuery, so it re-renders on
// any create/edit/delete) and renders rows + an empty state + an Add control. It
// owns no data logic. Each row navigates to the form prefilled for edit
// (/personal-event-form?uid=…); Add opens the blank create form. The route stays
// thin over this module (route-structure rule).
export function PersonalEventsList() {
  const { t } = useTranslation()
  const theme = useTheme()
  const events = usePersonalEvents()

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="title">{t("personalEvents.list.title")}</ThemedText>
          <Link href="/personal-event-form" asChild>
            <Pressable
              testID="personal-events-add"
              accessibilityRole="button"
              accessibilityLabel={t("personalEvents.list.add")}
              hitSlop={Spacing.two}
              style={[
                styles.addButton,
                { backgroundColor: theme.backgroundElement },
              ]}
            >
              <ThemedText type="smallBold">
                {t("personalEvents.list.add")}
              </ThemedText>
            </Pressable>
          </Link>
        </View>

        {events.length === 0 ? (
          <ThemedText themeColor="textSecondary" accessibilityRole="text">
            {t("personalEvents.list.empty")}
          </ThemedText>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(event) => event.uid}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <EventRow event={item} />}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  )
}

function EventRow({ event }: { event: PersonalEvent }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const range = `${formatRange(event.startsAt)} – ${formatRange(event.endsAt)}`

  return (
    <Link href={`/personal-event-form?uid=${event.uid}`} asChild>
      <Pressable
        testID={`personal-event-row-${event.uid}`}
        accessibilityRole="button"
        // The label is exactly the title (not "Edit event {title}"): iOS merges
        // an accessible Pressable's children into this single label, so the title
        // is only reachable here — keeping it verbatim lets the shared Maestro
        // flow match the row by its title cross-platform. The edit affordance
        // moves to the hint.
        accessibilityLabel={event.title}
        accessibilityHint={t("personalEvents.list.rowHint")}
        style={[styles.row, { backgroundColor: theme.backgroundElement }]}
      >
        <View
          style={[styles.rowSwatch, { backgroundColor: event.color }]}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <View style={styles.rowText}>
          <ThemedText type="smallBold">{event.title}</ThemedText>
          <ThemedText themeColor="textSecondary" type="small">
            {range}
          </ThemedText>
          {event.location !== undefined && (
            <ThemedText themeColor="textSecondary" type="small">
              {event.location}
            </ThemedText>
          )}
        </View>
      </Pressable>
    </Link>
  )
}

// A locale-neutral, deterministic range label (the i18n date-format deferral
// stands — Architecture Book i18n "Deferred"). Uses the runtime locale's short
// date+time via toLocaleString with no hardcoded copy.
function formatRange(date: Date): string {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.three,
  },
  addButton: {
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    justifyContent: "center",
    borderRadius: Radii.medium,
  },
  list: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    minHeight: 48,
    padding: Spacing.three,
    borderRadius: Radii.medium,
  },
  rowSwatch: {
    width: 24,
    height: 24,
    borderRadius: Radii.small,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
})
