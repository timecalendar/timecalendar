import { useEffect, useLayoutEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import {
  AppState,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native"
import PagerView, {
  type PagerViewOnPageSelectedEvent,
  type PageScrollStateChangedNativeEvent,
} from "react-native-pager-view"
import { useReducedMotion } from "react-native-reanimated"

import { ThemedText } from "@/components/themed-text"
import {
  type AppLocale,
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

const PAGE_DIRECTIONS = [-1, 0, 1] as const
const CENTER_PAGE = 1
const CONTENT_HEIGHT = gridContentHeight(
  FULL_DAY_START_MINUTE,
  FULL_DAY_END_MINUTE,
  DEFAULT_PIXELS_PER_HOUR,
)
const RENDER_HEIGHT = CONTENT_HEIGHT + StyleSheet.hairlineWidth
const MAJOR_MINUTES = fullDayMajorMinutes()
const MINOR_MINUTES = fullDayMinorMinutes()

function stableTintIndex(key: string) {
  return (
    Array.from(key).reduce((total, character) => {
      return total + character.charCodeAt(0)
    }, 0) % 3
  )
}

type OwnedCalendarShellProps = {
  heading: string
  anchor: Date
  displayZone: string
  locale: AppLocale
  uses24HourClock: boolean | null
  initialVerticalOffset: number
  generation: number
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
  revisionFloor,
  onVerticalOffsetSettled,
  onTransitionRequest,
  onTransitionSettled,
  onTransitionCancelled,
}: OwnedCalendarShellProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const reduceMotion = useReducedMotion()
  const pagerRef = useRef<PagerView>(null)
  const scrollRef = useRef<ScrollView>(null)
  const revisionRef = useRef(revisionFloor)
  const pendingRevisionRef = useRef<number | null>(null)
  const onTransitionCancelledRef = useRef(onTransitionCancelled)
  const selectedPageRef = useRef(CENTER_PAGE)
  const consumedGenerationRef = useRef<number | null>(null)
  const currentGenerationRef = useRef(generation)
  const foregroundRef = useRef(AppState.currentState === "active")
  const committedVerticalOffsetRef = useRef(initialVerticalOffset)
  const verticalCandidateRef = useRef<number | null>(null)
  const verticalFrameRef = useRef<number | null>(null)
  const pages = PAGE_DIRECTIONS.map((direction) => {
    const pageAnchor =
      direction === 0
        ? anchor
        : shiftWeekInZone(anchor, direction, displayZone, 1)
    return { direction, key: dayKey(pageAnchor, displayZone) }
  })

  const cancelVerticalCandidate = () => {
    if (verticalFrameRef.current !== null) {
      cancelAnimationFrame(verticalFrameRef.current)
      verticalFrameRef.current = null
    }
    verticalCandidateRef.current = null
  }

  const beginTransition = (
    direction: WeekDirection,
    source: WeekTransitionSource,
  ) => {
    if (!foregroundRef.current || pendingRevisionRef.current !== null)
      return null
    const revision = Math.max(revisionRef.current, revisionFloor) + 1
    revisionRef.current = revision
    pendingRevisionRef.current = revision
    onTransitionRequest({ revision, direction, source })
    return revision
  }

  const settleSelectedPage = () => {
    const position = selectedPageRef.current
    if (
      position === CENTER_PAGE ||
      consumedGenerationRef.current === generation
    )
      return
    if (pendingRevisionRef.current === null) {
      const direction: WeekDirection = position < CENTER_PAGE ? -1 : 1
      beginTransition(direction, "gesture")
    }
    const revision = pendingRevisionRef.current
    if (revision === null) return
    consumedGenerationRef.current = generation
    selectedPageRef.current = CENTER_PAGE
    pendingRevisionRef.current = null
    onTransitionSettled(revision)
  }

  const onPageSelected = (event: PagerViewOnPageSelectedEvent) => {
    if (currentGenerationRef.current !== generation) return
    selectedPageRef.current = event.nativeEvent.position
  }

  const onPageScrollStateChanged = (
    event: PageScrollStateChangedNativeEvent,
  ) => {
    if (currentGenerationRef.current !== generation) return
    if (event.nativeEvent.pageScrollState === "idle") settleSelectedPage()
  }

  const requestAccessiblePage = (
    direction: WeekDirection,
    source: WeekTransitionSource,
  ) => {
    const revision = beginTransition(direction, source)
    if (revision === null || pendingRevisionRef.current !== revision) return
    const target = CENTER_PAGE + direction
    selectedPageRef.current = target
    if (reduceMotion) pagerRef.current?.setPageWithoutAnimation(target)
    else pagerRef.current?.setPage(target)
  }

  const settleVertical = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    cancelVerticalCandidate()
    const offset = event.nativeEvent.contentOffset.y
    committedVerticalOffsetRef.current = offset
    onVerticalOffsetSettled(offset)
  }

  const onScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    cancelVerticalCandidate()
    verticalCandidateRef.current = event.nativeEvent.contentOffset.y
    verticalFrameRef.current = requestAnimationFrame(() => {
      verticalFrameRef.current = null
      const offset = verticalCandidateRef.current
      verticalCandidateRef.current = null
      if (offset === null) return
      committedVerticalOffsetRef.current = offset
      onVerticalOffsetSettled(offset)
    })
  }

  useEffect(() => {
    onTransitionCancelledRef.current = onTransitionCancelled
  }, [onTransitionCancelled])

  useLayoutEffect(() => {
    currentGenerationRef.current = generation
    selectedPageRef.current = CENTER_PAGE
    consumedGenerationRef.current = null
    const revision = pendingRevisionRef.current
    if (revision !== null) {
      pendingRevisionRef.current = null
      onTransitionCancelledRef.current(revision)
    }
  }, [generation])

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      foregroundRef.current = state === "active"
      if (foregroundRef.current) return
      if (verticalFrameRef.current !== null) {
        cancelAnimationFrame(verticalFrameRef.current)
        verticalFrameRef.current = null
      }
      verticalCandidateRef.current = null
      const revision = pendingRevisionRef.current
      if (revision !== null) {
        pendingRevisionRef.current = null
        onTransitionCancelledRef.current(revision)
      }
      selectedPageRef.current = CENTER_PAGE
      pagerRef.current?.setPageWithoutAnimation(CENTER_PAGE)
      scrollRef.current?.scrollTo({
        y: committedVerticalOffsetRef.current,
        animated: false,
      })
    })
    return () => {
      subscription.remove()
      if (verticalFrameRef.current !== null) {
        cancelAnimationFrame(verticalFrameRef.current)
      }
      const revision = pendingRevisionRef.current
      if (revision !== null) {
        pendingRevisionRef.current = null
        onTransitionCancelledRef.current(revision)
      }
    }
  }, [])

  return (
    <View
      testID="owned-calendar-shell"
      collapsable={false}
      style={[styles.shell, { backgroundColor: theme.background }]}
    >
      <ScrollView
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
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollBegin={cancelVerticalCandidate}
        onMomentumScrollEnd={settleVertical}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={heading}
        accessibilityActions={[
          { name: "decrement", label: t("calendar.previousWeekLabel") },
          { name: "increment", label: t("calendar.nextWeekLabel") },
        ]}
        onAccessibilityAction={({ nativeEvent }) => {
          if (nativeEvent.actionName === "increment")
            requestAccessiblePage(1, "next")
          if (nativeEvent.actionName === "decrement")
            requestAccessiblePage(-1, "previous")
        }}
      >
        <View style={styles.fullDayRow} collapsable={false}>
          <View
            testID="owned-calendar-hour-gutter"
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            style={[styles.gutter, { borderColor: theme.separator }]}
            pointerEvents="none"
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
          </View>
          <PagerView
            ref={pagerRef}
            key={generation}
            testID="owned-calendar-pager"
            style={styles.pager}
            initialPage={CENTER_PAGE}
            offscreenPageLimit={1}
            overdrag={false}
            onPageSelected={onPageSelected}
            onPageScrollStateChanged={onPageScrollStateChanged}
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {pages.map((page) => (
              <View
                key={page.key}
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
                ]}
              >
                <WeekGrid direction={page.direction} />
                {__DEV__ && (
                  <View style={styles.preview} pointerEvents="none">
                    <ThemedText type="small">{page.key}</ThemedText>
                    <ThemedText type="small">
                      {t("calendar.weekPagingSize", {
                        width: "100%",
                        height: CONTENT_HEIGHT,
                      })}
                    </ThemedText>
                  </View>
                )}
              </View>
            ))}
          </PagerView>
        </View>
      </ScrollView>
    </View>
  )
}

function WeekGrid({ direction }: { direction: number }) {
  const theme = useTheme()
  return (
    <View
      testID={`owned-calendar-page-clock-${direction}`}
      style={styles.clockPlane}
      pointerEvents="none"
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
              backgroundColor: theme.separator,
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
              backgroundColor: theme.textSecondary,
            },
          ]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  viewport: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  fullDayRow: {
    height: RENDER_HEIGHT,
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  gutter: {
    width: HOURS_COLUMN_WIDTH,
    height: RENDER_HEIGHT,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  pager: { flex: 1, height: RENDER_HEIGHT },
  page: {
    width: "100%",
    height: RENDER_HEIGHT,
    overflow: "hidden",
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  clockPlane: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: RENDER_HEIGHT,
  },
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
