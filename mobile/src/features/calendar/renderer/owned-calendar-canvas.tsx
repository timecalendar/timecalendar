import type { ComponentProps, ReactNode } from "react"
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  PixelRatio,
  Platform,
  StyleSheet,
  View,
} from "react-native"
import { GestureDetector, type GestureType } from "react-native-gesture-handler"
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
  formatHourStartLabel,
  fullDayMajorMinutes,
  fullDayMinorMinutes,
  HOURS_COLUMN_WIDTH,
  minutePositionTop,
} from "@/features/calendar/data"
import { useTheme } from "@/theme"

import {
  dayRowHeight,
  PAGE_CONTENT_HEIGHT,
  type ScrollLockProps,
  useMinutePositionStyle,
} from "./owned-calendar-geometry"

const MAJOR_MINUTES = fullDayMajorMinutes()
const MINOR_MINUTES = fullDayMinorMinutes()
const HOURS = Array.from({ length: 23 }, (_, index) => index + 1)
const PIXEL_RATIO = PixelRatio.get()

export type HorizontalPager = {
  scrollHandler: ComponentProps<typeof Animated.ScrollView>["onScroll"]
  scrollProps: ScrollLockProps
  nativeGesture: GestureType
  onContentSizeChange: (width: number) => void
  positioned: SharedValue<boolean>
  pageWidth: number
  contentWidth: number
}

export function OwnedCalendarCanvas({
  mode,
  locale,
  uses24HourClock,
  initialVerticalOffset,
  scrollRef,
  verticalScrollProps,
  nativeScrollGesture,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  onViewportLayout,
  onMomentumScrollBegin,
  onMomentumScrollEnd,
  pixelsPerHour,
  settledPixelsPerHour,
  pagerRef,
  pager,
  children,
}: {
  mode: CalendarTimelineMode
  locale: AppLocale
  uses24HourClock: boolean | null
  initialVerticalOffset: number
  scrollRef: AnimatedRef<Animated.ScrollView>
  verticalScrollProps: ScrollLockProps
  nativeScrollGesture: GestureType
  onScroll: ScrollHandlerProcessed<Record<string, unknown>>
  onScrollBeginDrag: () => void
  onScrollEndDrag: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onViewportLayout: (event: LayoutChangeEvent) => void
  onMomentumScrollBegin: () => void
  onMomentumScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  pixelsPerHour: SharedValue<number>
  settledPixelsPerHour: number
  pagerRef: AnimatedRef<Animated.ScrollView>
  pager: HorizontalPager
  children: ReactNode
}) {
  const theme = useTheme()
  const fullDayRowStyle = useAnimatedStyle(() => ({
    height: dayRowHeight(pixelsPerHour.get()),
  }))

  return (
    <GestureDetector gesture={nativeScrollGesture}>
      <Animated.ScrollView
        ref={scrollRef}
        animatedProps={verticalScrollProps}
        testID="owned-calendar-canvas"
        collapsable={false}
        style={styles.viewport}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        // Android re-applies a `contentOffset` prop whenever the view's props
        // are re-sent, which the animated `scrollEnabled` does on every pinch.
        // There the first viewport measurement seeks instead.
        contentOffset={
          Platform.OS === "ios" ? { x: 0, y: initialVerticalOffset } : undefined
        }
        scrollsToTop={false}
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
        accessible={false}
      >
        <Animated.View
          testID="owned-calendar-day"
          style={[
            styles.fullDayRow,
            { borderColor: theme.separator },
            fullDayRowStyle,
          ]}
          collapsable={false}
        >
          <HourGutter
            locale={locale}
            uses24HourClock={uses24HourClock}
            pixelsPerHour={pixelsPerHour}
            settledPixelsPerHour={settledPixelsPerHour}
          />
          <HourLines
            pixelsPerHour={pixelsPerHour}
            settledPixelsPerHour={settledPixelsPerHour}
            background={theme.backgroundElement}
            color={theme.separator}
          />
          {pager.pageWidth > 0 && (
            <HorizontalPagerView key={mode} scrollRef={pagerRef} pager={pager}>
              {children}
            </HorizontalPagerView>
          )}
        </Animated.View>
      </Animated.ScrollView>
    </GestureDetector>
  )
}

// Android re-applies a `contentOffset` prop whenever the view's props are
// re-sent, which the animated `scrollEnabled` does, so the pager is placed with
// `scrollTo` once its content has laid out and stays hidden until it has moved.
function HorizontalPagerView({
  scrollRef,
  pager,
  children,
}: {
  scrollRef: AnimatedRef<Animated.ScrollView>
  pager: HorizontalPager
  children: ReactNode
}) {
  const visibility = useAnimatedStyle(() => ({
    opacity: pager.positioned.get() ? 1 : 0,
  }))
  return (
    <GestureDetector gesture={pager.nativeGesture}>
      <Animated.ScrollView
        ref={scrollRef}
        animatedProps={pager.scrollProps}
        testID="owned-calendar-pager"
        horizontal
        pagingEnabled={Platform.OS === "ios"}
        snapToInterval={
          Platform.OS === "android" ? pager.pageWidth + 1e-3 : undefined
        }
        disableIntervalMomentum
        decelerationRate="fast"
        directionalLockEnabled
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        accessible={false}
        importantForAccessibility="no"
        onScroll={pager.scrollHandler}
        onContentSizeChange={pager.onContentSizeChange}
        style={[styles.pager, { width: pager.pageWidth }, visibility]}
        contentContainerStyle={{
          width: pager.contentWidth,
          height: PAGE_CONTENT_HEIGHT,
        }}
      >
        {children}
      </Animated.ScrollView>
    </GestureDetector>
  )
}

function HourGutter({
  locale,
  uses24HourClock,
  pixelsPerHour,
  settledPixelsPerHour,
}: {
  locale: AppLocale
  uses24HourClock: boolean | null
  pixelsPerHour: SharedValue<number>
  settledPixelsPerHour: number
}) {
  const theme = useTheme()
  return (
    <View
      testID="owned-calendar-hour-gutter"
      style={[styles.gutter, { borderColor: theme.separator }]}
      pointerEvents="none"
    >
      <View
        testID="owned-calendar-hour-gutter-labels"
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={StyleSheet.absoluteFill}
      >
        {HOURS.map((hour) => (
          <HourLabel
            key={hour}
            hour={hour}
            label={formatHourStartLabel(hour, locale, uses24HourClock)}
            pixelsPerHour={pixelsPerHour}
            settledPixelsPerHour={settledPixelsPerHour}
          />
        ))}
      </View>
    </View>
  )
}

function HourLabel({
  hour,
  label,
  pixelsPerHour,
  settledPixelsPerHour,
}: {
  hour: number
  label: string
  pixelsPerHour: SharedValue<number>
  settledPixelsPerHour: number
}) {
  const positionStyle = useMinutePositionStyle(
    hour * 60,
    pixelsPerHour,
    settledPixelsPerHour,
    -6.5,
  )
  return (
    <Animated.View
      style={[
        styles.hourLabel,
        {
          top: minutePositionTop(
            hour * 60,
            settledPixelsPerHour,
            PIXEL_RATIO,
            -6.5,
          ),
        },
        positionStyle,
      ]}
    >
      <ThemedText
        type="captionSmall"
        themeColor="textSecondary"
        testID={`owned-calendar-hour-label-${hour}`}
        numberOfLines={1}
        maxFontSizeMultiplier={1.2}
      >
        {label}
      </ThemedText>
    </Animated.View>
  )
}

/** One hour-line layer shared by every page, behind the transparent pages. */
// It spans the viewport rather than the measured page width, so the grid is
// already drawn while the pager waits for its first layout and placement.
function HourLines({
  pixelsPerHour,
  settledPixelsPerHour,
  background,
  color,
}: {
  pixelsPerHour: SharedValue<number>
  settledPixelsPerHour: number
  background: string
  color: string
}) {
  return (
    <View
      testID="owned-calendar-hour-lines"
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.hourLines, { backgroundColor: background }]}
    >
      {MINOR_MINUTES.map((minute) => (
        <GridLine
          key={`minor-${minute}`}
          testID={`owned-calendar-minor-${minute}`}
          minute={minute}
          pixelsPerHour={pixelsPerHour}
          settledPixelsPerHour={settledPixelsPerHour}
          color={color}
          minor
        />
      ))}
      {MAJOR_MINUTES.map((minute) => (
        <GridLine
          key={`major-${minute}`}
          testID={`owned-calendar-major-${minute}`}
          minute={minute}
          pixelsPerHour={pixelsPerHour}
          settledPixelsPerHour={settledPixelsPerHour}
          color={color}
        />
      ))}
    </View>
  )
}

function GridLine({
  testID,
  minute,
  pixelsPerHour,
  settledPixelsPerHour,
  color,
  minor = false,
}: {
  testID: string
  minute: number
  pixelsPerHour: SharedValue<number>
  settledPixelsPerHour: number
  color: string
  minor?: boolean
}) {
  const positionStyle = useMinutePositionStyle(
    minute,
    pixelsPerHour,
    settledPixelsPerHour,
  )
  return (
    <Animated.View
      testID={testID}
      style={[
        styles.gridLine,
        minor && styles.minorLine,
        { backgroundColor: color },
        { top: minutePositionTop(minute, settledPixelsPerHour, PIXEL_RATIO) },
        positionStyle,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  viewport: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  fullDayRow: { overflow: "hidden", borderTopWidth: StyleSheet.hairlineWidth },
  gutter: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: HOURS_COLUMN_WIDTH,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  hourLabel: {
    position: "absolute",
    right: 6,
  },
  hourLines: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: HOURS_COLUMN_WIDTH,
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  minorLine: { opacity: 0.5 },
  pager: {
    position: "absolute",
    top: 0,
    left: HOURS_COLUMN_WIDTH,
    height: PAGE_CONTENT_HEIGHT,
  },
})
