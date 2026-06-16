import { Stack, useLocalSearchParams } from "expo-router"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import {
  type AppLocale,
  type EventDetails,
  type EventDetailsTag,
  formatEventDateRange,
  formatFullDateTime,
  resolveLocale,
  useEventDetails,
} from "@/features/calendar/data"
import { useUserCalendars } from "@/features/calendar-sources"
import { Radii, Spacing } from "@/theme"

// The read-only event-details screen (D6) — PRESENTATIONAL (70% floor). It reads
// the uid route param, reads the rich event through the sibling data/ sub-barrel
// (B-2 — never @/db, B-1), and renders the title block / tags / content lines /
// footer as a designed brand surface themed from @/theme (R-3). READ-ONLY: no
// edit / delete / hide / checklist, no header overflow menu, no write path —
// back navigation only (D1). The route (src/app/event-details/[uid].tsx) is a
// thin re-export (route-structure rule).

export function EventDetailsScreen() {
  const { t, i18n } = useTranslation()
  const { uid } = useLocalSearchParams<{ uid?: string }>()
  const { event, loading } = useEventDetails(uid)
  const locale = resolveLocale(i18n.language)
  const calendars = useUserCalendars()

  // The calendar name is shown ONLY when the user has 2+ calendars (Flutter
  // parity) — with one calendar the name is redundant.
  const calendarName = useMemo(() => {
    if (event === null || calendars.length < 2) return undefined
    return calendars.find((c) => c.id === event.userCalendarId)?.name
  }, [event, calendars])

  const header = <Stack.Screen options={{ title: t("eventDetails.title") }} />

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        {header}
        <SafeAreaView style={styles.safeArea}>
          <View
            style={styles.loading}
            accessibilityLiveRegion="polite"
            accessibilityRole="text"
            accessibilityLabel={t("eventDetails.loading")}
          >
            <ActivityIndicator />
          </View>
        </SafeAreaView>
      </ThemedView>
    )
  }

  if (event === null) {
    return (
      <ThemedView style={styles.container}>
        {header}
        <SafeAreaView style={styles.safeArea}>
          <ThemedText
            themeColor="textSecondary"
            accessibilityLiveRegion="polite"
            accessibilityRole="text"
          >
            {t("eventDetails.notFound")}
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    )
  }

  return (
    <ThemedView style={styles.container}>
      {header}
      <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <TitleBlock event={event} locale={locale} />

          {event.tags.length > 0 && (
            <View style={styles.tagRow}>
              {event.tags.map((tag, index) => (
                <TagBubble key={`${tag.name}-${index}`} tag={tag} />
              ))}
            </View>
          )}

          <View style={styles.lines}>
            {event.location !== undefined && event.location.length > 0 && (
              <ContentLine
                label={t("eventDetails.location")}
                text={event.location}
              />
            )}
            {calendarName !== undefined && (
              <ContentLine
                label={t("eventDetails.calendarName")}
                text={calendarName}
              />
            )}
            {event.teachers.length > 0 && (
              <ContentLine
                label={t("eventDetails.teachers")}
                text={event.teachers.join("\n")}
              />
            )}
            {event.description !== undefined &&
              event.description.length > 0 && (
                <ContentLine
                  label={t("eventDetails.description")}
                  text={event.description}
                />
              )}
          </View>

          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.footer}
          >
            {t("eventDetails.updated", {
              date: formatFullDateTime(event.exportedAt, locale),
            })}
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  )
}

function TitleBlock({
  event,
  locale,
}: {
  event: EventDetails
  locale: AppLocale
}) {
  const { t } = useTranslation()
  return (
    <View style={styles.titleBlock}>
      <View style={styles.titleRow}>
        <View
          accessibilityLabel={t("eventDetails.colorLabel")}
          style={[styles.swatch, { backgroundColor: event.color }]}
        />
        <ThemedText type="title" style={styles.title}>
          {event.title}
        </ThemedText>
      </View>
      <ThemedText themeColor="textSecondary">
        {formatEventDateRange(event.startsAt, event.endsAt, locale)}
      </ThemedText>
    </View>
  )
}

function TagBubble({ tag }: { tag: EventDetailsTag }) {
  return (
    <View style={[styles.tag, { backgroundColor: tag.color }]}>
      <ThemedText type="small" themeColor="background">
        {tag.name}
      </ThemedText>
    </View>
  )
}

// A content line: a label (the field name) + its value. No icon font is wired in
// the app (R-3 — do NOT port Flutter's FontAwesome), so the label IS the line's
// accessible affordance; the parity gap (the Flutter glyph) is recorded debt.
function ContentLine({ label, text }: { label: string; text: string }) {
  return (
    <View style={styles.line}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText>{text}</ThemedText>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
  },
  titleBlock: {
    gap: Spacing.two,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  swatch: {
    width: Spacing.four,
    height: Spacing.four,
    borderRadius: Radii.small,
  },
  title: {
    flex: 1,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  tag: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radii.pill,
  },
  lines: {
    gap: Spacing.three,
  },
  line: {
    gap: Spacing.half,
  },
  footer: {
    marginTop: Spacing.two,
  },
})
