import { useTranslation } from "react-i18next"
import { Platform, Pressable, ScrollView, StyleSheet } from "react-native"

import { ThemedText } from "@/components/themed-text"
import {
  type AppLocale,
  type CalendarEvent,
  formatTimeRange,
} from "@/features/calendar/data"
import { Radii, Spacing, useTheme } from "@/theme"

import { eventSurfaceColor } from "./event-surface"

// The home upcoming scroller (D6) — PRESENTATIONAL (70% floor): a horizontal RN-core
// ScrollView of the displayed day's events as cards (color accent + title +
// formatTimeRange + location). A few events per day, so a core horizontal list
// suffices (no FlashList — R-2, same reasoning as the agenda's SectionList). Each
// card is a Pressable → the screen's origin-keyed onPressEvent. Renders nothing when
// the day is empty (the empty state is the header line). Themed from @/theme (R-3).

const CARD_WIDTH = 200

export function UpcomingScroller({
  events,
  locale,
  displayZone,
  onPressEvent,
}: {
  events: CalendarEvent[]
  locale: AppLocale
  displayZone: string
  onPressEvent: (event: CalendarEvent) => void
}) {
  if (events.length === 0) return null

  return (
    <ScrollView
      testID="upcoming-scroller"
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {events.map((event) => (
        <UpcomingCard
          key={event.id}
          event={event}
          locale={locale}
          zone={displayZone}
          onPress={() => onPressEvent(event)}
        />
      ))}
    </ScrollView>
  )
}

function UpcomingCard({
  event,
  locale,
  zone,
  onPress,
}: {
  event: CalendarEvent
  locale: AppLocale
  zone: string
  onPress: () => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const time = event.allDay
    ? t("home.today.allDay")
    : formatTimeRange(event.startsAt, event.endsAt, locale, zone)
  const location = event.location ?? ""

  return (
    <Pressable
      testID={`upcoming-card-${event.id}`}
      accessibilityRole="button"
      accessibilityLabel={t("home.event.openLabel", {
        title: event.title,
        time,
        location,
      })}
      accessibilityHint={
        event.userCalendarId !== undefined
          ? t("home.event.hint.details")
          : t("home.event.hint.edit")
      }
      onPress={onPress}
      android_ripple={{ color: theme.ripple, foreground: true }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: eventSurfaceColor(event.color),
        },
        Platform.OS === "ios" && pressed && styles.iosPressed,
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
    </Pressable>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  card: {
    width: CARD_WIDTH,
    minHeight: Platform.OS === "android" ? 48 : 44,
    padding: Spacing.three,
    borderRadius: Radii.large,
    gap: Spacing.half,
    overflow: "hidden",
  },
  iosPressed: { opacity: 0.62 },
})
