import { type ReactElement, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  type RefreshControlProps,
  SectionList,
  StyleSheet,
  View,
} from "react-native"

import { ThemedText } from "@/components/themed-text"
import {
  type AppLocale,
  type CalendarEvent,
  formatDayHeaderParts,
  formatTimeRange,
  groupEventsByDay,
} from "@/features/calendar/data"
import { Radii, Spacing, useTheme } from "@/theme"

// The agenda / planning view (presentational, 70% floor): a React Native core
// SectionList (zero new dep — D4) of day-grouped events as a designed brand surface
// (R-3). The screen owns the read + the resolved locale; this maps events → day
// sections via the pure groupEventsByDay seam, formats headers/times via the pure
// date-fns formatter, and renders day headers + themed event tiles. Read-only: the
// tile is NOT a touchable (no event-details screen yet — accessibilityRole="text",
// no onPress; the tap target is added when item 3 lands). A now/upcoming indicator
// marks the first event ending after now. The screen passes a `refreshControl`
// (a RefreshControl wired to the sync orchestrator) so the agenda is pull-to-refresh.

interface AgendaSection {
  day: Date
  data: CalendarEvent[]
}

export function AgendaList({
  events,
  locale,
  refreshControl,
}: {
  events: CalendarEvent[]
  locale: AppLocale
  refreshControl?: ReactElement<RefreshControlProps>
}) {
  // The clock is read once at mount (like the screen's visibleDate) so the render
  // stays pure — the "up next" marker is relative to when the agenda opened.
  const [now] = useState(() => Date.now())

  const sections = useMemo<AgendaSection[]>(
    () =>
      groupEventsByDay(events).map((bucket) => ({
        day: bucket.day,
        data: bucket.events,
      })),
    [events],
  )

  // The "next upcoming" event — the first (chronologically) ending after now. Its
  // tile carries the now/upcoming indicator. Computed from the sorted groups so it
  // is stable with the rendered order.
  const upcomingId = useMemo(() => {
    for (const section of sections) {
      for (const event of section.data) {
        if (event.endsAt.getTime() > now) return event.id
      }
    }
    return undefined
  }, [sections, now])

  return (
    <SectionList
      testID="agenda-section-list"
      sections={sections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      stickySectionHeadersEnabled
      refreshControl={refreshControl}
      renderSectionHeader={({ section }) => (
        <DayHeader day={section.day} locale={locale} />
      )}
      renderItem={({ item }) => (
        <EventTile
          event={item}
          locale={locale}
          upcoming={item.id === upcomingId}
        />
      )}
    />
  )
}

function DayHeader({ day, locale }: { day: Date; locale: AppLocale }) {
  const theme = useTheme()
  const { weekday, dayOfMonth } = formatDayHeaderParts(day, locale)
  return (
    <View
      accessibilityRole="header"
      style={[styles.dayHeader, { backgroundColor: theme.background }]}
    >
      <ThemedText type="smallBold" themeColor="textSecondary">
        {weekday}
      </ThemedText>
      <ThemedText type="subtitle">{dayOfMonth}</ThemedText>
    </View>
  )
}

function EventTile({
  event,
  locale,
  upcoming,
}: {
  event: CalendarEvent
  locale: AppLocale
  upcoming: boolean
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const time = formatTimeRange(event.startsAt, event.endsAt, locale)
  const location = event.location ?? ""

  const label = t("calendar.agenda.event.label", {
    title: event.title,
    time,
    location,
  })

  return (
    <View style={styles.row}>
      <View
        accessibilityLabel={
          upcoming ? t("calendar.agenda.nowLabel") : undefined
        }
        accessibilityRole={upcoming ? "text" : undefined}
        style={[
          styles.indicatorColumn,
          upcoming && { backgroundColor: theme.primary },
        ]}
      />
      <View
        accessibilityRole="text"
        accessibilityLabel={label}
        style={[
          styles.tile,
          {
            backgroundColor: theme.backgroundElement,
            borderLeftColor: event.color,
            shadowColor: "#000000",
          },
        ]}
      >
        <ThemedText type="smallBold" numberOfLines={2}>
          {event.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {time}
        </ThemedText>
        {location.length > 0 && (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {location}
          </ThemedText>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: Spacing.two,
  },
  indicatorColumn: {
    width: Spacing.half,
    borderRadius: Radii.pill,
  },
  tile: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: Radii.large,
    borderLeftWidth: Spacing.half,
    gap: Spacing.half,
    // Subtle shadow (Flutter planning-tile parity: offset (0,3), rgba(0,0,0,0.06),
    // blur 15) — shadowColor set inline so it tracks the scheme.
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 15,
    elevation: 2,
  },
})
