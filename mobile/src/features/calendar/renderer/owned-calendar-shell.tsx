import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  type LayoutChangeEvent,
  Platform,
  Pressable,
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

type OwnedCalendarShellProps = {
  heading: string
  anchor: Date
  displayZone: string
  generation: number
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
  revisionFloor,
  onTransitionRequest,
  onTransitionSettled,
  onTransitionCancelled,
}: OwnedCalendarShellProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const reduceMotion = useReducedMotion()
  const [layoutWidth, setLayoutWidth] = useState(0)
  const width = useSharedValue(0)
  const translation = useSharedValue(0)
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
    translation.set(0)
    onTransitionSettled(revision)
  }

  const startTransition = (
    direction: WeekDirection,
    source: WeekTransitionSource,
  ) => {
    cancelAnimation(translation)
    cancelPending()
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
        -direction * width.get(),
        { duration: SETTLE_DURATION_MS },
        (finished) =>
          scheduleOnRN(finishTransition, revision, finished === true),
      ),
    )
  }

  const snapBack = () => {
    cancelAnimation(translation)
    if (reduceMotion) {
      translation.set(0)
    } else {
      translation.set(withTiming(0, { duration: SETTLE_DURATION_MS }))
    }
  }

  const interruptMotion = () => {
    cancelPending()
  }

  useEffect(() => {
    cancelAnimation(translation)
    translation.set(0)
    const revision = pendingRevisionRef.current
    if (revision !== null) {
      pendingRevisionRef.current = null
      onTransitionCancelled(revision)
    }
  }, [generation, onTransitionCancelled, translation])

  useEffect(
    () => () => {
      cancelAnimation(translation)
      const revision = pendingRevisionRef.current
      if (revision !== null) {
        pendingRevisionRef.current = null
        onTransitionCancelled(revision)
      }
    },
    [onTransitionCancelled, translation],
  )

  const panEventHandler = useEvent<
    PanGestureHandlerEventPayload & { state: State }
  >(
    (event) => {
      "worklet"
      if (event.state === State.BEGAN) {
        cancelAnimation(translation)
        scheduleOnRN(interruptMotion)
        return
      }
      if (event.state === State.ACTIVE) {
        const pageWidth = width.get()
        translation.set(
          Math.max(-pageWidth, Math.min(pageWidth, event.translationX)),
        )
        return
      }
      if (event.state === State.CANCELLED || event.state === State.FAILED) {
        scheduleOnRN(snapBack)
        return
      }
      if (event.state !== State.END) return

      const pageWidth = width.get()
      const displacementQualifies =
        pageWidth > 0 &&
        Math.abs(event.translationX) >= pageWidth * PAGE_THRESHOLD_RATIO
      const flingQualifies = Math.abs(event.velocityX) >= FLING_VELOCITY
      const motion = displacementQualifies
        ? event.translationX
        : flingQualifies
          ? event.velocityX
          : 0

      if (motion === 0) {
        scheduleOnRN(snapBack)
      } else {
        scheduleOnRN(startTransition, motion < 0 ? 1 : -1, "gesture")
      }
    },
    ["onGestureHandlerEvent", "onGestureHandlerStateChange"],
    true,
  )
  const panGestureEventHandler = panEventHandler as unknown as (
    event: GestureEvent<PanGestureHandlerEventPayload>,
  ) => void
  const panStateChangeHandler = panEventHandler as unknown as (
    event: HandlerStateChangeEvent<PanGestureHandlerEventPayload>,
  ) => void

  const stripStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -width.get() + translation.get() }],
  }))
  const pages = [-1, 0, 1].map((direction) => {
    const pageAnchor =
      direction === 0
        ? anchor
        : shiftWeekInZone(anchor, direction as WeekDirection, displayZone, 1)
    return { direction, key: dayKey(pageAnchor, displayZone) }
  })

  const onLayout = (event: LayoutChangeEvent) => {
    cancelAnimation(translation)
    cancelPending()
    const nextWidth = Math.max(0, event.nativeEvent.layout.width)
    width.set(nextWidth)
    setLayoutWidth(nextWidth)
    translation.set(0)
  }

  return (
    <View
      testID="owned-calendar-shell"
      style={[styles.shell, { backgroundColor: theme.background }]}
    >
      <View style={styles.headingRow}>
        <Pressable
          testID="calendar-previous-week"
          accessibilityRole="button"
          accessibilityLabel={t("calendar.previousWeekLabel")}
          onPress={() => startTransition(-1, "previous")}
          style={[
            styles.pageAction,
            {
              minWidth: Platform.OS === "android" ? 48 : 44,
              minHeight: Platform.OS === "android" ? 48 : 44,
            },
          ]}
        >
          <ThemedText accessible={false}>‹</ThemedText>
        </Pressable>
        <ThemedText type="subtitle" style={styles.heading}>
          {heading}
        </ThemedText>
        <Pressable
          testID="calendar-next-week"
          accessibilityRole="button"
          accessibilityLabel={t("calendar.nextWeekLabel")}
          onPress={() => startTransition(1, "next")}
          style={[
            styles.pageAction,
            {
              minWidth: Platform.OS === "android" ? 48 : 44,
              minHeight: Platform.OS === "android" ? 48 : 44,
            },
          ]}
        >
          <ThemedText accessible={false}>›</ThemedText>
        </Pressable>
      </View>
      <PanGestureHandler
        testID="owned-calendar-canvas"
        onGestureEvent={panGestureEventHandler}
        onHandlerStateChange={panStateChangeHandler}
      >
        <View onLayout={onLayout} style={styles.viewport}>
          <Animated.View
            testID="owned-calendar-page-strip"
            style={[styles.strip, { width: layoutWidth * 3 }, stripStyle]}
          >
            {pages.map((page) => {
              const isCurrent = page.direction === 0
              return (
                <View
                  key={page.key}
                  testID={`owned-calendar-page-${page.direction}`}
                  accessibilityLabel={isCurrent ? heading : undefined}
                  accessible={isCurrent}
                  accessibilityElementsHidden={!isCurrent}
                  importantForAccessibility={
                    isCurrent ? "yes" : "no-hide-descendants"
                  }
                  style={[
                    styles.page,
                    { width: layoutWidth },
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.separator,
                    },
                  ]}
                />
              )
            })}
          </Animated.View>
        </View>
      </PanGestureHandler>
    </View>
  )
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  heading: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pageAction: {
    alignItems: "center",
    justifyContent: "center",
  },
  viewport: {
    flex: 1,
    overflow: "hidden",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  strip: { flex: 1, flexDirection: "row" },
  page: { height: "100%", borderTopWidth: StyleSheet.hairlineWidth },
})
