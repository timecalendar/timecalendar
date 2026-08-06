import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  type LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native"

import { ThemedText } from "@/components/themed-text"
import {
  type AppLocale,
  type CalendarEvent,
  eventHeight,
  formatTimeRange,
  hourLabels,
  HOURS_COLUMN_WIDTH,
  layoutOverlaps,
  MIN_TILE_WIDTH,
  minuteToPixel,
  nowIndicatorPosition,
} from "@/features/calendar/data"
import { type HourRange } from "@/features/home/data"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

import { eventSurfaceColor } from "./event-surface"

// The home today mini-timeline (D5) — PRESENTATIONAL (70% floor) and the FIRST
// RENDERING consumer of the salvaged overlap engine (ADR 019's salvage payoff). A
// plain absolute-positioned grid (NOT @howljs/calendar-kit): hour lines + a hours
// column from `hourLabels`, event tiles placed by `layoutOverlaps` (horizontal
// column packing) + `minuteToPixel`/`eventHeight` (vertical placement, the salvaged
// math) at the Flutter-parity 70px/hour zoom. The hour window is the dynamic range
// from the home `dynamicHourRange` selector. A brand now-indicator shows only when
// the displayed day is today. Reuses MIN_TILE_WIDTH text-hiding for narrow columns.
// A designed brand surface from @/theme (R-3). Each tile a Pressable → onPressEvent.

// Flutter home zoom (`hourHeight = 70`) — a home concern passed as `pixelsPerHour`,
// not a grid constant (the day/week DEFAULT_PIXELS_PER_HOUR = 60 stays).
const HOME_PIXELS_PER_HOUR = 70
// The home content padding (Spacing.four each side, src/features/home home-screen
// styles.content) the screen-derived fallback subtracts before the first layout pass.
const CONTENT_HORIZONTAL_PADDING = Spacing.four * 2
const MIN_TARGET_SIZE = Platform.OS === "android" ? 48 : 44

function visibleGeometry(event: CalendarEvent, day: Date, range: HourRange) {
  const dayStart = new Date(day)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)
  const rangeStart = new Date(dayStart)
  rangeStart.setHours(range.startHour)
  const rangeEnd = range.endHour === 24 ? dayEnd : new Date(dayStart)
  if (range.endHour !== 24) rangeEnd.setHours(range.endHour)
  const start = new Date(
    Math.max(
      event.startsAt.getTime(),
      dayStart.getTime(),
      rangeStart.getTime(),
    ),
  )
  const end = new Date(
    Math.min(event.endsAt.getTime(), dayEnd.getTime(), rangeEnd.getTime()),
  )
  const startMinute =
    start.getTime() === dayStart.getTime()
      ? 0
      : start.getHours() * 60 + start.getMinutes()
  return {
    startMinute,
    durationMinutes: Math.max(0, (end.getTime() - start.getTime()) / 60000),
  }
}

export function TodayTimeline({
  events,
  range,
  locale,
  isToday,
  now,
  onPressEvent,
}: {
  events: CalendarEvent[]
  range: HourRange
  locale: AppLocale
  isToday: boolean
  now: Date
  onPressEvent: (event: CalendarEvent) => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const { width: windowWidth, fontScale } = useWindowDimensions()

  // Overlap columns are device-independent FRACTIONS (startX/endX); only the px
  // multiplier is dynamic. The tile area is flex:1, so its real width is measured
  // via onLayout. Before the first layout pass, fall back to a screen-derived width
  // (the bounded content width minus the hours column) so nothing renders 0-width.
  const fallbackWidth =
    Math.min(windowWidth, MaxContentWidth) -
    CONTENT_HORIZONTAL_PADDING -
    HOURS_COLUMN_WIDTH
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null)
  const tileAreaWidth = measuredWidth ?? Math.max(fallbackWidth, MIN_TILE_WIDTH)

  const onTileAreaLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width
    if (width > 0 && width !== measuredWidth) setMeasuredWidth(width)
  }

  const startMinute = range.startHour * 60
  const endMinute = range.endHour * 60
  const labels = hourLabels(startMinute, endMinute)
  const gridHeight = minuteToPixel(endMinute, {
    pixelsPerHour: HOME_PIXELS_PER_HOUR,
    startMinute,
  })

  const placed = layoutOverlaps(events)
  const usesReflowedList =
    fontScale >= 1.3 ||
    placed.some((entry) => {
      const width = (entry.endX - entry.startX) * tileAreaWidth
      const geometry = visibleGeometry(entry.item, now, range)
      const height = eventHeight(geometry.durationMinutes, HOME_PIXELS_PER_HOUR)
      return (
        (measuredWidth !== null && width < MIN_TARGET_SIZE) ||
        height < MIN_TARGET_SIZE
      )
    })
  const nowIndicator = isToday
    ? nowIndicatorPosition(now, {
        pixelsPerHour: HOME_PIXELS_PER_HOUR,
        startMinute,
        endMinute,
      })
    : { visible: false, pixel: 0, fraction: 0 }

  if (usesReflowedList) {
    return (
      <View style={styles.reflowedList} testID="today-timeline-list">
        {events.map((event) => {
          const time = formatTimeRange(event.startsAt, event.endsAt, locale)
          const location = event.location ?? ""
          return (
            <Pressable
              key={event.id}
              testID={`today-tile-${event.id}`}
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
              onPress={() => onPressEvent(event)}
              android_ripple={{ color: theme.ripple, foreground: true }}
              style={({ pressed }) => [
                styles.reflowedEvent,
                {
                  backgroundColor: eventSurfaceColor(event.color),
                },
                Platform.OS === "ios" && pressed && styles.iosPressed,
              ]}
            >
              <ThemedText type="small" themeColor="textSecondary">
                {time}
              </ThemedText>
              <ThemedText type="smallBold">{event.title}</ThemedText>
              {location.length > 0 && (
                <ThemedText type="small" themeColor="textSecondary">
                  {location}
                </ThemedText>
              )}
            </Pressable>
          )
        })}
      </View>
    )
  }

  return (
    <View style={styles.container} testID="today-timeline">
      <View style={[styles.hoursColumn, { height: gridHeight }]}>
        {labels.map((hour) => (
          <View
            key={hour}
            style={[
              styles.hourLine,
              {
                top: minuteToPixel(hour * 60, {
                  pixelsPerHour: HOME_PIXELS_PER_HOUR,
                  startMinute,
                }),
              },
            ]}
          >
            <ThemedText
              type="small"
              themeColor="textSecondary"
              accessibilityRole="text"
            >
              {`${String(hour).padStart(2, "0")}:00`}
            </ThemedText>
          </View>
        ))}
      </View>

      <View
        testID="today-tile-area"
        style={[styles.tileArea, { height: gridHeight }]}
        onLayout={onTileAreaLayout}
      >
        {labels.map((hour) => (
          <View
            key={hour}
            style={[
              styles.gridLine,
              {
                top: minuteToPixel(hour * 60, {
                  pixelsPerHour: HOME_PIXELS_PER_HOUR,
                  startMinute,
                }),
                backgroundColor: theme.backgroundSelected,
              },
            ]}
          />
        ))}

        {placed.map((entry) => {
          const event = entry.item
          const geometry = visibleGeometry(event, now, range)
          const top = minuteToPixel(geometry.startMinute, {
            pixelsPerHour: HOME_PIXELS_PER_HOUR,
            startMinute,
          })
          const height = eventHeight(
            geometry.durationMinutes,
            HOME_PIXELS_PER_HOUR,
          )
          const left = entry.startX * tileAreaWidth
          const width = (entry.endX - entry.startX) * tileAreaWidth
          const showText = width >= MIN_TILE_WIDTH
          const time = formatTimeRange(event.startsAt, event.endsAt, locale)
          const location = event.location ?? ""

          return (
            <Pressable
              key={event.id}
              testID={`today-tile-${event.id}`}
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
              onPress={() => onPressEvent(event)}
              android_ripple={{ color: theme.ripple, foreground: true }}
              style={({ pressed }) => [
                styles.tile,
                {
                  top,
                  left,
                  width,
                  height,
                  backgroundColor: eventSurfaceColor(event.color),
                },
                Platform.OS === "ios" && pressed && styles.iosPressed,
              ]}
            >
              {showText && (
                <>
                  <ThemedText type="small" numberOfLines={2}>
                    {event.title}
                  </ThemedText>
                  {location.length > 0 && (
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      numberOfLines={1}
                    >
                      {location}
                    </ThemedText>
                  )}
                </>
              )}
            </Pressable>
          )
        })}

        {nowIndicator.visible && (
          <View
            testID="today-now-indicator"
            accessibilityRole="text"
            accessibilityLabel={t("home.nowLabel")}
            style={[
              styles.nowIndicator,
              { top: nowIndicator.pixel, backgroundColor: theme.primary },
            ]}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
  hoursColumn: {
    width: HOURS_COLUMN_WIDTH,
    position: "relative",
  },
  hourLine: {
    position: "absolute",
    left: 0,
  },
  tileArea: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  tile: {
    position: "absolute",
    padding: Spacing.two,
    borderRadius: Radii.large,
    overflow: "hidden",
  },
  nowIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    borderRadius: Radii.pill,
  },
  reflowedList: {
    gap: Spacing.two,
  },
  reflowedEvent: {
    minHeight: MIN_TARGET_SIZE,
    padding: Spacing.two,
    borderRadius: Radii.large,
    justifyContent: "center",
    overflow: "hidden",
  },
  iosPressed: { opacity: 0.62 },
})
