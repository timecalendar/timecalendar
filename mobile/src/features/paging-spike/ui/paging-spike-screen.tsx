/* eslint-disable i18next/no-literal-string -- dev-only spike with fixture copy */
import { useLocalSearchParams } from "expo-router"
import { useLayoutEffect, useRef, useState } from "react"
import {
  type LayoutChangeEvent,
  PixelRatio,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { GestureDetector } from "react-native-gesture-handler"
import Animated, {
  scrollTo,
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
  pageIndexOfDay,
  pageStartDay,
  todayEpochDay,
} from "@/features/paging-spike/data"

import {
  GUTTER,
  HEADER_HEIGHT,
  SharedGrid,
  SpikeHeader,
  SpikePager,
} from "./spike-chrome"
import { spikeCounters } from "./spike-counters"
import { PageWindow } from "./spike-page"
import { SpikePanel } from "./spike-panel"
import { useSpikePinch } from "./use-spike-pinch"

const WINDOW_RADIUS = 2
const PIXEL_RATIO = PixelRatio.get()
const CONTENT_RADIUS = { full: 260, small: 8 } as const
const REBASE_EDGE = { full: 30, small: 3 } as const

type ContentSize = keyof typeof CONTENT_RADIUS
type AndroidPaging = "snap" | "paging"

export function PagingSpikeScreen() {
  return isDevVariant() ? (
    <PagingSpike />
  ) : (
    <Text testID="paging-spike-unavailable">Not available</Text>
  )
}

function PagingSpike() {
  const params = useLocalSearchParams<{ android?: string; k?: string }>()
  const today = todayEpochDay()
  const todayPage = pageIndexOfDay(today)
  const [width, setWidth] = useState(0)
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
  const positioned = useSharedValue(false)
  const dragging = useSharedValue(false)
  const momentum = useSharedValue(false)
  const roundedIndex = useSharedValue(todayPage)
  const settledIndex = useSharedValue(todayPage)
  const contentStartIndex = useSharedValue(contentStart)
  const pageWidthValue = useSharedValue(pageWidth)

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

  const {
    liveScale,
    scrollLocked,
    pinch,
    verticalNative,
    horizontalNative,
    scrollProps,
    verticalHandler,
  } = useSpikePinch({
    verticalRef,
    focalTop: HEADER_HEIGHT,
    onPinchEnd: setPixelsPerHour,
  })

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
      positioned.set(true)
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

  // A pager locked mid-drag never received its lift, so it neither snapped nor
  // reported the drag's end.
  useAnimatedReaction(
    () => scrollLocked.get(),
    (locked, previous) => {
      if (locked || previous !== true) return
      dragging.set(false)
      momentum.set(false)
      const w = pageWidthValue.get()
      const x = scrollX.get()
      const page = Math.round(x / w)
      if (Math.abs(x - page * w) > 1 / PIXEL_RATIO) {
        scrollTo(horizontalRef, page * w, 0, true)
      } else {
        settleIfAligned(x)
      }
    },
  )

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
    if (nextPageWidth > 0) {
      pendingScroll.current = { index: settled, animated: false }
    }
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
            <SpikeHeader
              settled={settled}
              scrollX={scrollX}
              pages={windowPages}
              contentStart={contentStart}
              contentWidth={contentWidth}
              pageWidth={pageWidth}
              today={today}
            />
            <GestureDetector gesture={verticalNative}>
              <Animated.ScrollView
                ref={verticalRef}
                animatedProps={scrollProps}
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
                  <SharedGrid liveScale={liveScale} pageWidth={pageWidth} />
                  <SpikePager
                    key={contentSize}
                    scrollRef={horizontalRef}
                    gesture={horizontalNative}
                    scrollLocked={scrollLocked}
                    positioned={positioned}
                    pagingEnabled={pagingEnabled}
                    snapToInterval={snapToInterval}
                    onScroll={horizontalHandler}
                    pageWidth={pageWidth}
                    contentWidth={contentWidth}
                  >
                    <PageWindow
                      pages={windowPages}
                      contentStart={contentStart}
                      pageWidth={pageWidth}
                      today={today}
                      pixelsPerHour={pixelsPerHour}
                      scale={liveScale}
                      settled={settled}
                    />
                  </SpikePager>
                </Animated.View>
              </Animated.ScrollView>
            </GestureDetector>
          </View>
        </GestureDetector>
      ) : null}
      <SpikePanel
        status={`settled=${isoDate(pageStartDay(settled))} page=${settled - todayPage} base=${base - todayPage} pph=${pixelsPerHour.toFixed(0)} cross=${stats.crossings} settle=${stats.settles} rebase=${stats.rebases} pageMounts=${spikeCounters.pageMounts} commit=${stats.lastCommitMs.toFixed(1)}/${stats.maxCommitMs.toFixed(1)}ms`}
        androidPaging={androidPaging}
        radius={radius}
        onJump={(pages, animated) => jumpTo(settled + pages, animated)}
        onToday={() => jumpTo(todayPage, false)}
        onToggleAndroidPaging={() =>
          setAndroidPaging((mode) => (mode === "snap" ? "paging" : "snap"))
        }
        onToggleContentSize={() => {
          pendingScroll.current = { index: settled, animated: false }
          positioned.set(false)
          setBase(settled)
          setContentSize((size) => (size === "full" ? "small" : "full"))
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  body: { flex: 1 },
  vertical: { flex: 1 },
  day: { backgroundColor: "#ffffff" },
})
