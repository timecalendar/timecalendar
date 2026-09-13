import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { useTranslation } from "react-i18next"
import {
  AppState,
  type LayoutChangeEvent,
  StyleSheet,
  View,
} from "react-native"
import {
  type GestureEvent,
  type HandlerStateChangeEvent,
  PanGestureHandler,
  type PanGestureHandlerEventPayload,
  State,
} from "react-native-gesture-handler"
import Animated, {
  cancelAnimation,
  type SharedValue,
  useAnimatedStyle,
  useEvent,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets"

import { ThemedText } from "@/components/themed-text"
import {
  type AppLocale,
  clampVerticalOffset,
  dayKey,
  DEFAULT_PIXELS_PER_HOUR,
  formatHourStartLabel,
  FULL_DAY_END_MINUTE,
  FULL_DAY_START_MINUTE,
  fullDayMajorMinutes,
  fullDayMinorMinutes,
  gridContentHeight,
  HOURS_COLUMN_WIDTH,
  minuteToPixel,
  shiftWeekInZone,
  type WeekDirection,
  type WeekTransitionRequest,
  type WeekTransitionSource,
} from "@/features/calendar/data"
import { useTheme } from "@/theme"

import {
  createGestureDecision,
  type GestureDecision,
  terminateGestureDecision,
  updateGestureDecision,
} from "./gesture-state"

const SETTLE_DURATION_MS = 220
const PAGE_THRESHOLD_RATIO = 0.2
const FLING_VELOCITY = 500
const VERTICAL_FLING_PROJECTION_SECONDS = 0.15
const PAGE_DIRECTIONS = [-1, 0, 1] as const
const CONTENT_HEIGHT = gridContentHeight(
  FULL_DAY_START_MINUTE,
  FULL_DAY_END_MINUTE,
  DEFAULT_PIXELS_PER_HOUR,
)
const MAJOR_MINUTES = fullDayMajorMinutes()
const MINOR_MINUTES = fullDayMinorMinutes()

function restingTranslation(pagePosition: number, pageWidth: number) {
  "worklet"
  return pagePosition === 0 ? 0 : -pagePosition * pageWidth
}

function applyLayout(
  event: LayoutChangeEvent,
  {
    pagePosition,
    motionEpoch,
    translation,
    verticalOffset,
    verticalResting,
    viewportHeight,
    width,
    gesture,
    dragging,
    canStartDrag,
    settling,
    setPageWidth,
    cancelPending,
    onVerticalOffsetSettled,
  }: {
    pagePosition: number
    motionEpoch: SharedValue<number>
    translation: SharedValue<number>
    verticalOffset: SharedValue<number>
    verticalResting: SharedValue<number>
    viewportHeight: SharedValue<number>
    width: SharedValue<number>
    gesture: SharedValue<GestureDecision>
    dragging: SharedValue<boolean>
    canStartDrag: SharedValue<boolean>
    settling: SharedValue<boolean>
    setPageWidth: (width: number) => void
    cancelPending: () => void
    onVerticalOffsetSettled: (offset: number) => void
  },
) {
  motionEpoch.set(motionEpoch.get() + 1)
  cancelAnimation(translation)
  cancelAnimation(verticalOffset)
  cancelPending()
  dragging.set(false)
  canStartDrag.set(false)
  settling.set(false)
  const nextWidth = Math.max(
    0,
    event.nativeEvent.layout.width - HOURS_COLUMN_WIDTH,
  )
  const nextHeight = Math.max(0, event.nativeEvent.layout.height)
  width.set(nextWidth)
  viewportHeight.set(nextHeight)
  setPageWidth(nextWidth)
  translation.set(restingTranslation(pagePosition, nextWidth))
  const clamped = clampVerticalOffset(
    verticalResting.get(),
    CONTENT_HEIGHT,
    nextHeight,
  )
  verticalResting.set(clamped)
  verticalOffset.set(clamped)
  gesture.set(createGestureDecision(motionEpoch.get()))
  onVerticalOffsetSettled(clamped)
}

type OwnedCalendarShellProps = {
  heading: string
  anchor: Date
  displayZone: string
  locale: AppLocale
  uses24HourClock: boolean | null
  initialVerticalOffset: number
  generation: number
  pagePosition: number
  revisionFloor: number
  onVerticalOffsetSettled: (offset: number) => void
  onTransitionRequest: (request: WeekTransitionRequest) => void
  onTransitionSettled: (revision: number) => void
  onTransitionCancelled: (revision: number) => void
}

export function OwnedCalendarShell({
  heading,
  anchor,
  displayZone,
  locale,
  uses24HourClock,
  initialVerticalOffset,
  generation,
  pagePosition,
  revisionFloor,
  onVerticalOffsetSettled,
  onTransitionRequest,
  onTransitionSettled,
  onTransitionCancelled,
}: OwnedCalendarShellProps) {
  const reduceMotion = useReducedMotion()
  const [pageWidth, setPageWidth] = useState(0)
  const width = useSharedValue(0)
  const viewportHeight = useSharedValue(0)
  const translation = useSharedValue(0)
  const horizontalOrigin = useSharedValue(0)
  const verticalOffset = useSharedValue(Math.max(0, initialVerticalOffset))
  const verticalOrigin = useSharedValue(Math.max(0, initialVerticalOffset))
  const verticalResting = useSharedValue(Math.max(0, initialVerticalOffset))
  const gesture = useSharedValue<GestureDecision>(createGestureDecision(0))
  const dragging = useSharedValue(false)
  const canStartDrag = useSharedValue(false)
  const motionEpoch = useSharedValue(0)
  const settling = useSharedValue(false)
  const active = useSharedValue(AppState.currentState === "active")
  const foregroundRef = useRef(AppState.currentState === "active")
  const revisionRef = useRef(revisionFloor)
  const pendingRevisionRef = useRef<number | null>(null)

  const cancelPending = () => {
    const revision = pendingRevisionRef.current
    if (revision === null) return
    pendingRevisionRef.current = null
    onTransitionCancelled(revision)
  }

  const finishTransition = (revision: number, finished: boolean) => {
    if (!finished || pendingRevisionRef.current !== revision) return
    pendingRevisionRef.current = null
    onTransitionSettled(revision)
  }

  const finishVertical = (offset: number, epoch: number, finished: boolean) => {
    if (!finished || epoch !== motionEpoch.get()) return
    verticalResting.set(offset)
    onVerticalOffsetSettled(offset)
  }

  const startTransition = (
    direction: WeekDirection,
    source: WeekTransitionSource,
    epoch?: number,
  ) => {
    if (
      !foregroundRef.current ||
      (epoch !== undefined && epoch !== motionEpoch.get())
    )
      return
    cancelAnimation(translation)
    cancelPending()
    settling.set(true)
    const revision = Math.max(revisionRef.current, revisionFloor) + 1
    revisionRef.current = revision
    pendingRevisionRef.current = revision
    onTransitionRequest({ revision, direction, source })
    if (reduceMotion || width.get() <= 0) {
      finishTransition(revision, true)
      return
    }
    translation.set(
      withTiming(
        restingTranslation(pagePosition + direction, width.get()),
        { duration: SETTLE_DURATION_MS },
        (finished) =>
          scheduleOnRN(finishTransition, revision, finished === true),
      ),
    )
  }

  const snapBack = () => {
    "worklet"
    cancelAnimation(translation)
    const restingPosition = restingTranslation(pagePosition, width.get())
    if (reduceMotion) translation.set(restingPosition)
    else
      translation.set(
        withTiming(restingPosition, { duration: SETTLE_DURATION_MS }),
      )
  }

  const restoreVertical = () => {
    "worklet"
    cancelAnimation(verticalOffset)
    verticalOffset.set(
      clampVerticalOffset(
        verticalResting.get(),
        CONTENT_HEIGHT,
        viewportHeight.get(),
      ),
    )
  }

  const resetMotion = useEffectEvent(() => {
    motionEpoch.set(motionEpoch.get() + 1)
    cancelAnimation(translation)
    cancelAnimation(verticalOffset)
    translation.set(restingTranslation(pagePosition, width.get()))
    restoreVertical()
    dragging.set(false)
    canStartDrag.set(false)
    settling.set(false)
    gesture.set(createGestureDecision(motionEpoch.get()))
    cancelPending()
  })

  useLayoutEffect(() => resetMotion(), [generation])

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      foregroundRef.current = state === "active"
      active.set(foregroundRef.current)
      resetMotion()
    })
    return () => {
      subscription.remove()
      resetMotion()
    }
  }, [active])

  const handlePanEvent = (
    event: PanGestureHandlerEventPayload & { state: State },
  ) => {
    "worklet"
    if (!active.get()) return
    if (event.state === State.BEGAN) {
      canStartDrag.set(!settling.get() && width.get() > 0)
      return
    }
    if (event.state === State.ACTIVE && !dragging.get()) {
      if (!canStartDrag.get() || settling.get()) return
      cancelAnimation(translation)
      cancelAnimation(verticalOffset)
      motionEpoch.set(motionEpoch.get() + 1)
      horizontalOrigin.set(translation.get())
      verticalOrigin.set(verticalOffset.get())
      gesture.set(createGestureDecision(motionEpoch.get()))
      dragging.set(true)
    }
    if (!dragging.get()) return
    const translationX = event.translationX ?? 0
    const translationY = event.translationY ?? 0
    const velocityX = event.velocityX ?? 0
    const velocityY = event.velocityY ?? 0
    if (event.state === State.ACTIVE) {
      const currentDecision = gesture.get()
      const decision = updateGestureDecision(
        currentDecision,
        translationX,
        translationY,
        motionEpoch.get(),
      )
      if (decision !== currentDecision) gesture.set(decision)
      if (decision.axis === "horizontal") {
        const measuredWidth = width.get()
        translation.set(
          Math.max(
            -(pagePosition + 1) * measuredWidth,
            Math.min(
              -(pagePosition - 1) * measuredWidth,
              horizontalOrigin.get() + translationX,
            ),
          ),
        )
      } else if (decision.axis === "vertical") {
        verticalOffset.set(
          clampVerticalOffset(
            verticalOrigin.get() - translationY,
            CONTENT_HEIGHT,
            viewportHeight.get(),
          ),
        )
      }
      return
    }
    const decision = terminateGestureDecision(gesture.get(), motionEpoch.get())
    gesture.set(decision)
    dragging.set(false)
    if (event.state === State.CANCELLED || event.state === State.FAILED) {
      snapBack()
      restoreVertical()
      return
    }
    if (event.state !== State.END) return
    if (decision.axis === "vertical") {
      snapBack()
      const epoch = motionEpoch.get()
      const target = clampVerticalOffset(
        verticalOffset.get() - velocityY * VERTICAL_FLING_PROJECTION_SECONDS,
        CONTENT_HEIGHT,
        viewportHeight.get(),
      )
      if (reduceMotion) {
        verticalOffset.set(target)
        verticalResting.set(target)
        scheduleOnRN(onVerticalOffsetSettled, target)
      } else {
        verticalOffset.set(
          withTiming(target, { duration: SETTLE_DURATION_MS }, (finished) =>
            scheduleOnRN(finishVertical, target, epoch, finished === true),
          ),
        )
      }
      return
    }
    restoreVertical()
    if (decision.axis !== "horizontal") {
      snapBack()
      return
    }
    const measuredWidth = width.get()
    const displacement =
      horizontalOrigin.get() +
      translationX -
      restingTranslation(pagePosition, measuredWidth)
    const displacementQualifies =
      measuredWidth > 0 &&
      Math.abs(displacement) >= measuredWidth * PAGE_THRESHOLD_RATIO
    const flingQualifies = Math.abs(velocityX) >= FLING_VELOCITY
    const motion = displacementQualifies
      ? displacement
      : flingQualifies
        ? velocityX
        : 0
    if (motion === 0) snapBack()
    else {
      settling.set(true)
      scheduleOnRN(
        startTransition,
        motion < 0 ? 1 : -1,
        "gesture",
        motionEpoch.get(),
      )
    }
  }

  const panGestureEventHandler = useEvent(
    handlePanEvent,
    ["onGestureHandlerEvent"],
    true,
  ) as unknown as (event: GestureEvent<PanGestureHandlerEventPayload>) => void
  const panStateChangeHandler = useEvent(
    handlePanEvent,
    ["onGestureHandlerStateChange"],
    true,
  ) as unknown as (
    event: HandlerStateChangeEvent<PanGestureHandlerEventPayload>,
  ) => void
  const onLayout = (event: LayoutChangeEvent) =>
    applyLayout(event, {
      pagePosition,
      motionEpoch,
      translation,
      verticalOffset,
      verticalResting,
      viewportHeight,
      width,
      gesture,
      dragging,
      canStartDrag,
      settling,
      setPageWidth,
      cancelPending,
      onVerticalOffsetSettled,
    })

  return (
    <OwnedCalendarSurface
      heading={heading}
      anchor={anchor}
      displayZone={displayZone}
      locale={locale}
      uses24HourClock={uses24HourClock}
      pagePosition={pagePosition}
      pageWidth={pageWidth}
      translation={translation}
      verticalOffset={verticalOffset}
      onLayout={onLayout}
      onGestureEvent={panGestureEventHandler}
      onHandlerStateChange={panStateChangeHandler}
      onAccessibilityTransition={startTransition}
    />
  )
}

function OwnedCalendarSurface({
  heading,
  anchor,
  displayZone,
  locale,
  uses24HourClock,
  pagePosition,
  pageWidth,
  translation,
  verticalOffset,
  onLayout,
  onGestureEvent,
  onHandlerStateChange,
  onAccessibilityTransition,
}: {
  heading: string
  anchor: Date
  displayZone: string
  locale: AppLocale
  uses24HourClock: boolean | null
  pagePosition: number
  pageWidth: number
  translation: SharedValue<number>
  verticalOffset: SharedValue<number>
  onLayout: (event: LayoutChangeEvent) => void
  onGestureEvent: (event: GestureEvent<PanGestureHandlerEventPayload>) => void
  onHandlerStateChange: (
    event: HandlerStateChangeEvent<PanGestureHandlerEventPayload>,
  ) => void
  onAccessibilityTransition: (
    direction: WeekDirection,
    source: WeekTransitionSource,
  ) => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const stripStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translation.get() }],
  }))
  const clockStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -verticalOffset.get() }],
  }))
  const pages = PAGE_DIRECTIONS.map((direction) => {
    const pageAnchor =
      direction === 0
        ? anchor
        : shiftWeekInZone(anchor, direction, displayZone, 1)
    return { direction, key: dayKey(pageAnchor, displayZone) }
  })
  return (
    <View
      testID="owned-calendar-shell"
      style={[styles.shell, { backgroundColor: theme.background }]}
    >
      <PanGestureHandler
        testID="owned-calendar-canvas"
        minDist={1}
        minPointers={1}
        maxPointers={1}
        cancelsTouchesInView
        shouldCancelWhenOutside={false}
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View
          onLayout={onLayout}
          style={styles.viewport}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={heading}
          accessibilityActions={[
            { name: "decrement", label: t("calendar.previousWeekLabel") },
            { name: "increment", label: t("calendar.nextWeekLabel") },
          ]}
          onAccessibilityAction={({ nativeEvent }) => {
            if (nativeEvent.actionName === "increment")
              onAccessibilityTransition(1, "next")
            if (nativeEvent.actionName === "decrement")
              onAccessibilityTransition(-1, "previous")
          }}
        >
          <View
            testID="owned-calendar-hour-gutter"
            style={[styles.gutter, { borderColor: theme.separator }]}
            pointerEvents="none"
          >
            <Animated.View
              testID="owned-calendar-gutter-clock"
              style={[
                styles.clockPlane,
                { height: CONTENT_HEIGHT },
                clockStyle,
              ]}
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
            </Animated.View>
          </View>
          <View
            testID="owned-calendar-timed-lane"
            style={styles.lane}
            pointerEvents="none"
          >
            <Animated.View
              testID="owned-calendar-page-strip"
              style={[
                styles.strip,
                { left: (pagePosition - 1) * pageWidth, width: pageWidth * 3 },
                stripStyle,
              ]}
            >
              {pages.map((page) => (
                <WeekPage
                  key={page.key}
                  direction={page.direction}
                  width={pageWidth}
                  verticalOffset={verticalOffset}
                />
              ))}
            </Animated.View>
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  )
}

function WeekPage({
  direction,
  width,
  verticalOffset,
}: {
  direction: number
  width: number
  verticalOffset: SharedValue<number>
}) {
  const theme = useTheme()
  const clockStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -verticalOffset.get() }],
  }))
  return (
    <View
      testID={`owned-calendar-page-${direction}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.page,
        {
          width,
          backgroundColor: theme.backgroundElement,
          borderColor: theme.separator,
        },
      ]}
    >
      <Animated.View
        testID={`owned-calendar-page-clock-${direction}`}
        style={[styles.clockPlane, { height: CONTENT_HEIGHT }, clockStyle]}
      >
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
                borderColor: theme.separator,
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
                borderColor: theme.textSecondary,
              },
            ]}
          />
        ))}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  viewport: {
    flex: 1,
    flexDirection: "row",
    overflow: "hidden",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  gutter: {
    width: HOURS_COLUMN_WIDTH,
    overflow: "hidden",
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  lane: { flex: 1, overflow: "hidden" },
  strip: { position: "absolute", top: 0, bottom: 0, flexDirection: "row" },
  page: {
    height: "100%",
    overflow: "hidden",
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  clockPlane: { position: "absolute", top: 0, left: 0, right: 0 },
  hourLabel: {
    position: "absolute",
    right: 6,
    transform: [{ translateY: -8 }],
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  minorLine: { opacity: 0.5 },
})
