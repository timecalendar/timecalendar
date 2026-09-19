import type { TFunction } from "i18next"
import type { RefObject } from "react"
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
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
  formatTimeRange,
  FULL_DAY_END_MINUTE,
  FULL_DAY_START_MINUTE,
  fullDayMajorMinutes,
  fullDayMinorMinutes,
  gridContentHeight,
  HOURS_COLUMN_WIDTH,
  minuteToPixel,
  type TimedTileV1,
  type WeekColumn,
  type WeekDirection,
} from "@/features/calendar/data"
import {
  ChecklistProgressIndicator,
  checklistProgressLabel,
} from "@/features/event-checklists"
import { useTheme } from "@/theme"

import type { CalendarPage } from "./owned-calendar-coordinator"
import {
  AnimatedPagerView,
  CENTER_PAGE,
  type usePagerPageScroll,
} from "./pager-page-scroll"

const MAJOR_MINUTES = fullDayMajorMinutes()
const MINOR_MINUTES = fullDayMinorMinutes()
/** Diameter of the indicator's leading cap — its non-color shape cue. */
const NOW_CAP_SIZE = 8

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

function useMinutePositionStyle(
  minute: number,
  pixelsPerHour: SharedValue<number>,
) {
  return useAnimatedStyle(() => ({
    top: minuteToPixel(minute, {
      startMinute: FULL_DAY_START_MINUTE,
      pixelsPerHour: pixelsPerHour.get(),
    }),
  }))
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
  displayZone,
  uses24HourClock,
  initialVerticalOffset,
  generation,
  geometryRevision,
  pages,
  pagerRef,
  scrollRef,
  nativeScrollGesture,
  nativePagerGesture,
  onScroll,
  onPageScroll,
  onPageSelected,
  onPageScrollStateChanged,
  onScrollBeginDrag,
  onScrollEndDrag,
  onViewportLayout,
  onMomentumScrollBegin,
  onMomentumScrollEnd,
  onAccessiblePageRequest,
  pixelsPerHour,
  settledPixelsPerHour,
  todayKey,
  nowMinuteOfDay,
  nowVisible,
  nowOnCommittedPage,
  nowLabel,
  t,
  onEventPress,
}: {
  heading: string
  mode: CalendarTimelineMode
  locale: AppLocale
  displayZone: string
  uses24HourClock: boolean | null
  initialVerticalOffset: number
  generation: number
  geometryRevision: number
  pages: CalendarPage[]
  pagerRef: RefObject<PagerView | null>
  scrollRef: AnimatedRef<ScrollView>
  nativeScrollGesture: GestureType
  nativePagerGesture: GestureType
  onScroll: ScrollHandlerProcessed<Record<string, unknown>>
  onPageScroll: ReturnType<typeof usePagerPageScroll>["onPageScroll"]
  onPageSelected: (event: PagerViewOnPageSelectedEvent) => void
  onPageScrollStateChanged: (event: PageScrollStateChangedNativeEvent) => void
  onScrollBeginDrag: () => void
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
  todayKey: string
  nowMinuteOfDay: number
  nowVisible: boolean
  nowOnCommittedPage: boolean
  nowLabel: string
  t: TFunction
  onEventPress: (uid: string) => void
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
        onScrollBeginDrag={onScrollBeginDrag}
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
            style={[
              styles.gutter,
              { borderColor: theme.separator },
              gutterHeightStyle,
            ]}
            pointerEvents="none"
          >
            {/* The 24 hour labels stay hidden from assistive technology; the
                current-time chip beside them is the one node that is not, so it
                can carry the localized "current time" semantics. */}
            <View
              testID="owned-calendar-hour-gutter-labels"
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              style={StyleSheet.absoluteFill}
            >
              {Array.from({ length: 24 }, (_, hour) => (
                <AnimatedHourLabel
                  key={hour}
                  hour={hour}
                  label={formatHourStartLabel(hour, locale, uses24HourClock)}
                  pixelsPerHour={pixelsPerHour}
                />
              ))}
            </View>
            {nowVisible && nowOnCommittedPage && (
              <AnimatedNowChip
                minuteOfDay={nowMinuteOfDay}
                label={nowLabel}
                accessibilityLabel={t("calendar.nowLabel", { time: nowLabel })}
                pixelsPerHour={pixelsPerHour}
              />
            )}
          </Animated.View>
          <GestureDetector gesture={nativePagerGesture}>
            <AnimatedPagerView
              ref={pagerRef}
              key={`${generation}:${geometryRevision}`}
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
            >
              {pages.map((page) => (
                <CalendarPageCanvas
                  key={page.key}
                  page={page}
                  pixelsPerHour={pixelsPerHour}
                  settledPixelsPerHour={settledPixelsPerHour}
                  todayKey={nowVisible ? todayKey : null}
                  nowMinuteOfDay={nowMinuteOfDay}
                  t={t}
                  locale={locale}
                  displayZone={displayZone}
                  onEventPress={onEventPress}
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
  const positionStyle = useMinutePositionStyle(hour * 60, pixelsPerHour)
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
  todayKey,
  nowMinuteOfDay,
  t,
  locale,
  displayZone,
  onEventPress,
}: {
  page: CalendarPage
  pixelsPerHour: SharedValue<number>
  settledPixelsPerHour: number
  todayKey: string | null
  nowMinuteOfDay: number
  t: TFunction
  locale: AppLocale
  displayZone: string
  onEventPress: (uid: string) => void
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
      accessibilityElementsHidden={page.direction !== 0}
      importantForAccessibility={
        page.direction === 0 ? "yes" : "no-hide-descendants"
      }
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
        todayKey={todayKey}
        nowMinuteOfDay={nowMinuteOfDay}
      />
      <CalendarTiles
        page={page}
        locale={locale}
        displayZone={displayZone}
        pixelsPerHour={pixelsPerHour}
        onEventPress={onEventPress}
        t={t}
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

function CalendarTiles({
  page,
  locale,
  displayZone,
  pixelsPerHour,
  onEventPress,
  t,
}: {
  page: CalendarPage
  locale: AppLocale
  displayZone: string
  pixelsPerHour: SharedValue<number>
  onEventPress: (uid: string) => void
  t: TFunction
}) {
  return (
    <View pointerEvents="box-none" style={styles.tileColumns}>
      {page.columns.map((column) => (
        <View
          key={column.key}
          pointerEvents="box-none"
          style={styles.tileColumn}
        >
          {column.tiles.map((tile) => (
            <TimedCalendarTile
              key={tile.key}
              tile={tile}
              locale={locale}
              displayZone={displayZone}
              pixelsPerHour={pixelsPerHour}
              accessible={page.direction === 0}
              onPress={() => onEventPress(tile.identity.uid)}
              t={t}
            />
          ))}
        </View>
      ))}
    </View>
  )
}

function TimedCalendarTile({
  tile,
  locale,
  displayZone,
  pixelsPerHour,
  accessible,
  onPress,
  t,
}: {
  tile: TimedTileV1
  locale: AppLocale
  displayZone: string
  pixelsPerHour: SharedValue<number>
  accessible: boolean
  onPress: () => void
  t: TFunction
}) {
  const positionStyle = useAnimatedStyle(() => ({
    top: minuteToPixel(tile.startMinute, {
      startMinute: FULL_DAY_START_MINUTE,
      pixelsPerHour: pixelsPerHour.get(),
    }),
    height: ((tile.endMinute - tile.startMinute) / 60) * pixelsPerHour.get(),
  }))
  const time = formatTimeRange(tile.startsAt, tile.endsAt, locale, displayZone)
  const progress = checklistProgressLabel(t, tile.checklist)
  const label = t(
    progress === undefined
      ? "calendar.event.label"
      : "calendar.event.labelWithProgress",
    {
      title: tile.title,
      time,
      location: tile.location ?? "",
      progress,
    },
  )
  return (
    <Animated.View
      testID={`owned-calendar-event-${tile.identity.uid}`}
      pointerEvents="box-none"
      style={[styles.tileAnchor, positionStyle]}
    >
      <Pressable
        accessible={accessible}
        accessibilityElementsHidden={!accessible}
        importantForAccessibility={accessible ? "yes" : "no-hide-descendants"}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={t("calendar.event.hint")}
        onPress={onPress}
        style={[styles.tile, { backgroundColor: tile.surfaceColor }]}
      >
        <ThemedText accessible={false} type="smallBold" numberOfLines={1}>
          {tile.title}
        </ThemedText>
        {tile.location !== undefined && (
          <ThemedText accessible={false} type="captionSmall" numberOfLines={1}>
            {tile.location}
          </ThemedText>
        )}
        <ChecklistProgressIndicator
          progress={tile.checklist}
          variant="compact"
        />
      </Pressable>
    </Animated.View>
  )
}

function CalendarGrid({
  direction,
  columns,
  pixelsPerHour,
  todayKey,
  nowMinuteOfDay,
}: {
  direction: number
  columns: WeekColumn[]
  pixelsPerHour: SharedValue<number>
  todayKey: string | null
  nowMinuteOfDay: number
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
          >
            {column.key === todayKey && (
              <AnimatedNowIndicator
                testID={`owned-calendar-now-${direction}-${column.key}`}
                minuteOfDay={nowMinuteOfDay}
                pixelsPerHour={pixelsPerHour}
                color={theme.primary}
              />
            )}
          </View>
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

// The current-time indicator. Its non-color cue is SHAPE: a filled cap at the
// leading edge of the rule, legible in greyscale and without colour perception.
// Vertical placement runs on the UI thread off the live pinch scale, so it
// tracks a zoom without a per-frame React state write.
function AnimatedNowIndicator({
  testID,
  minuteOfDay,
  pixelsPerHour,
  color,
}: {
  testID: string
  minuteOfDay: number
  pixelsPerHour: SharedValue<number>
  color: string
}) {
  const positionStyle = useMinutePositionStyle(minuteOfDay, pixelsPerHour)
  return (
    <Animated.View
      testID={testID}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.nowIndicator, positionStyle]}
    >
      <View style={[styles.nowIndicatorCap, { backgroundColor: color }]} />
      <View style={[styles.nowIndicatorRule, { backgroundColor: color }]} />
    </Animated.View>
  )
}

// The gutter's current-time chip — the TYPOGRAPHIC cue of the pair, and its one
// accessible node. It reads the same locale, display zone, and 12/24-hour
// convention as the hour labels it sits among.
function AnimatedNowChip({
  minuteOfDay,
  label,
  accessibilityLabel,
  pixelsPerHour,
}: {
  minuteOfDay: number
  label: string
  accessibilityLabel: string
  pixelsPerHour: SharedValue<number>
}) {
  const theme = useTheme()
  const positionStyle = useMinutePositionStyle(minuteOfDay, pixelsPerHour)
  return (
    <Animated.View style={[styles.nowChipAnchor, positionStyle]}>
      <View
        testID="owned-calendar-now-label"
        accessible
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.nowChip,
          { borderColor: theme.primary, backgroundColor: theme.background },
        ]}
      >
        <ThemedText accessible={false} type="smallBold" numberOfLines={1}>
          {label}
        </ThemedText>
      </View>
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
  const positionStyle = useMinutePositionStyle(minute, pixelsPerHour)
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
  nowIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    transform: [{ translateY: -NOW_CAP_SIZE / 2 }],
  },
  nowIndicatorCap: {
    width: NOW_CAP_SIZE,
    height: NOW_CAP_SIZE,
    borderRadius: NOW_CAP_SIZE / 2,
  },
  nowIndicatorRule: { flex: 1, height: 2 },
  nowChipAnchor: {
    position: "absolute",
    right: 4,
    left: 2,
    transform: [{ translateY: -10 }],
  },
  nowChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 1,
    alignItems: "center",
  },
  minorLine: { opacity: 0.5 },
  preview: { position: "absolute", top: 16, left: 16, gap: 4 },
  tileColumns: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
  },
  tileColumn: { flex: 1, position: "relative" },
  tileAnchor: { position: "absolute", left: 2, right: 2 },
  tile: {
    flex: 1,
    overflow: "hidden",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
})
