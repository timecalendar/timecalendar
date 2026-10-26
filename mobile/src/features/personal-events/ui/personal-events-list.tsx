import { Link, router, Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { FlatList, Pressable, StyleSheet, View } from "react-native"

import { Button } from "@/components/button"
import { EmptyState } from "@/components/empty-state"
import { headerScrollProps } from "@/components/header-scroll-props"
import { RootPage } from "@/components/root-page"
import { ThemedText } from "@/components/themed-text"
import {
  formatShortDateTime,
  resolveLocale,
  useUses24HourClock,
} from "@/features/calendar/data"
import {
  type PersonalEvent,
  usePersonalEvents,
} from "@/features/personal-events/data"
import { useDisplayZone } from "@/features/settings/prefs"
import { Radii, Spacing, useTheme } from "@/theme"

// The Home-tab personal-events list (B2 / TIM-133) — PRESENTATIONAL (70% floor):
// it reads B1's reactive usePersonalEvents() (useLiveQuery, so it re-renders on
// any create/edit/delete) and renders rows + an empty state + an Add control. It
// owns no data logic. Each row navigates to the form prefilled for edit
// (/personal-event-form?uid=…); Add opens the blank create form. The route stays
// thin over this module (route-structure rule).
export function PersonalEventsList() {
  const { t } = useTranslation()
  const events = usePersonalEvents()
  const hasEvents = events.length > 0
  const uses24HourClock = useUses24HourClock()

  return (
    <>
      <Stack.Screen options={{ title: t("personalEvents.list.title") }} />
      <RootPage
        scrollsUnderHeader={hasEvents}
        testID="personal-events-responsive-owner"
        lane="standard"
      >
        {(layout) => (
          <FlatList
            {...headerScrollProps(hasEvents)}
            testID="personal-events-list"
            data={events}
            keyExtractor={(event) => event.uid}
            contentContainerStyle={[layout.laneStyle, styles.list]}
            ListHeaderComponent={
              <View style={styles.header}>
                <Button
                  variant="tonal"
                  size="small"
                  testID="personal-events-add"
                  label={t("personalEvents.list.add")}
                  onPress={() => router.push("/personal-event-form")}
                />
              </View>
            }
            ListEmptyComponent={
              <EmptyState
                variant="screen"
                title={t("personalEvents.list.empty")}
                testID="personal-events-empty"
              />
            }
            renderItem={({ item }) => (
              <EventRow event={item} uses24HourClock={uses24HourClock} />
            )}
          />
        )}
      </RootPage>
    </>
  )
}

function EventRow({
  event,
  uses24HourClock,
}: {
  event: PersonalEvent
  uses24HourClock: boolean | null
}) {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const locale = resolveLocale(i18n.language)
  const displayZone = useDisplayZone()
  const range = `${formatShortDateTime(event.startsAt, locale, displayZone, uses24HourClock)} – ${formatShortDateTime(event.endsAt, locale, displayZone, uses24HourClock)}`

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
        // Flatten: Link asChild forwards through expo-router's radix <Slot>, whose
        // dev-only shim throws on an array `style` child.
        style={StyleSheet.flatten([
          styles.row,
          { backgroundColor: theme.backgroundElement },
        ])}
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

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.one,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.three,
  },
  list: {
    flexGrow: 1,
    paddingVertical: Spacing.four,
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
