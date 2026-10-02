import { StyleSheet, useWindowDimensions, View } from "react-native"
import Animated, {
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated"

import { ThemedText } from "@/components/themed-text"
import {
  HOURS_COLUMN_WIDTH,
  type PagePresentationV1,
} from "@/features/calendar/data"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { useTheme } from "@/theme"

import { pagingLog } from "./owned-calendar-paging-log"

export type HeaderPage = {
  presentation: PagePresentationV1
  left: number
  committed: boolean
}

export function OwnedCalendarDateHeader({
  registerHeading,
  pages,
  pageWidth,
  contentWidth,
  scrollX,
  positioned,
  heading,
  controlSymbol,
  previousPageLabel,
  nextPageLabel,
  onAccessiblePageRequest,
  todayKey,
  todayLabel,
}: {
  registerHeading: (dateKey: string, node: View | null) => void
  pages: readonly HeaderPage[]
  pageWidth: number
  contentWidth: number
  scrollX: SharedValue<number>
  positioned: SharedValue<boolean>
  heading: string
  controlSymbol: string
  previousPageLabel: string
  nextPageLabel: string
  onAccessiblePageRequest: (direction: -1 | 1) => void
  todayKey: string
  todayLabel: string
}) {
  const theme = useTheme()
  const { fontScale } = useWindowDimensions()
  const stripStyle = useAnimatedStyle(() => ({
    opacity: positioned.get() ? 1 : 0,
    transform: [{ translateX: -scrollX.get() }],
  }))
  return (
    <View
      testID="owned-calendar-date-header"
      style={[
        styles.dateHeader,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.separator,
          minHeight: Math.max(56, 40 + 13 * fontScale),
        },
      ]}
    >
      <View
        testID="owned-calendar-page-control"
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={heading}
        accessibilityActions={[
          { name: "decrement", label: previousPageLabel },
          { name: "increment", label: nextPageLabel },
        ]}
        onAccessibilityAction={({ nativeEvent }) => {
          if (nativeEvent.actionName === "increment") onAccessiblePageRequest(1)
          if (nativeEvent.actionName === "decrement")
            onAccessiblePageRequest(-1)
        }}
        style={[styles.dateHeaderGutter, { borderColor: theme.separator }]}
      >
        <ThemedText
          accessible={false}
          maxFontSizeMultiplier={1.5}
          style={styles.pageControlIcon}
        >
          {controlSymbol}
        </ThemedText>
      </View>
      <View
        testID="owned-calendar-date-header-viewport"
        style={styles.dateHeaderViewport}
      >
        <Animated.View
          testID="owned-calendar-date-header-strip"
          pointerEvents="none"
          style={[styles.dateHeaderStrip, { width: contentWidth }, stripStyle]}
        >
          {pages.map((page) => (
            <HeaderSlot
              key={page.presentation.pageKey}
              presentation={page.presentation}
              left={page.left}
              width={pageWidth}
              committed={page.committed}
              todayKey={todayKey}
              todayLabel={todayLabel}
              registerHeading={registerHeading}
            />
          ))}
        </Animated.View>
      </View>
    </View>
  )
}

function HeaderSlot({
  presentation,
  left,
  width,
  committed,
  todayKey,
  todayLabel,
  registerHeading,
}: {
  presentation: PagePresentationV1
  left: number
  width: number
  committed: boolean
  todayKey: string
  todayLabel: string
  registerHeading: (dateKey: string, node: View | null) => void
}) {
  const theme = useTheme()
  const colorScheme = useColorScheme()
  pagingLog.render("slot")
  const dateColor = colorScheme === "dark" ? theme.textSecondary : theme.text
  const weekdayFontSize = Math.min(
    11,
    Math.max(8, (width / presentation.columns.length - 8) * 0.75),
  )
  const badgeSize = Math.min(
    32,
    Math.max(24, width / presentation.columns.length - 2),
  )
  return (
    <View
      testID={`owned-calendar-date-header-slot-${presentation.pageKey}`}
      accessible={false}
      accessibilityElementsHidden={!committed}
      importantForAccessibility={committed ? "auto" : "no-hide-descendants"}
      style={[styles.dateHeaderSlot, { left, width }]}
    >
      {presentation.columns.map((column) => {
        const isToday = column.key === todayKey
        return (
          <View
            ref={(node) => {
              if (committed) registerHeading(column.key, node)
            }}
            key={column.key}
            testID={`owned-calendar-date-${column.key}`}
            accessible={committed}
            accessibilityRole={committed ? "header" : undefined}
            accessibilityLabel={
              isToday
                ? `${column.header.label}, ${todayLabel}`
                : column.header.label
            }
            style={styles.dateHeaderCell}
          >
            <ThemedText
              accessible={false}
              numberOfLines={1}
              maxFontSizeMultiplier={Math.max(
                1,
                (width / presentation.columns.length - 8) / weekdayFontSize,
              )}
              style={[
                styles.weekdayLabel,
                {
                  color: isToday ? theme.primary : dateColor,
                  fontSize: weekdayFontSize,
                  lineHeight: weekdayFontSize + 2,
                },
              ]}
            >
              {column.header.narrowWeekday}
            </ThemedText>
            <View
              accessible={false}
              style={[
                styles.dateBadge,
                {
                  width: badgeSize,
                  height: badgeSize,
                  borderRadius: badgeSize / 2,
                },
                isToday && { backgroundColor: theme.primary },
              ]}
            >
              <ThemedText
                accessible={false}
                numberOfLines={1}
                maxFontSizeMultiplier={Math.min(1.25, (badgeSize - 4) / 20)}
                style={[
                  styles.dayNumber,
                  { color: isToday ? theme.background : dateColor },
                ]}
              >
                {column.header.dayOfMonth}
              </ThemedText>
            </View>
          </View>
        )
      })}
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
    minHeight: 56,
    borderRightWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  pageControlIcon: { fontSize: 17, fontWeight: "600" },
  dateHeaderViewport: { flex: 1, overflow: "hidden" },
  dateHeaderStrip: { position: "absolute", top: 0, bottom: 0, left: 0 },
  dateHeaderSlot: {
    position: "absolute",
    top: 0,
    bottom: 0,
    flexDirection: "row",
  },
  dateHeaderCell: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  weekdayLabel: {
    maxWidth: "100%",
    fontSize: 11,
    lineHeight: 13,
    fontWeight: 500,
  },
  dayNumber: {
    width: "100%",
    height: "100%",
    fontSize: 20,
    fontWeight: 700,
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  dateBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
})
