import type { TFunction } from "i18next"
import type { RefObject } from "react"
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native"
import PagerView, {
  type PagerViewOnPageScrollEvent,
  type PagerViewOnPageSelectedEvent,
  type PageScrollStateChangedNativeEvent,
} from "react-native-pager-view"

import { ThemedText } from "@/components/themed-text"
import {
  type AppLocale,
  DEFAULT_PIXELS_PER_HOUR,
  formatHourStartLabel,
  FULL_DAY_END_MINUTE,
  FULL_DAY_START_MINUTE,
  fullDayMajorMinutes,
  fullDayMinorMinutes,
  gridContentHeight,
  HOURS_COLUMN_WIDTH,
  minuteToPixel,
  type WeekColumn,
  type WeekDirection,
  type WeekTransitionSource,
} from "@/features/calendar/data"
import { useTheme } from "@/theme"

import type { CalendarPage } from "./owned-calendar-coordinator"
import {
  AnimatedPagerView,
  CENTER_PAGE,
  type usePagerPageScroll,
} from "./pager-page-scroll"

const CONTENT_HEIGHT = gridContentHeight(
  FULL_DAY_START_MINUTE,
  FULL_DAY_END_MINUTE,
  DEFAULT_PIXELS_PER_HOUR,
)
const RENDER_HEIGHT = CONTENT_HEIGHT + StyleSheet.hairlineWidth
const MAJOR_MINUTES = fullDayMajorMinutes()
const MINOR_MINUTES = fullDayMinorMinutes()

function stableTintIndex(key: string) {
  return (
    Array.from(key).reduce((total, character) => {
      return total + character.charCodeAt(0)
    }, 0) % 3
  )
}

export function OwnedCalendarCanvas({
  heading,
  locale,
  uses24HourClock,
  initialVerticalOffset,
  generation,
  pages,
  pagerRef,
  scrollRef,
  onPageScroll,
  onPageSelected,
  onPageScrollStateChanged,
  onScrollEndDrag,
  onMomentumScrollBegin,
  onMomentumScrollEnd,
  onAccessiblePageRequest,
  t,
}: {
  heading: string
  locale: AppLocale
  uses24HourClock: boolean | null
  initialVerticalOffset: number
  generation: number
  pages: CalendarPage[]
  pagerRef: RefObject<PagerView | null>
  scrollRef: RefObject<ScrollView | null>
  onPageScroll: ReturnType<typeof usePagerPageScroll>["onPageScroll"]
  onPageSelected: (event: PagerViewOnPageSelectedEvent) => void
  onPageScrollStateChanged: (event: PageScrollStateChangedNativeEvent) => void
  onScrollEndDrag: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onMomentumScrollBegin: () => void
  onMomentumScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onAccessiblePageRequest: (
    direction: WeekDirection,
    source: WeekTransitionSource,
  ) => void
  t: TFunction
}) {
  const theme = useTheme()
  return (
    <ScrollView
      ref={scrollRef}
      testID="owned-calendar-canvas"
      collapsable={false}
      style={styles.viewport}
      contentContainerStyle={styles.scrollContent}
      contentInsetAdjustmentBehavior="automatic"
      contentOffset={{ x: 0, y: initialVerticalOffset }}
      removeClippedSubviews={false}
      directionalLockEnabled
      nestedScrollEnabled
      scrollEventThrottle={16}
      onScrollEndDrag={onScrollEndDrag}
      onMomentumScrollBegin={onMomentumScrollBegin}
      onMomentumScrollEnd={onMomentumScrollEnd}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={heading}
      accessibilityActions={[
        { name: "decrement", label: t("calendar.previousWeekLabel") },
        { name: "increment", label: t("calendar.nextWeekLabel") },
      ]}
      onAccessibilityAction={({ nativeEvent }) => {
        if (nativeEvent.actionName === "increment")
          onAccessiblePageRequest(1, "next")
        if (nativeEvent.actionName === "decrement")
          onAccessiblePageRequest(-1, "previous")
      }}
    >
      <View style={styles.fullDayRow} collapsable={false}>
        <View
          testID="owned-calendar-hour-gutter"
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          style={[styles.gutter, { borderColor: theme.separator }]}
          pointerEvents="none"
        >
          {Array.from({ length: 24 }, (_, hour) => (
            <ThemedText
              key={hour}
              type="small"
              testID={`owned-calendar-hour-label-${hour}`}
              style={[
                styles.hourLabel,
                {
                  top: minuteToPixel(hour * 60, {
                    startMinute: FULL_DAY_START_MINUTE,
                  }),
                },
              ]}
            >
              {formatHourStartLabel(hour, locale, uses24HourClock)}
            </ThemedText>
          ))}
        </View>
        <AnimatedPagerView
          ref={pagerRef}
          key={generation}
          testID="owned-calendar-pager"
          style={styles.pager}
          initialPage={CENTER_PAGE}
          offscreenPageLimit={1}
          overdrag={false}
          onPageScroll={
            onPageScroll as unknown as (
              event: PagerViewOnPageScrollEvent,
            ) => void
          }
          onPageSelected={onPageSelected}
          onPageScrollStateChanged={onPageScrollStateChanged}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {pages.map((page) => (
            <View
              key={page.key}
              testID={`owned-calendar-page-${page.direction}`}
              collapsable={false}
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[
                styles.page,
                {
                  backgroundColor: __DEV__
                    ? [
                        theme.backgroundElement,
                        theme.homeHero,
                        theme.backgroundSelected,
                      ][stableTintIndex(page.key)]
                    : theme.backgroundElement,
                  borderColor: theme.separator,
                },
              ]}
            >
              <WeekGrid direction={page.direction} columns={page.columns} />
              {__DEV__ && (
                <View style={styles.preview} pointerEvents="none">
                  <ThemedText type="small">{page.key}</ThemedText>
                  <ThemedText type="small">
                    {t("calendar.weekPagingSize", {
                      width: "100%",
                      height: CONTENT_HEIGHT,
                    })}
                  </ThemedText>
                </View>
              )}
            </View>
          ))}
        </AnimatedPagerView>
      </View>
    </ScrollView>
  )
}

function WeekGrid({
  direction,
  columns,
}: {
  direction: number
  columns: WeekColumn[]
}) {
  const theme = useTheme()
  return (
    <View
      testID={`owned-calendar-page-clock-${direction}`}
      style={styles.clockPlane}
      pointerEvents="none"
    >
      <View style={styles.dayColumns}>
        {columns.map((column) => (
          <View
            key={column.key}
            testID={`owned-calendar-column-${direction}-${column.key}`}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            style={[styles.dayColumn, { borderColor: theme.separator }]}
          />
        ))}
      </View>
      {MINOR_MINUTES.map((minute) => (
        <View
          key={`minor-${minute}`}
          testID={`owned-calendar-minor-${direction}-${minute}`}
          style={[
            styles.gridLine,
            styles.minorLine,
            {
              top: minuteToPixel(minute, {
                startMinute: FULL_DAY_START_MINUTE,
              }),
              backgroundColor: theme.separator,
            },
          ]}
        />
      ))}
      {MAJOR_MINUTES.map((minute) => (
        <View
          key={`major-${minute}`}
          testID={`owned-calendar-major-${direction}-${minute}`}
          style={[
            styles.gridLine,
            {
              top: minuteToPixel(minute, {
                startMinute: FULL_DAY_START_MINUTE,
              }),
              backgroundColor: theme.textSecondary,
            },
          ]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  viewport: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  fullDayRow: {
    height: RENDER_HEIGHT,
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  gutter: {
    width: HOURS_COLUMN_WIDTH,
    height: RENDER_HEIGHT,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  pager: { flex: 1, height: RENDER_HEIGHT },
  page: {
    width: "100%",
    height: RENDER_HEIGHT,
    overflow: "hidden",
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  clockPlane: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: RENDER_HEIGHT,
  },
  dayColumns: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: "row",
  },
  dayColumn: { flex: 1, borderRightWidth: StyleSheet.hairlineWidth },
  hourLabel: {
    position: "absolute",
    right: 6,
    transform: [{ translateY: -8 }],
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  minorLine: { opacity: 0.5 },
  preview: { position: "absolute", top: 16, left: 16, gap: 4 },
})
