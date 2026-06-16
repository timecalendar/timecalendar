import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  type LayoutChangeEvent,
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
  const { width: windowWidth } = useWindowDimensions()

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
  const nowIndicator = isToday
    ? nowIndicatorPosition(now, {
        pixelsPerHour: HOME_PIXELS_PER_HOUR,
        startMinute,
        endMinute,
      })
    : { visible: false, pixel: 0, fraction: 0 }

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
          const top = minuteToPixel(
            event.startsAt.getHours() * 60 + event.startsAt.getMinutes(),
            { pixelsPerHour: HOME_PIXELS_PER_HOUR, startMinute },
          )
          const durationMinutes =
            (event.endsAt.getTime() - event.startsAt.getTime()) / 60000
          const height = eventHeight(durationMinutes, HOME_PIXELS_PER_HOUR)
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
              style={[
                styles.tile,
                {
                  top,
                  left,
                  width,
                  height: Math.max(height, 1),
                  backgroundColor: event.color,
                },
              ]}
            >
              {showText && (
                <>
                  <ThemedText
                    type="small"
                    themeColor="background"
                    numberOfLines={2}
                  >
                    {event.title}
                  </ThemedText>
                  {location.length > 0 && (
                    <ThemedText
                      type="small"
                      themeColor="background"
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
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  tile: {
    position: "absolute",
    padding: Spacing.one,
    borderRadius: Radii.small,
    overflow: "hidden",
  },
  nowIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    borderRadius: Radii.pill,
  },
})
