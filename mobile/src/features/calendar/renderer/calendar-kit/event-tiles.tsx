import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import {
  type AppLocale,
  formatTimeRange,
  MIN_TILE_WIDTH,
} from "@/features/calendar/data"
import { Radii, Spacing } from "@/theme"

import { type EventItem } from "./vendor"

export function CalendarKitEventTile({
  event,
  width,
  locale,
  zone,
}: {
  event: EventItem
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
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={t("calendar.event.label", { title, time, location })}
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
    </View>
  )
}

export function CalendarKitAllDayTile({
  event,
  locale,
  zone,
}: {
  event: EventItem
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
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={t("calendar.event.label", { title, time, location })}
      style={styles.allDayTile}
    >
      <ThemedText type="captionSmall" themeColor="background" numberOfLines={1}>
        {title}
      </ThemedText>
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
