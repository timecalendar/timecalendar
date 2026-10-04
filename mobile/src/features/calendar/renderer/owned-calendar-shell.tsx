import {
  type Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"
import { GestureDetector } from "react-native-gesture-handler"

import {
  type AppLocale,
  type CalendarTimelineMode,
  dayKey,
  type FirstWeekday,
  formatClockTime,
  FULL_DAY_END_MINUTE,
  FULL_DAY_START_MINUTE,
  MOUNTED_PAGE_RADIUS,
  nowIndicatorPosition,
  pageAnchor,
  type PageIndex,
  pageIndexOfInstant,
  pageKey,
  type PagePresenter,
  type PageTileV1,
} from "@/features/calendar/data"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { useTheme } from "@/theme"

import { OwnedCalendarCanvas } from "./owned-calendar-canvas"
import { EventChooser } from "./owned-calendar-chooser"
import { useOwnedCalendarCoordinator } from "./owned-calendar-coordinator"
import {
  type CalendarPageTitleTarget,
  useCalendarFocusRestoration,
} from "./owned-calendar-focus"
import {
  PAGE_CONTENT_HEIGHT,
  useScrollLockProps,
} from "./owned-calendar-geometry"
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

const ignore = () => undefined

// Props and the pager are destructured, never spread: the compiler treats a
// rest object as mutable, which would rebuild every page's handlers each render.
export function OwnedCalendarShell({
  ref,
  heading,
  pageTitleTarget,
  onContextSettled,
  mode,
  anchor,
  displayZone,
  locale,
  firstWeekday,
  currentDate,
  uses24HourClock,
  initialVerticalOffset,
  initialPixelsPerHour,
  presentPage,
  routeFocused,
  onDateCommitted,
  onPageWindowChange,
  onVerticalOffsetSettled,
  onZoomSettled,
  onEventPress: onEventActivated,
  onProbeDiagnostic,
}: OwnedCalendarShellProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const reduceMotion = useReducedMotion()
  const space = { mode, firstWeekday }
  const anchorIndex = pageIndexOfInstant(space, anchor, displayZone)
  const coordinator = useOwnedCalendarCoordinator({
    anchor,
    mode,
    displayZone,
    currentDate,
    initialVerticalOffset,
    initialPixelsPerHour,
    onVerticalOffsetSettled,
    onZoomSettled,
  })
  const {
    spaceKey,
    scrollRef: pagerRef,
    probeRef,
    scrollHandler,
    scrollProps,
    nativeGesture,
    onContentSizeChange,
    onPagerLayout,
    scrollX,
    positioned,
    pageWidth,
    contentWidth,
    mountedIndexes,
    settled,
    moving,
    isMoving,
    pageLeft,
    step,
  } = useOwnedCalendarPager({
    space,
    anchorIndex,
    pageWidth: pagerPageWidth(coordinator.viewportWidth),
    reduceMotion: reduceMotion !== false,
    scrollLocked: coordinator.scrollLocked,
    pinchGesture: coordinator.pinchGesture,
    trackNativeTouch: coordinator.trackNativeTouch,
    onSettled: (index) =>
      onDateCommitted(pageAnchor(space, index, displayZone)),
    onCenterChange: (center) => {
      onPageWindowChange?.(center)
      // Builds the next pages to enter the window a frame after this crossing
      // commits, so the next crossing mounts a page that is already presented.
      requestAnimationFrame(() => {
        presentPage(center - MOUNTED_PAGE_RADIUS - 1)
        presentPage(center + MOUNTED_PAGE_RADIUS + 1)
      })
    },
  })
  const pager = {
    spaceKey,
    scrollHandler,
    scrollProps,
    nativeGesture,
    onContentSizeChange,
    onPagerLayout,
    positioned,
    pageWidth,
    contentWidth,
  }
  const verticalScrollProps = useScrollLockProps(coordinator.scrollLocked)
  const committed = presentPage(settled)
  const committedKey = committed.pageKey
  const contextReady =
    committed.status === "ready" &&
    !moving &&
    committedKey === pageKey(space, anchorIndex)
  const accessibleActionInFlight = useRef(false)
  useEffect(() => {
    if (contextReady) accessibleActionInFlight.current = false
  }, [contextReady])

  const [chooser, setChooser] = useState<readonly PageTileV1[] | null>(null)
  const { registerTarget, rememberTarget, registerHeading } =
    useCalendarFocusRestoration({
      committedKey,
      currentColumns: committed.columns,
      contextReady,
      routeFocused,
      pageTitleTarget,
      heading,
      onContextSettled,
      pixelsPerHour: coordinator.pixelsPerHour,
      scrollTo: coordinator.scrollToOffset,
    })

  const { isVerticalMovementOwned } = coordinator
  const isEventActivationBlocked = () => isVerticalMovementOwned() || isMoving()
  const onEventPress = (uid: string) => {
    if (isEventActivationBlocked()) return
    const eventPress = onEventActivated ?? ignore
    eventPress(uid)
  }
  const handlers: PageEventHandlers = {
    onEventPress,
    onEventFocused: rememberTarget,
    onChooseConflict: setChooser,
    registerTarget,
    isEventActivationBlocked,
    onProbeDiagnostic,
  }
  useImperativeHandle(ref, () => ({
    requestZoom: coordinator.requestZoom,
  }))

  const todayKey = dayKey(currentDate, displayZone)
  // Explicit full-day bounds and the settled scale — the helper's 07:00–21:00
  // defaults stay as they are for Home's mini timeline and the agenda.
  const nowIndicator = nowIndicatorPosition(currentDate, displayZone, {
    pixelsPerHour: initialPixelsPerHour,
    startMinute: FULL_DAY_START_MINUTE,
    endMinute: FULL_DAY_END_MINUTE,
  })
  const nowLabel = t("calendar.nowLabel", {
    time: formatClockTime(currentDate, locale, displayZone, uses24HourClock),
  })
  const presentStartedAt = pagingLog.now()
  const pages = mountedIndexes.map((index) => {
    const presentation = presentPage(index)
    const isCommitted = index === settled
    const hasToday =
      nowIndicator.visible &&
      presentation.columns.some((column) => column.key === todayKey)
    return {
      presentation,
      left: pageLeft(index),
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
        registerHeading={registerHeading}
        pages={pages}
        pageWidth={pageWidth}
        contentWidth={contentWidth}
        scrollX={scrollX}
        positioned={positioned}
        heading={heading}
        controlSymbol={t("calendar.pageControlSymbol")}
        previousPageLabel={t(
          mode === "day"
            ? "calendar.previousDayLabel"
            : "calendar.previousWeekLabel",
        )}
        nextPageLabel={t(
          mode === "day" ? "calendar.nextDayLabel" : "calendar.nextWeekLabel",
        )}
        onAccessiblePageRequest={(direction) => {
          if (
            accessibleActionInFlight.current ||
            !contextReady ||
            coordinator.scrollLocked.get() ||
            isMoving()
          )
            return
          accessibleActionInFlight.current = true
          step(direction, reduceMotion === false)
        }}
        todayKey={todayKey}
        todayLabel={t("calendar.today")}
      />
      <GestureDetector gesture={coordinator.pinchGesture}>
        <OwnedCalendarCanvas
          locale={locale}
          uses24HourClock={uses24HourClock}
          initialVerticalOffset={initialVerticalOffset}
          scrollRef={coordinator.scrollRef}
          verticalScrollProps={verticalScrollProps}
          nativeScrollGesture={coordinator.nativeScrollGesture}
          onScroll={coordinator.onScroll}
          onScrollBeginDrag={coordinator.onScrollBeginDrag}
          onScrollEndDrag={coordinator.onScrollEndDrag}
          onViewportLayout={coordinator.onViewportLayout}
          onMomentumScrollBegin={coordinator.onMomentumScrollBegin}
          onMomentumScrollEnd={coordinator.settleVertical}
          pixelsPerHour={coordinator.pixelsPerHour}
          pagerRef={pagerRef}
          pagerProbeRef={probeRef}
          pager={pager}
        >
          {pages.map((page) => (
            <CalendarPage
              key={page.presentation.pageKey}
              presentation={page.presentation}
              left={page.left}
              width={pageWidth}
              height={PAGE_CONTENT_HEIGHT}
              committed={page.committed}
              nowDateKey={page.hasToday ? todayKey : null}
              nowMinuteOfDay={page.hasToday ? coordinator.nowMinuteOfDay : 0}
              nowLabel={page.hasToday && page.committed ? nowLabel : undefined}
              pixelsPerHour={coordinator.pixelsPerHour}
              settledPixelsPerHour={initialPixelsPerHour}
              handlers={handlers}
              t={t}
            />
          ))}
        </OwnedCalendarCanvas>
      </GestureDetector>
      <EventChooser
        tiles={chooser}
        onChoose={(uid) => {
          setChooser(null)
          onEventPress(uid)
        }}
        onClose={() => setChooser(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
})
