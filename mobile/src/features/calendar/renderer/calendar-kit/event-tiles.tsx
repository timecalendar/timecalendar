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

type TileDimension = { value: number } | number

function resolveDimension(dimension: TileDimension): number {
  return typeof dimension === "number" ? dimension : dimension.value
}

export function CalendarKitEventTile({
  event,
  progress,
  width,
  height,
  locale,
  zone,
}: {
  event: EventItem
  progress: ChecklistProgress | undefined
  width: TileDimension
  height: TileDimension
  locale: AppLocale
  zone: string
}) {
  const { t } = useTranslation()
  const resolvedWidth = resolveDimension(width)
  const resolvedHeight = resolveDimension(height)
  const progressIsDense =
    progress !== undefined && (resolvedWidth < 48 || resolvedHeight < 32)
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
      testID="calendar-kit-event-tile"
      style={[
        styles.tile,
        progressIsDense && styles.denseTile,
        {
          backgroundColor: event.color,
          maxWidth: resolvedWidth,
          maxHeight: resolvedHeight,
        },
      ]}
    >
      {resolvedWidth >= MIN_TILE_WIDTH && !progressIsDense && (
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
      <ChecklistProgressIndicator
        progress={progress}
        variant="compact"
        bounds={{ width: resolvedWidth, height: resolvedHeight }}
      />
    </View>
  )
}

export function CalendarKitAllDayTile({
  event,
  progress,
  width,
  height,
  locale,
  zone,
}: {
  event: EventItem
  progress: ChecklistProgress | undefined
  width: TileDimension
  height: TileDimension
  locale: AppLocale
  zone: string
}) {
  const { t } = useTranslation()
  const resolvedWidth = resolveDimension(width)
  const resolvedHeight = resolveDimension(height)
  const showTitle = progress === undefined || resolvedWidth >= 64
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
      testID="calendar-kit-all-day-tile"
      style={[
        styles.allDayTile,
        { maxWidth: resolvedWidth, maxHeight: resolvedHeight },
      ]}
    >
      {showTitle && (
        <ThemedText
          type="captionSmall"
          themeColor="background"
          numberOfLines={1}
          style={styles.allDayTitle}
        >
          {title}
        </ThemedText>
      )}
      <ChecklistProgressIndicator
        progress={progress}
        variant="compact"
        bounds={{ width: resolvedWidth, height: resolvedHeight }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  allDayTile: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: Spacing.half,
    overflow: "hidden",
    paddingHorizontal: Spacing.half,
  },
  allDayTitle: { flex: 1 },
  denseTile: {
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  tile: {
    flex: 1,
    padding: Spacing.one,
    borderRadius: Radii.small,
    overflow: "hidden",
  },
})
