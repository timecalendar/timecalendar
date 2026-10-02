import {
  type Ref,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { useTranslation } from "react-i18next"
import {
  AccessibilityInfo,
  findNodeHandle,
  Modal,
  Pressable,
  StyleSheet,
  type Text,
  View,
} from "react-native"
import { GestureDetector } from "react-native-gesture-handler"
import { useReducedMotion } from "react-native-reanimated"

import { ThemedText } from "@/components/themed-text"
import {
  type AppLocale,
  type CalendarTimelineMode,
  dayKey,
  type FirstWeekday,
  formatClockTime,
  FULL_DAY_END_MINUTE,
  FULL_DAY_START_MINUTE,
  nowIndicatorPosition,
  pageAnchor,
  type PageIndex,
  pageIndexOfInstant,
  pageKey,
  type PagePresenter,
  type PageTileV1,
} from "@/features/calendar/data"
import { useTheme } from "@/theme"

import {
  OwnedCalendarCanvas,
  PAGE_CONTENT_HEIGHT,
  useScrollLockProps,
} from "./owned-calendar-canvas"
import { useOwnedCalendarCoordinator } from "./owned-calendar-coordinator"
import { OwnedCalendarDateHeader } from "./owned-calendar-header"
import { CalendarPage, type PageEventHandlers } from "./owned-calendar-page"
import { pagerPageWidth, useOwnedCalendarPager } from "./owned-calendar-pager"
import { pagingLog } from "./owned-calendar-paging-log"
import type {
  CalendarZoomCommand,
  CalendarZoomSettlement,
} from "./owned-calendar-zoom"

export type OwnedCalendarProbeDiagnostic = {
  kind: "target-frame"
  identity: string
  order: number
  frame: Readonly<{ x: number; y: number; width: number; height: number }>
}

export type OwnedCalendarShellHandle = {
  requestZoom: (command: CalendarZoomCommand) => void
  restoreFocus: () => void
}

type OwnedCalendarShellProps = {
  ref?: Ref<OwnedCalendarShellHandle>
  heading: string
  pageTitleTarget?: CalendarPageTitleTarget | null
  onContextSettled?: (pageKey: string, titleFocused: boolean) => void
  mode: CalendarTimelineMode
  anchor: Date
  displayZone: string
  locale: AppLocale
  firstWeekday: FirstWeekday
  showWeekends: boolean
  currentDate: Date
  uses24HourClock: boolean | null
  initialVerticalOffset: number
  initialPixelsPerHour: number
  presentPage: PagePresenter
  routeFocused?: boolean
  onDateCommitted: (anchor: Date) => void
  onPageWindowChange?: (center: PageIndex) => void
  onVerticalOffsetSettled: (offset: number) => void
  onZoomSettled: (settlement: CalendarZoomSettlement) => void
  onEventPress?: (uid: string) => void
  onProbeDiagnostic?:
    | ((diagnostic: OwnedCalendarProbeDiagnostic) => void)
    | undefined
}

type FocusTarget = { node: View; dateKey: string; minute: number }
type FocusMemory = { key: string; dateKey: string }
export type CalendarPageTitleTarget = {
  node: Text
  visibleTitle: string
  label: string
  contextHeading: string
  pageKey: string
}
type FocusContext = { pageKey: string; ready: boolean }

const ignore = () => undefined

function requestRestoredFocus({
  targets,
  headings,
  pageTitleTarget,
  heading,
  pageKey,
  currentColumns,
  lastFocused,
  lastRestore,
  restoreKey,
  pixelsPerHour,
  scrollTo,
  isCurrent,
  onFocused,
}: {
  targets: Map<string, FocusTarget>
  headings: Map<string, View>
  pageTitleTarget: CalendarPageTitleTarget | null | undefined
  heading: string
  pageKey: string
  currentColumns: readonly {
    key: string
    tiles: readonly { key: string }[]
  }[]
  lastFocused: { current: FocusMemory | null }
  lastRestore: { current: string | null }
  restoreKey: string
  pixelsPerHour: number
  scrollTo: (y: number) => void
  isCurrent: () => boolean
  onFocused?: (titleFocused: boolean) => void
}): number | "waiting" | null {
  if (lastRestore.current === restoreKey || lastFocused.current === null)
    return null
  const last = lastFocused.current
  const target = targets.get(last.key)
  const identityPresent = currentColumns.some((column) =>
    column.tiles.some((tile) => tile.key === last.key),
  )
  const datePresent = currentColumns.some(
    (column) => column.key === last.dateKey,
  )
  if (identityPresent && target === undefined) return "waiting"
  const dateNode = datePresent ? headings.get(last.dateKey) : undefined
  if (datePresent && target === undefined && !dateNode) return "waiting"
  const title =
    pageTitleTarget?.pageKey === pageKey &&
    pageTitleTarget.contextHeading === heading &&
    pageTitleTarget.label.includes(pageTitleTarget.visibleTitle) &&
    pageTitleTarget.label.includes(heading)
      ? pageTitleTarget
      : null
  const node = target?.node ?? dateNode ?? title?.node
  if (node === null || node === undefined) return "waiting"
  const titleFocused = node === title?.node
  if (target !== undefined)
    scrollTo(Math.max(0, (target.minute / 60) * pixelsPerHour - 96))
  return requestAnimationFrame(() => {
    if (!isCurrent() || lastRestore.current === restoreKey) return
    const handle = findNodeHandle(node)
    if (handle !== null) {
      lastRestore.current = restoreKey
      AccessibilityInfo.setAccessibilityFocus(handle)
      onFocused?.(titleFocused)
    }
  })
}

export function OwnedCalendarShell({ ref, ...props }: OwnedCalendarShellProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const reduceMotion = useReducedMotion()
  const {
    heading,
    mode,
    anchor,
    displayZone,
    firstWeekday,
    onContextSettled,
    pageTitleTarget,
    presentPage,
    routeFocused,
  } = props
  const space = { mode, firstWeekday }
  const anchorIndex = pageIndexOfInstant(space, anchor, displayZone)
  const coordinator = useOwnedCalendarCoordinator(props)
  const { scrollRef: pagerRef, ...pager } = useOwnedCalendarPager({
    space,
    anchorIndex,
    pageWidth: pagerPageWidth(coordinator.viewportWidth),
    scrollLocked: coordinator.scrollLocked,
    pinchGesture: coordinator.pinchGesture,
    trackNativeTouch: coordinator.trackNativeTouch,
    onSettled: (index) =>
      props.onDateCommitted(pageAnchor(space, index, displayZone)),
    onCenterChange: (center) => props.onPageWindowChange?.(center),
  })
  const verticalScrollProps = useScrollLockProps(coordinator.scrollLocked)
  const committed = presentPage(pager.settled)
  const committedKey = committed.pageKey
  const contextReady =
    committed.status === "ready" &&
    !pager.moving &&
    committedKey === pageKey(space, anchorIndex)

  const [targets] = useState(() => new Map<string, FocusTarget>())
  const [headings] = useState(() => new Map<string, View>())
  const [chooser, setChooser] = useState<readonly PageTileV1[] | null>(null)
  const focusContext = useRef<FocusContext>({
    pageKey: committedKey,
    ready: false,
  })
  const titleContext = useRef(pageTitleTarget)
  const returnFrame = useRef<number | null>(null)
  useLayoutEffect(() => {
    titleContext.current = pageTitleTarget
    focusContext.current = {
      pageKey: committedKey,
      ready: contextReady && routeFocused !== false,
    }
    if (returnFrame.current !== null) {
      cancelAnimationFrame(returnFrame.current)
      returnFrame.current = null
    }
  }, [committedKey, contextReady, pageTitleTarget, routeFocused])
  const lastFocused = useRef<FocusMemory | null>(null)
  const lastRestore = useRef<string | null>(null)
  const lastAutoContext = useRef<string | null>(null)
  const returnEpoch = useRef(0)
  const pendingReturn = useRef(false)
  const currentColumns = committed.columns
  const isFocusContextCurrent = (key: string) =>
    focusContext.current.pageKey === key && focusContext.current.ready
  const registerTarget = (
    key: string,
    dateKey: string,
    minute: number,
    node: View | null,
  ) => {
    if (node === null) targets.delete(key)
    else if (!targets.has(key)) targets.set(key, { node, dateKey, minute })
  }
  const rememberTarget = (key: string, dateKey: string) => {
    if (
      !isFocusContextCurrent(focusContext.current.pageKey) ||
      targets.get(key)?.dateKey !== dateKey ||
      (lastFocused.current?.key === key &&
        lastFocused.current.dateKey === dateKey)
    )
      return
    lastFocused.current = { key, dateKey }
  }
  useEffect(() => {
    if (routeFocused === false || !contextReady) return
    if (lastAutoContext.current === committedKey) return
    const frame = requestRestoredFocus({
      targets,
      headings,
      pageTitleTarget,
      heading,
      pageKey: committedKey,
      currentColumns,
      lastFocused,
      lastRestore,
      restoreKey: `${committedKey}:${returnEpoch.current}`,
      pixelsPerHour: coordinator.pixelsPerHour.get(),
      scrollTo: (y) =>
        coordinator.scrollRef.current?.scrollTo({ y, animated: false }),
      isCurrent: () =>
        focusContext.current.pageKey === committedKey &&
        focusContext.current.ready &&
        titleContext.current === pageTitleTarget,
      onFocused: (titleFocused) => {
        pendingReturn.current = false
        lastAutoContext.current = committedKey
        onContextSettled?.(committedKey, titleFocused)
      },
    })
    if (frame === null) {
      lastAutoContext.current = committedKey
      onContextSettled?.(committedKey, false)
    }
    if (typeof frame === "number") return () => cancelAnimationFrame(frame)
  }, [
    committedKey,
    contextReady,
    coordinator.pixelsPerHour,
    coordinator.scrollRef,
    currentColumns,
    heading,
    headings,
    onContextSettled,
    pageTitleTarget,
    routeFocused,
    targets,
  ])
  const restoreFocus = () => {
    returnEpoch.current += 1
    if (props.routeFocused === false || !contextReady) return
    if (returnFrame.current !== null) cancelAnimationFrame(returnFrame.current)
    const frame = requestRestoredFocus({
      targets,
      headings,
      pageTitleTarget: props.pageTitleTarget,
      heading: props.heading,
      pageKey: committedKey,
      currentColumns,
      lastFocused,
      lastRestore,
      restoreKey: `${committedKey}:${returnEpoch.current}`,
      pixelsPerHour: coordinator.pixelsPerHour.get(),
      scrollTo: (y) =>
        coordinator.scrollRef.current?.scrollTo({ y, animated: false }),
      isCurrent: () =>
        isFocusContextCurrent(committedKey) &&
        titleContext.current === props.pageTitleTarget,
      onFocused: () => {
        pendingReturn.current = false
      },
    })
    pendingReturn.current = frame !== null
    returnFrame.current = typeof frame === "number" ? frame : null
  }
  const restoreFocusRef = useRef(restoreFocus)
  useLayoutEffect(() => {
    restoreFocusRef.current = restoreFocus
  })
  useEffect(() => {
    if (
      pendingReturn.current &&
      routeFocused !== false &&
      contextReady &&
      pageTitleTarget !== null &&
      pageTitleTarget !== undefined
    )
      restoreFocusRef.current()
  }, [committedKey, contextReady, pageTitleTarget, routeFocused])
  useEffect(
    () => () => {
      if (returnFrame.current !== null)
        cancelAnimationFrame(returnFrame.current)
    },
    [],
  )

  const isEventActivationBlocked = () =>
    coordinator.isVerticalMovementOwned() || pager.isMoving()
  const onEventPress = (uid: string) => {
    if (isEventActivationBlocked()) return
    const eventPress = props.onEventPress ?? ignore
    eventPress(uid)
  }
  const handlers: PageEventHandlers = {
    onEventPress,
    onEventFocused: rememberTarget,
    onChooseConflict: setChooser,
    registerTarget,
    isEventActivationBlocked,
    onProbeDiagnostic: props.onProbeDiagnostic,
  }
  useImperativeHandle(ref, () => ({
    requestZoom: coordinator.requestZoom,
    restoreFocus,
  }))

  const todayKey = dayKey(props.currentDate, displayZone)
  // Explicit full-day bounds and the settled scale — the helper's 07:00–21:00
  // defaults stay as they are for Home's mini timeline and the agenda.
  const nowIndicator = nowIndicatorPosition(props.currentDate, displayZone, {
    pixelsPerHour: props.initialPixelsPerHour,
    startMinute: FULL_DAY_START_MINUTE,
    endMinute: FULL_DAY_END_MINUTE,
  })
  const nowLabel = t("calendar.nowLabel", {
    time: formatClockTime(
      props.currentDate,
      props.locale,
      displayZone,
      props.uses24HourClock,
    ),
  })
  const presentStartedAt = pagingLog.now()
  const pages = pager.mountedIndexes.map((index) => {
    const presentation = presentPage(index)
    const isCommitted = index === pager.settled
    const hasToday =
      nowIndicator.visible &&
      presentation.columns.some((column) => column.key === todayKey)
    return {
      presentation,
      left: pager.pageLeft(index),
      committed: isCommitted,
      hasToday,
    }
  })
  pagingLog.present(pagingLog.now() - presentStartedAt)

  return (
    <View
      testID="owned-calendar-shell"
      collapsable={false}
      style={[styles.shell, { backgroundColor: theme.background }]}
    >
      <OwnedCalendarDateHeader
        registerHeading={(dateKey, node) => {
          if (node === null) headings.delete(dateKey)
          else headings.set(dateKey, node)
        }}
        pages={pages}
        pageWidth={pager.pageWidth}
        contentWidth={pager.contentWidth}
        scrollX={pager.scrollX}
        positioned={pager.positioned}
        todayKey={todayKey}
        todayLabel={t("calendar.today")}
      />
      <GestureDetector gesture={coordinator.pinchGesture}>
        <OwnedCalendarCanvas
          heading={heading}
          mode={mode}
          locale={props.locale}
          uses24HourClock={props.uses24HourClock}
          initialVerticalOffset={props.initialVerticalOffset}
          scrollRef={coordinator.scrollRef}
          verticalScrollProps={verticalScrollProps}
          nativeScrollGesture={coordinator.nativeScrollGesture}
          onScroll={coordinator.onScroll}
          onScrollBeginDrag={coordinator.onScrollBeginDrag}
          onScrollEndDrag={coordinator.onScrollEndDrag}
          onViewportLayout={coordinator.onViewportLayout}
          onMomentumScrollBegin={coordinator.onMomentumScrollBegin}
          onMomentumScrollEnd={coordinator.settleVertical}
          onAccessiblePageRequest={(direction) => {
            if (!coordinator.scrollLocked.get())
              pager.step(direction, !reduceMotion)
          }}
          pixelsPerHour={coordinator.pixelsPerHour}
          pagerRef={pagerRef}
          pager={pager}
          t={t}
        >
          {pages.map((page) => (
            <CalendarPage
              key={page.presentation.pageKey}
              presentation={page.presentation}
              left={page.left}
              width={pager.pageWidth}
              height={PAGE_CONTENT_HEIGHT}
              committed={page.committed}
              nowDateKey={page.hasToday ? todayKey : null}
              nowMinuteOfDay={page.hasToday ? coordinator.nowMinuteOfDay : 0}
              nowLabel={page.hasToday && page.committed ? nowLabel : undefined}
              pixelsPerHour={coordinator.pixelsPerHour}
              settledPixelsPerHour={props.initialPixelsPerHour}
              handlers={handlers}
              t={t}
            />
          ))}
        </OwnedCalendarCanvas>
      </GestureDetector>
      <Modal
        testID="owned-calendar-event-chooser-modal"
        visible={chooser !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setChooser(null)}
      >
        <View style={styles.chooserBackdrop}>
          <View
            testID="owned-calendar-event-chooser"
            accessibilityViewIsModal
            accessibilityLabel={t("calendar.event.chooser.title")}
            style={[
              styles.chooser,
              { backgroundColor: theme.backgroundElement },
            ]}
          >
            <ThemedText type="subtitle">
              {t("calendar.event.chooser.title")}
            </ThemedText>
            {chooser?.map((tile) => (
              <Pressable
                key={tile.key}
                accessibilityRole="button"
                accessibilityLabel={tile.accessibilityLabel}
                onPress={() => {
                  setChooser(null)
                  onEventPress(tile.identity.uid)
                }}
                style={styles.chooserOption}
              >
                <ThemedText>{tile.accessibilityLabel}</ThemedText>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("calendar.event.chooser.cancel")}
              onPress={() => setChooser(null)}
              style={styles.chooserOption}
            >
              <ThemedText>{t("calendar.event.chooser.cancel")}</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  chooserBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  chooser: { borderRadius: 12, padding: 16, gap: 8 },
  chooserOption: { minHeight: 48, justifyContent: "center", padding: 8 },
})
