import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import {
  type CalendarEvent,
  formatDayMonth,
  formatTime,
} from "@/features/calendar/data"
import { type DayCaption, type GreetingSelection } from "@/features/home/data"
import { Radii, Spacing, useTheme } from "@/theme"

const MAX_EVENT_DOTS = 5

interface WelcomeCardProps {
  now: Date
  locale: "fr" | "en"
  displayZone: string
  caption: DayCaption
  greeting: GreetingSelection
  events: CalendarEvent[]
}

function greetingKey(selection: GreetingSelection): string {
  const prefix = selection.weekend ? "home.greeting.weekend." : "home.greeting."
  return `${prefix}${selection.period}.${selection.variant}`
}

export function WelcomeCard({
  now,
  locale,
  displayZone,
  caption,
  greeting,
  events,
}: WelcomeCardProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const captionText = (() => {
    switch (caption.kind) {
      case "ongoing":
        return t("home.caption.ongoing", {
          end: formatTime(caption.end, locale, displayZone),
        })
      case "singleFuture":
        return t("home.caption.singleFuture", {
          start: formatTime(caption.start, locale, displayZone),
          end: formatTime(caption.end, locale, displayZone),
        })
      case "futureSpan":
        return t("home.caption.futureSpan", {
          start: formatTime(caption.start, locale, displayZone),
          end: formatTime(caption.end, locale, displayZone),
        })
      default:
        return t(`home.caption.${caption.kind}`)
    }
  })()

  return (
    <View style={[styles.hero, { backgroundColor: theme.homeHero }]}>
      <ThemedText
        type="smallBold"
        style={[styles.date, { color: theme.homeHeroDate }]}
      >
        {formatDayMonth(now, locale, displayZone).toLocaleUpperCase()}
      </ThemedText>
      <ThemedText style={styles.greeting} accessibilityRole="header">
        {t(greetingKey(greeting))}
      </ThemedText>
      <ThemedText>{captionText}</ThemedText>
      <View style={styles.summaryRow}>
        <View style={styles.dots} accessibilityElementsHidden>
          {events.slice(0, MAX_EVENT_DOTS).map((event, index) => (
            <View
              key={event.id}
              style={[
                styles.dot,
                {
                  backgroundColor: event.color,
                  marginLeft: index === 0 ? 0 : -Spacing.one,
                },
              ]}
            />
          ))}
          {events.length > MAX_EVENT_DOTS && (
            <ThemedText type="smallBold" style={styles.extraDots}>
              {`+${events.length - MAX_EVENT_DOTS}`}
            </ThemedText>
          )}
        </View>
        <ThemedText type="smallBold">
          {events.length === 0
            ? t("home.header.empty")
            : t("home.header.count", { count: events.length })}
        </ThemedText>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  hero: {
    padding: Spacing.four,
    borderRadius: Radii.large,
    gap: Spacing.two,
  },
  date: { letterSpacing: 0.6 },
  greeting: { fontSize: 30, lineHeight: 36, fontWeight: "700" },
  summaryRow: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  dots: { flexDirection: "row", alignItems: "center" },
  dot: {
    width: 12,
    height: 12,
    borderRadius: Radii.pill,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  extraDots: { marginLeft: Spacing.one },
})
