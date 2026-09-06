import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import {
  type AppLocale,
  type EventDetails,
  type EventDetailsTag,
  formatEventDateRange,
  formatFullDateTime,
} from "@/features/calendar/data"
import {
  effectiveCalendarName,
  useUserCalendars,
} from "@/features/calendar-sources"
import { EventChecklist } from "@/features/event-checklists"
import { Radii, Spacing } from "@/theme"

export function EventDetailsContent({
  event,
  locale,
  displayZone,
}: {
  event: EventDetails
  locale: AppLocale
  displayZone: string
}) {
  const { t } = useTranslation()
  const calendars = useUserCalendars()
  const heldCalendar =
    calendars.length < 2
      ? undefined
      : calendars.find((calendar) => calendar.id === event.userCalendarId)
  const calendarName =
    heldCalendar === undefined
      ? undefined
      : effectiveCalendarName(
          heldCalendar.name,
          t("userCalendars.namePlaceholder"),
        )

  return (
    <>
      <TitleBlock event={event} locale={locale} zone={displayZone} />
      <EventTags tags={event.tags} />
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
        {event.description !== undefined && event.description.length > 0 && (
          <ContentLine
            label={t("eventDetails.description")}
            text={event.description}
          />
        )}
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
        {t("eventDetails.updated", {
          date: formatFullDateTime(event.exportedAt, locale, displayZone),
        })}
      </ThemedText>
      <EventChecklist eventUid={event.id} />
    </>
  )
}

function TitleBlock({
  event,
  locale,
  zone,
}: {
  event: EventDetails
  locale: AppLocale
  zone: string
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
        {formatEventDateRange(
          event.startsAt,
          event.endsAt,
          locale,
          event.allDay,
          zone,
        )}
      </ThemedText>
    </View>
  )
}

function EventTags({ tags }: { tags: EventDetailsTag[] }) {
  if (tags.length === 0) return null

  const occurrences = new Map<string, number>()

  return (
    <View style={styles.tagRow}>
      {tags.map((tag) => {
        const valueKey = `${tag.name}\u0000${tag.color}\u0000${tag.icon}`
        const occurrence = occurrences.get(valueKey) ?? 0
        occurrences.set(valueKey, occurrence + 1)

        return <TagBubble key={`${valueKey}\u0000${occurrence}`} tag={tag} />
      })}
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
