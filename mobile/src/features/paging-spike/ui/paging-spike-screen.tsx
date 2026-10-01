/* eslint-disable i18next/no-literal-string -- dev-only spike with fixture copy */
import { Stack, useLocalSearchParams } from "expo-router"
import { useLayoutEffect, useRef, useState } from "react"
import {
  type LayoutChangeEvent,
  PixelRatio,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  scrollTo,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated"
import { SafeAreaView } from "react-native-safe-area-context"
import { scheduleOnRN } from "react-native-worklets"

import { isDevVariant } from "@/config/variant"
import {
  DEFAULT_PIXELS_PER_HOUR,
  isoDate,
  MAX_CONTENT_HEIGHT,
  MAX_PIXELS_PER_HOUR,
  MIN_PIXELS_PER_HOUR,
  pageIndexOfDay,
  pageStartDay,
  todayEpochDay,
} from "@/features/paging-spike/data"

import {
  GridLine,
  HeaderSlot,
  HourLabel,
  spikeCounters,
  SpikePage,
} from "./spike-page"

const GUTTER = 50
const HEADER_HEIGHT = 52
const WINDOW_RADIUS = 2
const PIXEL_RATIO = PixelRatio.get()
const CONTENT_RADIUS = { full: 260, small: 8 } as const
const REBASE_EDGE = { full: 30, small: 3 } as const
const GRID_MINUTES = Array.from({ length: 49 }, (_, index) => index * 30)
const HOURS = Array.from({ length: 23 }, (_, index) => index + 1)

type ContentSize = keyof typeof CONTENT_RADIUS
type AndroidPaging = "snap" | "paging"

export function PagingSpikeScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {isDevVariant() ? (
        <PagingSpike />
      ) : (
        <Text testID="paging-spike-unavailable">Not available</Text>
      )}
    </>
  )
}

function PagingSpike() {
  const params = useLocalSearchParams<{ android?: string; k?: string }>()
  const today = todayEpochDay()
  const todayPage = pageIndexOfDay(today)
  const [width, setWidth] = useState(0)
  const [initialX, setInitialX] = useState(0)
  const [androidPaging, setAndroidPaging] = useState<AndroidPaging>(
    params.android === "paging" ? "paging" : "snap",
  )
  const [contentSize, setContentSize] = useState<ContentSize>(
    params.k === "small" ? "small" : "full",
  )
  const [base, setBase] = useState(todayPage)
  const [center, setCenter] = useState(todayPage)
  const [settled, setSettled] = useState(todayPage)
  const [pixelsPerHour, setPixelsPerHour] = useState(DEFAULT_PIXELS_PER_HOUR)
  const [stats, setStats] = useState({
    crossings: 0,
    settles: 0,
    rebases: 0,
    lastCommitMs: 0,
    maxCommitMs: 0,
  })

  const radius = CONTENT_RADIUS[contentSize]
  const contentStart = base - radius
  const pageWidth = Math.round((width - GUTTER) * PIXEL_RATIO) / PIXEL_RATIO
  const contentWidth = (2 * radius + 1) * pageWidth

  const horizontalRef = useAnimatedRef<Animated.ScrollView>()
  const verticalRef = useAnimatedRef<Animated.ScrollView>()
  const scrollX = useSharedValue(0)
  const dragging = useSharedValue(false)
  const momentum = useSharedValue(false)
  const roundedIndex = useSharedValue(todayPage)
  const settledIndex = useSharedValue(todayPage)
  const contentStartIndex = useSharedValue(contentStart)
  const pageWidthValue = useSharedValue(pageWidth)
  const liveScale = useSharedValue(DEFAULT_PIXELS_PER_HOUR)
  const verticalOffset = useSharedValue(0)
  const viewportHeight = useSharedValue(0)
  const pinchBaseScale = useSharedValue(DEFAULT_PIXELS_PER_HOUR)
  const pinchBaseOffset = useSharedValue(0)
  const pinchBaseFocal = useSharedValue(0)
  const pinchOffset = useSharedValue(-1)
  const pinching = useSharedValue(false)
  const verticalTouched = useSharedValue(false)
  const verticalLocked = useSharedValue(false)

  const crossingStartedAt = useRef(0)
  const crossingCount = useRef(0)
  const commitTimes = useRef({ last: 0, max: 0 })
  const pendingScroll = useRef<{ index: number; animated: boolean } | null>(
    null,
  )

  const onCross = (index: number) => {
    crossingStartedAt.current = performance.now()
    crossingCount.current += 1
    setCenter(index)
  }

  const onSettle = (index: number) => {
    setSettled(index)
    setCenter(index)
    setStats((previous) => ({
      ...previous,
      settles: previous.settles + 1,
      crossings: crossingCount.current,
      lastCommitMs: commitTimes.current.last,
      maxCommitMs: commitTimes.current.max,
    }))
    console.log(
      `PAGING_SPIKE settle page=${index} day=${isoDate(pageStartDay(index))}`,
    )
    if (Math.abs(index - base) > radius - REBASE_EDGE[contentSize]) {
      pendingScroll.current = { index, animated: false }
      setBase(index)
      setStats((previous) => ({ ...previous, rebases: previous.rebases + 1 }))
    }
  }

  const onPinchEnd = (scale: number) => {
    setPixelsPerHour(scale)
  }

  useLayoutEffect(() => {
    if (crossingStartedAt.current === 0) return
    const elapsed = performance.now() - crossingStartedAt.current
    crossingStartedAt.current = 0
    commitTimes.current = {
      last: elapsed,
      max: Math.max(commitTimes.current.max, elapsed),
    }
    console.log(`PAGING_SPIKE commit center=${center} ms=${elapsed.toFixed(1)}`)
  }, [center])

  useLayoutEffect(() => {
    contentStartIndex.set(contentStart)
    pageWidthValue.set(pageWidth)
    const pending = pendingScroll.current
    if (pending === null || pageWidth <= 0) return
    pendingScroll.current = null
    roundedIndex.set(pending.index)
    horizontalRef.current?.scrollTo({
      x: (pending.index - contentStart) * pageWidth,
      animated: pending.animated,
    })
  }, [
    contentStart,
    pageWidth,
    center,
    contentStartIndex,
    pageWidthValue,
    roundedIndex,
    horizontalRef,
  ])

  const settleIfAligned = (x: number) => {
    "worklet"
    if (dragging.get() || momentum.get()) return
    const w = pageWidthValue.get()
    const page = Math.round(x / w)
    if (Math.abs(x - page * w) > 1 / PIXEL_RATIO) return
    const index = contentStartIndex.get() + page
    if (index === settledIndex.get()) return
    settledIndex.set(index)
    scheduleOnRN(onSettle, index)
  }

  const horizontalHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const x = event.contentOffset.x
      scrollX.set(x)
      const w = pageWidthValue.get()
      if (w <= 0) return
      const index = contentStartIndex.get() + Math.round(x / w)
      if (index !== roundedIndex.get()) {
        roundedIndex.set(index)
        scheduleOnRN(onCross, index)
      }
      settleIfAligned(x)
    },
    onBeginDrag: () => {
      dragging.set(true)
      momentum.set(false)
    },
    onEndDrag: (event) => {
      dragging.set(false)
      settleIfAligned(event.contentOffset.x)
    },
    onMomentumBegin: () => {
      momentum.set(true)
    },
    onMomentumEnd: (event) => {
      momentum.set(false)
      settleIfAligned(event.contentOffset.x)
    },
  })

  const verticalHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      verticalOffset.set(event.contentOffset.y)
      viewportHeight.set(event.layoutMeasurement.height)
    },
  })

  useAnimatedReaction(
    () => pinchOffset.get(),
    (offset, previous) => {
      if (offset < 0 || offset === previous) return
      verticalOffset.set(offset)
      scrollTo(verticalRef, 0, offset, false)
    },
  )

  // While locked the vertical ScrollView ignores touches, so it neither follows
  // the pinch fingers nor flings on lift. It unlocks once its own touch ends: a
  // finger left down would otherwise scroll it by everything it moved meanwhile.
  const pinch = Gesture.Pinch()
    .onStart((event) => {
      pinching.set(true)
      verticalLocked.set(true)
      pinchBaseScale.set(liveScale.get())
      pinchBaseOffset.set(verticalOffset.get())
      pinchBaseFocal.set(event.focalY - HEADER_HEIGHT)
    })
    .onUpdate((event) => {
      const scale = Math.min(
        Math.max(pinchBaseScale.get() * event.scale, MIN_PIXELS_PER_HOUR),
        MAX_PIXELS_PER_HOUR,
      )
      const clockHour =
        (pinchBaseOffset.get() + pinchBaseFocal.get()) / pinchBaseScale.get()
      const maxOffset = Math.max(24 * scale - viewportHeight.get(), 0)
      const offset = Math.min(
        Math.max(clockHour * scale - (event.focalY - HEADER_HEIGHT), 0),
        maxOffset,
      )
      liveScale.set(scale)
      pinchOffset.set(offset)
    })
    .onEnd(() => {
      scheduleOnRN(onPinchEnd, liveScale.get())
    })
    .onFinalize(() => {
      pinching.set(false)
      if (!verticalTouched.get()) verticalLocked.set(false)
    })
  // A native handler is interruptible by default: the vertical ScrollView
  // activating mid-swipe cancels the horizontal one, which then never snaps.
  // Uninterruptible handlers keep a touch on whichever axis claims it first.
  const verticalNative = Gesture.Native()
    .disallowInterruption(true)
    .simultaneousWithExternalGesture(pinch)
    .onBegin(() => {
      verticalTouched.set(true)
    })
    .onFinalize(() => {
      verticalTouched.set(false)
      if (!pinching.get()) verticalLocked.set(false)
    })
  const horizontalNative = Gesture.Native()
    .disallowInterruption(true)
    .simultaneousWithExternalGesture(pinch)
  const verticalProps = useAnimatedProps(() => ({
    scrollEnabled: !verticalLocked.get(),
  }))

  const stripStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -scrollX.get() }],
  }))
  const dayHeightStyle = useAnimatedStyle(() => ({
    height: 24 * liveScale.get(),
  }))

  const jumpTo = (index: number, animated: boolean) => {
    pendingScroll.current = { index, animated }
    if (Math.abs(index - base) > radius - REBASE_EDGE[contentSize]) {
      setBase(index)
    }
    setCenter(index)
  }

  const onLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width
    if (nextWidth === width) return
    const nextPageWidth =
      Math.round((nextWidth - GUTTER) * PIXEL_RATIO) / PIXEL_RATIO
    pendingScroll.current = { index: settled, animated: false }
    setInitialX((settled - contentStart) * nextPageWidth)
    setWidth(nextWidth)
  }

  const windowPages = Array.from(
    { length: 2 * WINDOW_RADIUS + 1 },
    (_, offset) => center - WINDOW_RADIUS + offset,
  ).filter((index) => index >= contentStart && index <= base + radius)
  const pagingEnabled = Platform.OS === "ios" || androidPaging === "paging"
  const snapToInterval =
    Platform.OS === "android" && androidPaging === "snap"
      ? pageWidth + 1e-3
      : undefined

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={styles.root}
      onLayout={onLayout}
    >
      {pageWidth > 0 ? (
        <GestureDetector gesture={pinch}>
          <View style={styles.body}>
            <View style={styles.header}>
              <View style={styles.corner}>
                <Text style={styles.cornerText}>
                  {isoDate(pageStartDay(settled)).slice(5)}
                </Text>
              </View>
              <View style={[styles.headerViewport, { width: pageWidth }]}>
                <Animated.View
                  style={[styles.strip, { width: contentWidth }, stripStyle]}
                >
                  {windowPages.map((index) => (
                    <HeaderSlot
                      key={index}
                      pageIndex={index}
                      left={(index - contentStart) * pageWidth}
                      width={pageWidth}
                      today={today}
                    />
                  ))}
                </Animated.View>
              </View>
            </View>
            <GestureDetector gesture={verticalNative}>
              <Animated.ScrollView
                ref={verticalRef}
                animatedProps={verticalProps}
                testID="paging-spike-vertical"
                style={styles.vertical}
                onScroll={verticalHandler}
                scrollEventThrottle={16}
                directionalLockEnabled
                nestedScrollEnabled
              >
                <Animated.View
                  style={[
                    styles.day,
                    { height: 24 * pixelsPerHour },
                    dayHeightStyle,
                  ]}
                >
                  <View style={styles.gutter}>
                    {HOURS.map((hour) => (
                      <HourLabel key={hour} hour={hour} liveScale={liveScale} />
                    ))}
                  </View>
                  <View style={[styles.gridLayer, { width: pageWidth }]}>
                    {GRID_MINUTES.map((minute) => (
                      <GridLine
                        key={minute}
                        minute={minute}
                        liveScale={liveScale}
                        width={pageWidth}
                        major={minute % 60 === 0}
                      />
                    ))}
                  </View>
                  <GestureDetector gesture={horizontalNative}>
                    <Animated.ScrollView
                      ref={horizontalRef}
                      key={contentSize}
                      testID="paging-spike-horizontal"
                      horizontal
                      pagingEnabled={pagingEnabled}
                      snapToInterval={snapToInterval}
                      disableIntervalMomentum
                      decelerationRate="fast"
                      directionalLockEnabled
                      bounces={false}
                      overScrollMode="never"
                      showsHorizontalScrollIndicator={false}
                      scrollEventThrottle={16}
                      importantForAccessibility="no"
                      contentOffset={{ x: initialX, y: 0 }}
                      onScroll={horizontalHandler}
                      style={[styles.horizontal, { width: pageWidth }]}
                      contentContainerStyle={{
                        width: contentWidth,
                        height: MAX_CONTENT_HEIGHT,
                      }}
                    >
                      {windowPages.map((index) => (
                        <SpikePage
                          key={index}
                          pageIndex={index}
                          left={(index - contentStart) * pageWidth}
                          width={pageWidth}
                          today={today}
                          pixelsPerHour={pixelsPerHour}
                          scale={liveScale}
                          live={index === settled}
                        />
                      ))}
                    </Animated.ScrollView>
                  </GestureDetector>
                </Animated.View>
              </Animated.ScrollView>
            </GestureDetector>
          </View>
        </GestureDetector>
      ) : null}
      <SafeAreaView edges={["bottom"]} style={styles.panel}>
        <View style={styles.buttons}>
          <SpikeButton
            label="−20"
            onPress={() => jumpTo(settled - 20, false)}
          />
          <SpikeButton label="‹" onPress={() => jumpTo(settled - 1, true)} />
          <SpikeButton label="Today" onPress={() => jumpTo(todayPage, false)} />
          <SpikeButton label="›" onPress={() => jumpTo(settled + 1, true)} />
          <SpikeButton
            label="+20"
            onPress={() => jumpTo(settled + 20, false)}
          />
          {Platform.OS === "android" ? (
            <SpikeButton
              label={androidPaging}
              testID="paging-spike-android-mode"
              onPress={() =>
                setAndroidPaging((mode) =>
                  mode === "snap" ? "paging" : "snap",
                )
              }
            />
          ) : null}
          <SpikeButton
            label={`K=${radius}`}
            testID="paging-spike-content-size"
            onPress={() => {
              pendingScroll.current = { index: settled, animated: false }
              setInitialX(
                CONTENT_RADIUS[contentSize === "full" ? "small" : "full"] *
                  pageWidth,
              )
              setBase(settled)
              setContentSize((size) => (size === "full" ? "small" : "full"))
            }}
          />
        </View>
        <Text testID="paging-spike-status" style={styles.status}>
          {`settled=${isoDate(pageStartDay(settled))} page=${settled - todayPage} base=${base - todayPage} pph=${pixelsPerHour.toFixed(0)} cross=${stats.crossings} settle=${stats.settles} rebase=${stats.rebases} pageMounts=${spikeCounters.pageMounts} commit=${stats.lastCommitMs.toFixed(1)}/${stats.maxCommitMs.toFixed(1)}ms`}
        </Text>
      </SafeAreaView>
    </SafeAreaView>
  )
}

function SpikeButton({
  label,
  onPress,
  testID,
}: {
  label: string
  onPress: () => void
  testID?: string
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.button}
      {...(testID === undefined ? {} : { testID })}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  body: { flex: 1 },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#c7c7cc",
  },
  corner: { width: GUTTER, alignItems: "center", justifyContent: "center" },
  cornerText: { fontSize: 11, color: "#8e8e93" },
  headerViewport: { overflow: "hidden" },
  strip: { position: "absolute", top: 0, bottom: 0, left: 0 },
  vertical: { flex: 1 },
  day: { backgroundColor: "#ffffff" },
  gutter: { position: "absolute", top: 0, left: 0, width: GUTTER },
  gridLayer: { position: "absolute", top: 0, left: GUTTER },
  horizontal: {
    position: "absolute",
    top: 0,
    left: GUTTER,
    height: MAX_CONTENT_HEIGHT,
  },
  panel: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#c7c7cc",
    backgroundColor: "#f2f2f7",
  },
  buttons: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  button: {
    minHeight: 36,
    minWidth: 44,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontSize: 15, color: "#e91e63" },
  status: { fontSize: 10, color: "#3a3a3c", marginTop: 4 },
})
