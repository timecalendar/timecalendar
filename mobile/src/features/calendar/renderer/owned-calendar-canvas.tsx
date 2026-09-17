import type { TFunction } from "i18next"
import type { RefObject } from "react"
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native"
import { GestureDetector, type GestureType } from "react-native-gesture-handler"
import PagerView, {
  type PagerViewOnPageScrollEvent,
  type PagerViewOnPageSelectedEvent,
  type PageScrollStateChangedNativeEvent,
} from "react-native-pager-view"
import Animated, {
  type AnimatedRef,
  type ScrollHandlerProcessed,
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated"

import { ThemedText } from "@/components/themed-text"
import {
  type AppLocale,
  type CalendarTimelineMode,
  type CalendarTransitionSource,
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
} from "@/features/calendar/data"
import { useTheme } from "@/theme"

import type { CalendarPage } from "./owned-calendar-coordinator"
import {
  AnimatedPagerView,
  CENTER_PAGE,
  type usePagerPageScroll,
} from "./pager-page-scroll"

const MAJOR_MINUTES = fullDayMajorMinutes()
const MINOR_MINUTES = fullDayMinorMinutes()

function renderHeight(pixelsPerHour: number) {
  "worklet"
  return (
    gridContentHeight(
      FULL_DAY_START_MINUTE,
      FULL_DAY_END_MINUTE,
      pixelsPerHour,
    ) + StyleSheet.hairlineWidth
  )
}

function stableTintIndex(key: string) {
  return (
    Array.from(key).reduce((total, character) => {
      return total + character.charCodeAt(0)
    }, 0) % 3
  )
}

export function OwnedCalendarCanvas({
  heading,
  mode,
  locale,
  uses24HourClock,
  initialVerticalOffset,
  generation,
  pages,
  pagerRef,
  scrollRef,
  nativeScrollGesture,
  nativePagerGesture,
  onScroll,
  onPageScroll,
  onPageSelected,
  onPageScrollStateChanged,
  onScrollEndDrag,
  onViewportLayout,
  onMomentumScrollBegin,
  onMomentumScrollEnd,
  onAccessiblePageRequest,
  pixelsPerHour,
  settledPixelsPerHour,
  t,
}: {
  heading: string
  mode: CalendarTimelineMode
  locale: AppLocale
  uses24HourClock: boolean | null
  initialVerticalOffset: number
  generation: number
  pages: CalendarPage[]
  pagerRef: RefObject<PagerView | null>
  scrollRef: AnimatedRef<ScrollView>
  nativeScrollGesture: GestureType
  nativePagerGesture: GestureType
  onScroll: ScrollHandlerProcessed<Record<string, unknown>>
  onPageScroll: ReturnType<typeof usePagerPageScroll>["onPageScroll"]
  onPageSelected: (event: PagerViewOnPageSelectedEvent) => void
  onPageScrollStateChanged: (event: PageScrollStateChangedNativeEvent) => void
  onScrollEndDrag: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onViewportLayout: (event: LayoutChangeEvent) => void
  onMomentumScrollBegin: () => void
  onMomentumScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onAccessiblePageRequest: (
    direction: WeekDirection,
    source: CalendarTransitionSource,
  ) => void
  pixelsPerHour: SharedValue<number>
  settledPixelsPerHour: number
  t: TFunction
}) {
  const theme = useTheme()
  const fullDayRowStyle = useAnimatedStyle(() => ({
    height: renderHeight(pixelsPerHour.get()),
  }))
  const gutterHeightStyle = useAnimatedStyle(() => ({
    height: renderHeight(pixelsPerHour.get()),
  }))
  const pagerHeightStyle = useAnimatedStyle(() => ({
    height: renderHeight(pixelsPerHour.get()),
  }))

  return (
    <GestureDetector gesture={nativeScrollGesture}>
      <Animated.ScrollView
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
        onLayout={onViewportLayout}
        onScroll={onScroll}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollBegin={onMomentumScrollBegin}
        onMomentumScrollEnd={onMomentumScrollEnd}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={heading}
        accessibilityActions={[
          {
            name: "decrement",
            label: t(
              mode === "day"
                ? "calendar.previousDayLabel"
                : "calendar.previousWeekLabel",
            ),
          },
          {
            name: "increment",
            label: t(
              mode === "day"
                ? "calendar.nextDayLabel"
                : "calendar.nextWeekLabel",
            ),
          },
        ]}
        onAccessibilityAction={({ nativeEvent }) => {
          if (nativeEvent.actionName === "increment")
            onAccessiblePageRequest(1, "next")
          if (nativeEvent.actionName === "decrement")
            onAccessiblePageRequest(-1, "previous")
        }}
      >
        <Animated.View
          style={[styles.fullDayRow, fullDayRowStyle]}
          collapsable={false}
        >
          <Animated.View
            testID="owned-calendar-hour-gutter"
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            style={[
              styles.gutter,
              { borderColor: theme.separator },
              gutterHeightStyle,
            ]}
            pointerEvents="none"
          >
            {Array.from({ length: 24 }, (_, hour) => (
              <AnimatedHourLabel
                key={hour}
                hour={hour}
                label={formatHourStartLabel(hour, locale, uses24HourClock)}
                pixelsPerHour={pixelsPerHour}
              />
            ))}
          </Animated.View>
          <GestureDetector gesture={nativePagerGesture}>
            <AnimatedPagerView
              ref={pagerRef}
              key={generation}
              testID="owned-calendar-pager"
              style={[styles.pager, pagerHeightStyle]}
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
                <CalendarPageCanvas
                  key={page.key}
                  page={page}
                  pixelsPerHour={pixelsPerHour}
                  settledPixelsPerHour={settledPixelsPerHour}
                  t={t}
                />
              ))}
            </AnimatedPagerView>
          </GestureDetector>
        </Animated.View>
      </Animated.ScrollView>
    </GestureDetector>
  )
}

function AnimatedHourLabel({
  hour,
  label,
  pixelsPerHour,
}: {
  hour: number
  label: string
  pixelsPerHour: SharedValue<number>
}) {
  const positionStyle = useAnimatedStyle(() => ({
    top: minuteToPixel(hour * 60, {
      startMinute: FULL_DAY_START_MINUTE,
      pixelsPerHour: pixelsPerHour.get(),
    }),
  }))
  return (
    <Animated.View style={[styles.hourLabel, positionStyle]}>
      <ThemedText type="small" testID={`owned-calendar-hour-label-${hour}`}>
        {label}
      </ThemedText>
    </Animated.View>
  )
}

function CalendarPageCanvas({
  page,
  pixelsPerHour,
  settledPixelsPerHour,
  t,
}: {
  page: CalendarPage
  pixelsPerHour: SharedValue<number>
  settledPixelsPerHour: number
  t: TFunction
}) {
  const theme = useTheme()
  const pageHeightStyle = useAnimatedStyle(() => ({
    height: renderHeight(pixelsPerHour.get()),
  }))
  return (
    <Animated.View
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
        pageHeightStyle,
      ]}
    >
      <CalendarGrid
        direction={page.direction}
        columns={page.columns}
        pixelsPerHour={pixelsPerHour}
      />
      {__DEV__ && (
        <View style={styles.preview} pointerEvents="none">
          <ThemedText type="small">{page.key}</ThemedText>
          <ThemedText type="small">
            {t("calendar.weekPagingSize", {
              width: "100%",
              height: gridContentHeight(
                FULL_DAY_START_MINUTE,
                FULL_DAY_END_MINUTE,
                settledPixelsPerHour,
              ),
            })}
          </ThemedText>
        </View>
      )}
    </Animated.View>
  )
}

function CalendarGrid({
  direction,
  columns,
  pixelsPerHour,
}: {
  direction: number
  columns: WeekColumn[]
  pixelsPerHour: SharedValue<number>
}) {
  const theme = useTheme()
  const clockHeightStyle = useAnimatedStyle(() => ({
    height: renderHeight(pixelsPerHour.get()),
  }))
  return (
    <Animated.View
      testID={`owned-calendar-page-clock-${direction}`}
      style={[styles.clockPlane, clockHeightStyle]}
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
        <AnimatedGridLine
          key={`minor-${minute}`}
          testID={`owned-calendar-minor-${direction}-${minute}`}
          minute={minute}
          pixelsPerHour={pixelsPerHour}
          color={theme.separator}
          minor
        />
      ))}
      {MAJOR_MINUTES.map((minute) => (
        <AnimatedGridLine
          key={`major-${minute}`}
          testID={`owned-calendar-major-${direction}-${minute}`}
          minute={minute}
          pixelsPerHour={pixelsPerHour}
          color={theme.textSecondary}
        />
      ))}
    </Animated.View>
  )
}

function AnimatedGridLine({
  testID,
  minute,
  pixelsPerHour,
  color,
  minor = false,
}: {
  testID: string
  minute: number
  pixelsPerHour: SharedValue<number>
  color: string
  minor?: boolean
}) {
  const positionStyle = useAnimatedStyle(() => ({
    top: minuteToPixel(minute, {
      startMinute: FULL_DAY_START_MINUTE,
      pixelsPerHour: pixelsPerHour.get(),
    }),
  }))
  return (
    <Animated.View
      testID={testID}
      style={[
        styles.gridLine,
        minor && styles.minorLine,
        { backgroundColor: color },
        positionStyle,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  viewport: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  fullDayRow: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  gutter: {
    width: HOURS_COLUMN_WIDTH,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  pager: { flex: 1 },
  page: {
    width: "100%",
    overflow: "hidden",
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  clockPlane: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
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
