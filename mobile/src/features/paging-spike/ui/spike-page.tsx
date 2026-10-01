import { useEffect } from "react"
import { PixelRatio, StyleSheet, Text, View } from "react-native"
import Animated, {
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated"

import {
  DEFAULT_PIXELS_PER_HOUR,
  MAX_CONTENT_HEIGHT,
  pageDays,
  pageEvents,
  type SpikeEvent,
} from "@/features/paging-spike/data"

import { spikeCounters } from "./spike-counters"

const PIXEL_RATIO = PixelRatio.get()

const toPixel = (value: number) => {
  "worklet"
  return Math.round(value * PIXEL_RATIO) / PIXEL_RATIO
}

const CAP = toPixel(4)
// The middle slice reaches one device pixel under each cap: abutting slices
// leave an antialiased seam once a scaled edge lands between pixels.
const SEAM_OVERLAP = 1 / PIXEL_RATIO

// Live geometry is laid out once at this scale and follows the pinch through
// transforms only. A React commit that moved a `top` would land before the
// transform recomputed against it, and the view would jump for a frame.
const LAYOUT_PIXELS_PER_HOUR = DEFAULT_PIXELS_PER_HOUR

const minuteY = (minute: number, pixelsPerHour: number) => {
  "worklet"
  return toPixel((minute / 60) * pixelsPerHour)
}

export function GridLine({
  minute,
  liveScale,
  width,
  major,
}: {
  minute: number
  liveScale: SharedValue<number>
  width: number
  major: boolean
}) {
  const top = minuteY(minute, LAYOUT_PIXELS_PER_HOUR)
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: minuteY(minute, liveScale.get()) - top }],
  }))
  return (
    <Animated.View
      style={[
        styles.line,
        major ? styles.majorLine : styles.minorLine,
        { top, width },
        style,
      ]}
    />
  )
}

export function HourLabel({
  hour,
  liveScale,
}: {
  hour: number
  liveScale: SharedValue<number>
}) {
  const top = minuteY(hour * 60, LAYOUT_PIXELS_PER_HOUR) - 7
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: minuteY(hour * 60, liveScale.get()) - 7 - top }],
  }))
  return (
    <Animated.View style={[styles.hourLabel, { top }, style]}>
      <Text style={styles.hourText}>{`${hour}:00`}</Text>
    </Animated.View>
  )
}

type TileGeometry = {
  top: number
  left: number
  width: number
  height: number
  middleHeight: number
}

const tileGeometry = (
  event: SpikeEvent,
  columnWidth: number,
  pixelsPerHour: number,
): TileGeometry => {
  const top = minuteY(event.startMinute, pixelsPerHour)
  const height =
    minuteY(event.startMinute + event.durationMinutes, pixelsPerHour) - top
  const laneWidth = columnWidth / event.laneCount
  return {
    top,
    left: event.column * columnWidth + event.lane * laneWidth + 1,
    width: laneWidth - 2,
    height,
    middleHeight: Math.max(height - 2 * CAP, 0) + 2 * SEAM_OVERLAP,
  }
}

function TileText({ event }: { event: SpikeEvent }) {
  return (
    <>
      <Text style={styles.tileTitle}>{event.title}</Text>
      {`\n${event.location}`}
    </>
  )
}

// Pages other than the settled one never pinch, so their tiles carry no
// animated styles: a window shift then mounts plain views only.
function StaticTile({
  event,
  columnWidth,
  pixelsPerHour,
}: {
  event: SpikeEvent
  columnWidth: number
  pixelsPerHour: number
}) {
  const { top, left, width, height, middleHeight } = tileGeometry(
    event,
    columnWidth,
    pixelsPerHour,
  )
  return (
    <View style={[styles.tile, { top, left, width, height }]}>
      <View style={[styles.slice, styles.topCap]} />
      <View style={[styles.slice, styles.middle, { height: middleHeight }]} />
      <View style={[styles.slice, styles.bottomCap, { top: height - CAP }]} />
      <View style={[styles.clip, { height }]}>
        <Text style={styles.tileText} numberOfLines={4}>
          <TileText event={event} />
        </Text>
      </View>
    </View>
  )
}

function LiveTile({
  event,
  columnWidth,
  scale,
}: {
  event: SpikeEvent
  columnWidth: number
  scale: SharedValue<number>
}) {
  const { top, left, width, height, middleHeight } = tileGeometry(
    event,
    columnWidth,
    LAYOUT_PIXELS_PER_HOUR,
  )

  // Each updater reads `scale` itself: Reanimated subscribes a style only to the
  // shared values its updater captures, not to those of a worklet it calls.
  const liveHeight = (s: number) => {
    "worklet"
    const liveTop = minuteY(event.startMinute, s)
    return {
      delta: liveTop - top,
      height: minuteY(event.startMinute + event.durationMinutes, s) - liveTop,
    }
  }
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: liveHeight(scale.get()).delta }],
  }))
  const middleStyle = useAnimatedStyle(() => {
    const next =
      Math.max(liveHeight(scale.get()).height - 2 * CAP, 0) + 2 * SEAM_OVERLAP
    return { transform: [{ scaleY: next / middleHeight }] }
  })
  const bottomCapStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: Math.max(liveHeight(scale.get()).height, 2 * CAP) - height,
      },
    ],
  }))
  const clipStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: Math.max(liveHeight(scale.get()).height, 1) / height },
    ],
  }))
  const textStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: height / Math.max(liveHeight(scale.get()).height, 1) },
    ],
  }))

  return (
    <Animated.View
      style={[styles.tile, { top, left, width, height }, containerStyle]}
    >
      <View style={[styles.slice, styles.topCap]} />
      <Animated.View
        style={[
          styles.slice,
          styles.middle,
          { height: middleHeight },
          middleStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.slice,
          styles.bottomCap,
          { top: height - CAP },
          bottomCapStyle,
        ]}
      />
      <Animated.View style={[styles.clip, { height }, clipStyle]}>
        <Animated.Text style={[styles.tileText, textStyle]} numberOfLines={4}>
          <TileText event={event} />
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  )
}

function NowLine({
  minute,
  left,
  width,
  liveScale,
}: {
  minute: number
  left: number
  width: number
  liveScale: SharedValue<number>
}) {
  const top = minuteY(minute, LAYOUT_PIXELS_PER_HOUR)
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: minuteY(minute, liveScale.get()) - top }],
  }))
  return <Animated.View style={[styles.nowLine, { left, width, top }, style]} />
}

export function PageWindow({
  pages,
  contentStart,
  pageWidth,
  today,
  pixelsPerHour,
  scale,
  settled,
}: {
  pages: number[]
  contentStart: number
  pageWidth: number
  today: number
  pixelsPerHour: number
  scale: SharedValue<number>
  settled: number
}) {
  return (
    <>
      {pages.map((index) => (
        <SpikePage
          key={index}
          pageIndex={index}
          left={(index - contentStart) * pageWidth}
          width={pageWidth}
          today={today}
          pixelsPerHour={pixelsPerHour}
          scale={scale}
          live={index === settled}
        />
      ))}
    </>
  )
}

export function HeaderWindow({
  pages,
  contentStart,
  pageWidth,
  today,
}: {
  pages: number[]
  contentStart: number
  pageWidth: number
  today: number
}) {
  return (
    <>
      {pages.map((index) => (
        <HeaderSlot
          key={index}
          pageIndex={index}
          left={(index - contentStart) * pageWidth}
          width={pageWidth}
          today={today}
        />
      ))}
    </>
  )
}

function SpikePage({
  pageIndex,
  left,
  width,
  today,
  pixelsPerHour,
  scale,
  live,
}: {
  pageIndex: number
  left: number
  width: number
  today: number
  pixelsPerHour: number
  scale: SharedValue<number>
  live: boolean
}) {
  useEffect(() => {
    spikeCounters.pageMounts += 1
  }, [])
  const columnWidth = width / 7
  const days = pageDays(pageIndex, today)
  const nowMinute = new Date().getHours() * 60 + new Date().getMinutes()

  return (
    <View style={[styles.page, { left, width }]} collapsable={false}>
      {days.map((day, column) => (
        <View
          key={day.epochDay}
          style={[
            styles.separator,
            { left: column * columnWidth },
            day.isToday && styles.todayColumn,
            day.isToday && { width: columnWidth },
          ]}
        />
      ))}
      {days.map((day, column) =>
        day.isToday ? (
          <NowLine
            key="now"
            minute={nowMinute}
            left={column * columnWidth}
            width={columnWidth}
            liveScale={scale}
          />
        ) : null,
      )}
      {pageEvents(pageIndex).map((event) =>
        live ? (
          <LiveTile
            key={event.key}
            event={event}
            columnWidth={columnWidth}
            scale={scale}
          />
        ) : (
          <StaticTile
            key={event.key}
            event={event}
            columnWidth={columnWidth}
            pixelsPerHour={pixelsPerHour}
          />
        ),
      )}
    </View>
  )
}

function HeaderSlot({
  pageIndex,
  left,
  width,
  today,
}: {
  pageIndex: number
  left: number
  width: number
  today: number
}) {
  return (
    <View style={[styles.headerSlot, { left, width }]}>
      {pageDays(pageIndex, today).map((day) => (
        <View key={day.epochDay} style={styles.headerCell}>
          <Text style={styles.headerWeekday}>{day.weekday}</Text>
          <Text style={[styles.headerDay, day.isToday && styles.headerToday]}>
            {day.dayOfMonth}
          </Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  line: { position: "absolute", left: 0, height: StyleSheet.hairlineWidth },
  majorLine: { backgroundColor: "#c7c7cc" },
  minorLine: { backgroundColor: "#e5e5ea" },
  hourLabel: { position: "absolute", left: 0, right: 4, height: 14 },
  hourText: { fontSize: 11, color: "#8e8e93", textAlign: "right" },
  page: { position: "absolute", top: 0, height: MAX_CONTENT_HEIGHT },
  separator: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: "#d1d1d6",
  },
  todayColumn: { backgroundColor: "rgba(233,30,99,0.05)" },
  nowLine: { position: "absolute", height: 2, backgroundColor: "#e91e63" },
  tile: { position: "absolute" },
  slice: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#fce4ec",
    borderLeftWidth: 3,
    borderLeftColor: "#e91e63",
  },
  topCap: {
    top: 0,
    height: CAP,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  middle: { top: CAP - SEAM_OVERLAP, transformOrigin: "top" },
  bottomCap: {
    height: CAP,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  clip: {
    position: "absolute",
    top: 0,
    left: 6,
    right: 2,
    overflow: "hidden",
    transformOrigin: "top",
  },
  tileText: {
    fontSize: 11,
    color: "#3a0b1c",
    paddingTop: 3,
    transformOrigin: "top",
  },
  tileTitle: { fontWeight: "600" },
  headerSlot: { position: "absolute", top: 0, bottom: 0, flexDirection: "row" },
  headerCell: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerWeekday: { fontSize: 11, color: "#8e8e93" },
  headerDay: { fontSize: 17, fontWeight: "600", color: "#1c1c1e" },
  headerToday: { color: "#e91e63" },
})
