import type { ComponentProps, ReactNode } from "react"
import { StyleSheet, Text, View } from "react-native"
import { GestureDetector, type GestureType } from "react-native-gesture-handler"
import Animated, {
  type AnimatedRef,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
} from "react-native-reanimated"

import {
  isoDate,
  MAX_CONTENT_HEIGHT,
  pageStartDay,
} from "@/features/paging-spike/data"

import { GridLine, HeaderWindow, HourLabel } from "./spike-page"

export const GUTTER = 50
export const HEADER_HEIGHT = 52

const GRID_MINUTES = Array.from({ length: 49 }, (_, index) => index * 30)
const HOURS = Array.from({ length: 23 }, (_, index) => index + 1)

export function SpikeHeader({
  settled,
  scrollX,
  pages,
  contentStart,
  contentWidth,
  pageWidth,
  today,
}: {
  settled: number
  scrollX: SharedValue<number>
  pages: number[]
  contentStart: number
  contentWidth: number
  pageWidth: number
  today: number
}) {
  const stripStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -scrollX.get() }],
  }))
  return (
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
          <HeaderWindow
            pages={pages}
            contentStart={contentStart}
            pageWidth={pageWidth}
            today={today}
          />
        </Animated.View>
      </View>
    </View>
  )
}

export function SharedGrid({
  liveScale,
  pageWidth,
}: {
  liveScale: SharedValue<number>
  pageWidth: number
}) {
  return (
    <>
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
    </>
  )
}

// Android re-applies a `contentOffset` prop whenever the view's props are
// re-sent, which a Reanimated `scrollEnabled` update does, so the pager is placed
// with `scrollTo` instead and stays hidden until it has moved there.
export function SpikePager({
  scrollRef,
  gesture,
  scrollLocked,
  positioned,
  pagingEnabled,
  snapToInterval,
  onScroll,
  pageWidth,
  contentWidth,
  children,
}: {
  scrollRef: AnimatedRef<Animated.ScrollView>
  gesture: GestureType
  scrollLocked: SharedValue<boolean>
  positioned: SharedValue<boolean>
  pagingEnabled: boolean
  snapToInterval: number | undefined
  onScroll: ComponentProps<typeof Animated.ScrollView>["onScroll"]
  pageWidth: number
  contentWidth: number
  children: ReactNode
}) {
  const scrollProps = useAnimatedProps(() => ({
    scrollEnabled: !scrollLocked.get(),
  }))
  const visibility = useAnimatedStyle(() => ({
    opacity: positioned.get() ? 1 : 0,
  }))
  return (
    <GestureDetector gesture={gesture}>
      <Animated.ScrollView
        ref={scrollRef}
        animatedProps={scrollProps}
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
        onScroll={onScroll}
        style={[styles.horizontal, { width: pageWidth }, visibility]}
        contentContainerStyle={{
          width: contentWidth,
          height: MAX_CONTENT_HEIGHT,
        }}
      >
        {children}
      </Animated.ScrollView>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
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
  gutter: { position: "absolute", top: 0, left: 0, width: GUTTER },
  gridLayer: { position: "absolute", top: 0, left: GUTTER },
  horizontal: {
    position: "absolute",
    top: 0,
    left: GUTTER,
    height: MAX_CONTENT_HEIGHT,
  },
})
