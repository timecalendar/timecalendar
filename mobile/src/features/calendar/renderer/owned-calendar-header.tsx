import type { ViewStyle } from "react-native"
import { StyleSheet, View } from "react-native"
import Animated, { type AnimatedStyle } from "react-native-reanimated"

import { ThemedText } from "@/components/themed-text"
import {
  type AppLocale,
  formatDayHeaderParts,
  HOURS_COLUMN_WIDTH,
} from "@/features/calendar/data"
import { useTheme } from "@/theme"

import type { CalendarPage } from "./owned-calendar-coordinator"

export function OwnedCalendarDateHeader({
  pages,
  locale,
  displayZone,
  todayKey,
  todayLabel,
  stripStyle,
}: {
  pages: CalendarPage[]
  locale: AppLocale
  displayZone: string
  todayKey: string
  todayLabel: string
  stripStyle: AnimatedStyle<ViewStyle>
}) {
  const theme = useTheme()
  return (
    <View
      testID="owned-calendar-date-header"
      style={[
        styles.dateHeader,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.separator,
        },
      ]}
    >
      <View
        testID="owned-calendar-date-header-gutter"
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={[styles.dateHeaderGutter, { borderColor: theme.separator }]}
      />
      <View
        testID="owned-calendar-date-header-viewport"
        style={styles.dateHeaderViewport}
      >
        <Animated.View
          testID="owned-calendar-date-header-strip"
          pointerEvents="none"
          style={[styles.dateHeaderStrip, stripStyle]}
        >
          {pages.map((page) => (
            <View
              key={page.key}
              testID={`owned-calendar-date-header-slot-${page.direction}`}
              accessible={false}
              accessibilityElementsHidden={page.direction !== 0}
              importantForAccessibility={
                page.direction === 0 ? "auto" : "no-hide-descendants"
              }
              style={styles.dateHeaderSlot}
            >
              {page.columns.map((column) => {
                const parts = formatDayHeaderParts(
                  column.date,
                  locale,
                  displayZone,
                )
                const isToday = column.key === todayKey
                const dateLabel = `${parts.weekday} ${parts.dayOfMonth}`
                return (
                  <View
                    key={column.key}
                    testID={`owned-calendar-date-${page.direction}-${column.key}`}
                    accessible={page.direction === 0}
                    accessibilityLabel={
                      isToday ? `${dateLabel}, ${todayLabel}` : dateLabel
                    }
                    style={styles.dateHeaderCell}
                  >
                    <ThemedText
                      accessible={false}
                      type={isToday ? "smallBold" : "small"}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                      style={styles.weekdayLabel}
                    >
                      {parts.weekday}
                    </ThemedText>
                    <View
                      accessible={false}
                      style={[
                        styles.dateBadge,
                        isToday && {
                          borderColor: theme.primary,
                          backgroundColor: theme.primarySoft,
                        },
                      ]}
                    >
                      <ThemedText
                        accessible={false}
                        type={isToday ? "smallBold" : "small"}
                      >
                        {parts.dayOfMonth}
                      </ThemedText>
                    </View>
                  </View>
                )
              })}
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  dateHeader: {
    minHeight: 56,
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dateHeaderGutter: {
    width: HOURS_COLUMN_WIDTH,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  dateHeaderViewport: { flex: 1, overflow: "hidden" },
  dateHeaderStrip: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "-100%",
    width: "300%",
    flexDirection: "row",
  },
  dateHeaderSlot: { flex: 1, flexDirection: "row" },
  dateHeaderCell: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  weekdayLabel: { maxWidth: "100%" },
  dateBadge: {
    minWidth: 28,
    minHeight: 24,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
})
