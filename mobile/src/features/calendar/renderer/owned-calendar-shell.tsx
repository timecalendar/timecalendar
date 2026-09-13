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
  useAnimatedStyle,
  useEvent,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets"

import { ThemedText } from "@/components/themed-text"
import {
  dayKey,
  shiftWeekInZone,
  type WeekDirection,
  type WeekTransitionRequest,
  type WeekTransitionSource,
} from "@/features/calendar/data"
import { Spacing, useTheme } from "@/theme"

const SETTLE_DURATION_MS = 220
const PAGE_THRESHOLD_RATIO = 0.2
const FLING_VELOCITY = 500
const PAGE_DIRECTIONS = [-1, 0, 1] as const

function restingTranslation(pagePosition: number, pageWidth: number) {
  "worklet"
  return pagePosition === 0 ? 0 : -pagePosition * pageWidth
}

type OwnedCalendarShellProps = {
  heading: string
  anchor: Date
  displayZone: string
  generation: number
  pagePosition: number
  revisionFloor: number
  onTransitionRequest: (request: WeekTransitionRequest) => void
  onTransitionSettled: (revision: number) => void
  onTransitionCancelled: (revision: number) => void
}

export function OwnedCalendarShell({
  heading,
  anchor,
  displayZone,
  generation,
  pagePosition,
  revisionFloor,
  onTransitionRequest,
  onTransitionSettled,
  onTransitionCancelled,
}: OwnedCalendarShellProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const reduceMotion = useReducedMotion()
  const [layoutWidth, setLayoutWidth] = useState(0)
  const [layoutHeight, setLayoutHeight] = useState(0)
  const width = useSharedValue(0)
  const translation = useSharedValue(0)
  const dragOrigin = useSharedValue(0)
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
    if (reduceMotion) {
      translation.set(restingPosition)
    } else {
      translation.set(
        withTiming(restingPosition, { duration: SETTLE_DURATION_MS }),
      )
    }
  }

  // Callback identity is not a lifecycle boundary: requesting a page rerenders the owner.
  const resetMotion = useEffectEvent(() => {
    motionEpoch.set(motionEpoch.get() + 1)
    cancelAnimation(translation)
    translation.set(restingTranslation(pagePosition, width.get()))
    dragging.set(false)
    canStartDrag.set(false)
    settling.set(false)
    cancelPending()
  })

  useLayoutEffect(() => {
    resetMotion()
  }, [generation])

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
    // iOS can emit BEGAN while resetting after release. Only activation may interrupt snap-back.
    if (event.state === State.ACTIVE && !dragging.get()) {
      if (!canStartDrag.get() || settling.get()) return
      cancelAnimation(translation)
      motionEpoch.set(motionEpoch.get() + 1)
      dragOrigin.set(translation.get())
      dragging.set(true)
    }
    if (!dragging.get()) return
    if (
      Math.abs(event.translationY) > 20 &&
      Math.abs(event.translationY) > Math.abs(event.translationX)
    ) {
      dragging.set(false)
      snapBack()
      return
    }
    if (event.state === State.ACTIVE) {
      const pageWidth = width.get()
      translation.set(
        Math.max(
          -(pagePosition + 1) * pageWidth,
          Math.min(
            -(pagePosition - 1) * pageWidth,
            dragOrigin.get() + event.translationX,
          ),
        ),
      )
      return
    }
    if (event.state === State.CANCELLED || event.state === State.FAILED) {
      dragging.set(false)
      snapBack()
      return
    }
    if (event.state !== State.END) return
    dragging.set(false)

    const pageWidth = width.get()
    const displacement =
      dragOrigin.get() +
      event.translationX -
      restingTranslation(pagePosition, pageWidth)
    const displacementQualifies =
      pageWidth > 0 &&
      Math.abs(displacement) >= pageWidth * PAGE_THRESHOLD_RATIO
    const flingQualifies = Math.abs(event.velocityX) >= FLING_VELOCITY
    const motion = displacementQualifies
      ? displacement
      : flingQualifies
        ? event.velocityX
        : 0

    if (motion === 0) {
      snapBack()
    } else {
      settling.set(true)
      scheduleOnRN(
        startTransition,
        motion < 0 ? 1 : -1,
        "gesture",
        motionEpoch.get(),
      )
    }
  }
  // A handler holder must own one registration; sharing it across props leaks native listeners.
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

  const stripStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translation.get() }],
  }))
  const pages = PAGE_DIRECTIONS.map((direction) => {
    const pageAnchor =
      direction === 0
        ? anchor
        : shiftWeekInZone(anchor, direction, displayZone, 1)
    const key = dayKey(pageAnchor, displayZone)
    // A civil-week identity keeps the tint stable when a neighbour becomes current.
    const tintIndex = Math.abs(Math.floor(Date.parse(key) / (7 * 86400000))) % 3
    return { direction, key, tintIndex }
  })

  const onLayout = (event: LayoutChangeEvent) => {
    motionEpoch.set(motionEpoch.get() + 1)
    cancelAnimation(translation)
    cancelPending()
    dragging.set(false)
    canStartDrag.set(false)
    settling.set(false)
    const nextWidth = Math.max(0, event.nativeEvent.layout.width)
    width.set(nextWidth)
    setLayoutWidth(nextWidth)
    setLayoutHeight(Math.max(0, event.nativeEvent.layout.height))
    translation.set(restingTranslation(pagePosition, nextWidth))
  }

  return (
    <View
      testID="owned-calendar-shell"
      style={[styles.shell, { backgroundColor: theme.background }]}
    >
      <PanGestureHandler
        testID="owned-calendar-canvas"
        activeOffsetX={[-10, 10]}
        failOffsetY={[-20, 20]}
        onGestureEvent={panGestureEventHandler}
        onHandlerStateChange={panStateChangeHandler}
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
              startTransition(1, "next")
            if (nativeEvent.actionName === "decrement")
              startTransition(-1, "previous")
          }}
        >
          <Animated.View
            testID="owned-calendar-page-strip"
            style={[
              styles.strip,
              {
                left: (pagePosition - 1) * layoutWidth,
                width: layoutWidth * 3,
              },
              stripStyle,
            ]}
          >
            {pages.map((page) => (
              <WeekPage
                key={page.key}
                dateKey={page.key}
                direction={page.direction}
                tintIndex={page.tintIndex}
                width={layoutWidth}
                height={layoutHeight}
              />
            ))}
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  )
}

function WeekPage({
  dateKey,
  direction,
  tintIndex,
  width,
  height,
}: {
  dateKey: string
  direction: number
  tintIndex: number
  width: number
  height: number
}) {
  const theme = useTheme()
  return (
    <View
      testID={`owned-calendar-page-${direction}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[
        styles.page,
        {
          width,
          backgroundColor: __DEV__
            ? [
                theme.homeHero,
                theme.backgroundSelected,
                theme.backgroundElement,
              ][tintIndex]
            : theme.backgroundElement,
          borderColor: theme.separator,
        },
      ]}
    >
      {__DEV__ && (
        <WeekPagingPreview dateKey={dateKey} width={width} height={height} />
      )}
    </View>
  )
}

function WeekPagingPreview({
  dateKey,
  width,
  height,
}: {
  dateKey: string
  width: number
  height: number
}) {
  const { t } = useTranslation()
  return (
    <View style={styles.placeholder}>
      <ThemedText>{t("calendar.weekPagingPlaceholder")}</ThemedText>
      <ThemedText>{dateKey}</ThemedText>
      <ThemedText type="small">
        {t("calendar.weekPagingSize", {
          width: Math.round(width),
          height: Math.round(height),
        })}
      </ThemedText>
      <ThemedText type="small">{t("calendar.weekPagingHint")}</ThemedText>
    </View>
  )
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  viewport: {
    flex: 1,
    overflow: "hidden",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  strip: {
    position: "absolute",
    top: 0,
    bottom: 0,
    flexDirection: "row",
  },
  page: {
    height: "100%",
    borderLeftWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
  },
  placeholder: {
    alignItems: "center",
    padding: Spacing.four,
    gap: Spacing.two,
  },
})
