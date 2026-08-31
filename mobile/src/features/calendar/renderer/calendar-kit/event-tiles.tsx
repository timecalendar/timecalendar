import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import {
  type AppLocale,
  formatTimeRange,
  MIN_TILE_WIDTH,
} from "@/features/calendar/data"
import {
  type ChecklistProgress,
  ChecklistProgressIndicator,
  checklistProgressLabel,
} from "@/features/event-checklists"
import { Radii, Spacing } from "@/theme"

import { type EventItem } from "./vendor"

export function CalendarKitEventTile({
  event,
  progress,
  width,
  locale,
  zone,
}: {
  event: EventItem
  progress: ChecklistProgress | undefined
  width: { value: number } | number
  locale: AppLocale
  zone: string
}) {
  const { t } = useTranslation()
  const resolvedWidth = typeof width === "number" ? width : width.value
  const title = event.title ?? ""
  const startsAt = event.startsAt as Date | undefined
  const endsAt = event.endsAt as Date | undefined
  const location = (event.location as string | undefined) ?? ""
  const time =
    startsAt && endsAt ? formatTimeRange(startsAt, endsAt, locale, zone) : ""
  const progressLabel = checklistProgressLabel(t, progress)
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={
        progressLabel === undefined
          ? t("calendar.event.label", { title, time, location })
          : t("calendar.event.labelWithProgress", {
              title,
              time,
              location,
              progress: progressLabel,
            })
      }
      style={[styles.tile, { backgroundColor: event.color }]}
    >
      {resolvedWidth >= MIN_TILE_WIDTH && (
        <>
          <ThemedText type="caption" themeColor="background" numberOfLines={5}>
            {title}
          </ThemedText>
          {location.length > 0 && (
            <ThemedText
              type="captionSmall"
              themeColor="background"
              numberOfLines={1}
            >
              {location}
            </ThemedText>
          )}
        </>
      )}
      <ChecklistProgressIndicator progress={progress} variant="compact" />
    </View>
  )
}

export function CalendarKitAllDayTile({
  event,
  progress,
  locale,
  zone,
}: {
  event: EventItem
  progress: ChecklistProgress | undefined
  locale: AppLocale
  zone: string
}) {
  const { t } = useTranslation()
  const title = event.title ?? ""
  const location = (event.location as string | undefined) ?? ""
  const startsAt = event.startsAt as Date | undefined
  const endsAt = event.endsAt as Date | undefined
  const time =
    event.allDay || !startsAt || !endsAt
      ? t("calendar.allDay")
      : formatTimeRange(startsAt, endsAt, locale, zone)
  const progressLabel = checklistProgressLabel(t, progress)
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={
        progressLabel === undefined
          ? t("calendar.event.label", { title, time, location })
          : t("calendar.event.labelWithProgress", {
              title,
              time,
              location,
              progress: progressLabel,
            })
      }
      style={styles.allDayTile}
    >
      <ThemedText type="captionSmall" themeColor="background" numberOfLines={1}>
        {title}
      </ThemedText>
      <ChecklistProgressIndicator progress={progress} variant="compact" />
    </View>
  )
}

const styles = StyleSheet.create({
  allDayTile: { paddingHorizontal: Spacing.half },
  tile: {
    flex: 1,
    padding: Spacing.one,
    borderRadius: Radii.small,
    overflow: "hidden",
  },
})
