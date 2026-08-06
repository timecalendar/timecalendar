import { useTranslation } from "react-i18next"
import { Platform, Pressable, StyleSheet, View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import {
  type CalendarEvent,
  formatFullDay,
  formatTime,
} from "@/features/calendar/data"
import { type NextActiveDay } from "@/features/home/data"
import { UpcomingScroller } from "@/features/home/ui/upcoming-scroller"
import { Radii, Spacing, useTheme } from "@/theme"

interface UpcomingSectionProps {
  now: Date
  locale: "fr" | "en"
  events: CalendarEvent[]
  todayEventCount: number
  nextDay: NextActiveDay | undefined
  onOpenCalendar: (day: Date) => void
  onPressEvent: (event: CalendarEvent) => void
}

export function UpcomingSection({
  now,
  locale,
  events,
  todayEventCount,
  nextDay,
  onOpenCalendar,
  onPressEvent,
}: UpcomingSectionProps) {
  const { t } = useTranslation()
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>
          {t("home.upcoming.title")}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("home.upcoming.seeAll")}
          onPress={() => onOpenCalendar(now)}
          style={styles.textAction}
        >
          <ThemedText type="smallBold" themeColor="primary">
            {t("home.upcoming.seeAll")}
          </ThemedText>
        </Pressable>
      </View>
      {events.length > 0 ? (
        <UpcomingScroller
          events={events}
          locale={locale}
          onPressEvent={onPressEvent}
        />
      ) : todayEventCount > 0 ? (
        <ThemedText themeColor="textSecondary">
          {t("home.upcoming.finished")}
        </ThemedText>
      ) : nextDay !== undefined ? (
        <NextDayCard
          day={nextDay.day}
          count={nextDay.events.length}
          firstStart={nextDay.firstTimedStart}
          locale={locale}
          onPress={() => onOpenCalendar(nextDay.day)}
        />
      ) : (
        <ThemedText themeColor="textSecondary">
          {t("home.upcoming.none")}
        </ThemedText>
      )}
    </View>
  )
}

function NextDayCard({
  day,
  count,
  firstStart,
  locale,
  onPress,
}: {
  day: Date
  count: number
  firstStart: Date | undefined
  locale: "fr" | "en"
  onPress: () => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const date = formatFullDay(day, locale)
  return (
    <Pressable
      testID="home-next-day"
      accessibilityRole="button"
      accessibilityLabel={t("home.nextDay.openLabel", { date })}
      onPress={onPress}
      android_ripple={{ color: theme.ripple, foreground: true }}
      style={({ pressed }) => [
        styles.nextDayCard,
        { backgroundColor: theme.backgroundElement },
        Platform.OS === "ios" && pressed && styles.iosPressed,
      ]}
    >
      <ThemedText type="smallBold">
        {t("home.nextDay.count", { date, count })}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {firstStart === undefined
          ? t("home.nextDay.allDay")
          : t("home.nextDay.first", { time: formatTime(firstStart, locale) })}
      </ThemedText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  section: { gap: Spacing.one },
  sectionHeader: {
    minHeight: Platform.OS === "android" ? 48 : 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 20, lineHeight: 25, fontWeight: "700" },
  textAction: {
    minWidth: Platform.OS === "android" ? 48 : 44,
    minHeight: Platform.OS === "android" ? 48 : 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  nextDayCard: {
    minHeight: 72,
    padding: Spacing.three,
    borderRadius: Radii.large,
    gap: Spacing.one,
  },
  iosPressed: { opacity: 0.62 },
})
