import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react"
import { useTranslation } from "react-i18next"
import {
  AccessibilityInfo,
  findNodeHandle,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { GestureDetector } from "react-native-gesture-handler"

import {
  type AppLocale,
  type CalendarTimelineMode,
  type CalendarTimelinePresentationV1,
  type CalendarTransitionRequest,
  type FirstWeekday,
  formatClockTime,
} from "@/features/calendar/data"
import { useTheme } from "@/theme"

import { OwnedCalendarCanvas } from "./owned-calendar-canvas"
import { useOwnedCalendarCoordinator } from "./owned-calendar-coordinator"
import { OwnedCalendarDateHeader } from "./owned-calendar-header"
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

type OwnedCalendarShellProps = {
  heading: string
  pageTitleTarget?: CalendarPageTitleTarget | null
  onContextSettled?: (revision: number, titleFocused: boolean) => void
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
  generation: number
  revisionFloor: number
  acceptedTransitionRevision?: number | null
  transitionPending?: boolean
  routeFocused?: boolean
  onVerticalOffsetSettled: (offset: number) => void
  onZoomSettled: (settlement: CalendarZoomSettlement) => void
  onTransitionRequest: (request: CalendarTransitionRequest) => void
  onTransitionSettled: (revision: number) => void
  onTransitionCancelled: (revision: number) => void
  presentation?: CalendarTimelinePresentationV1
  onEventPress?: (uid: string) => void
  onProbeDiagnostic?:
    | ((diagnostic: OwnedCalendarProbeDiagnostic) => void)
    | undefined
}

export type OwnedCalendarShellHandle = {
  requestZoom: (command: CalendarZoomCommand) => void
  restoreFocus: () => void
}

const ignoreEventPress = () => undefined
const NO_COLUMNS: readonly {
  key: string
  tiles: readonly { key: string }[]
}[] = []

type FocusTarget = { node: View; dateKey: string; minute: number }
type FocusMemory = { key: string; dateKey: string }
export type CalendarPageTitleTarget = {
  node: Text
  visibleTitle: string
  label: string
  contextHeading: string
  generation: number
  revision: number
}
type FocusContext = {
  generation: number
  revision: number
  presentationGeneration: number | undefined
  routeFocused: boolean
  transitionPending: boolean
}

function requestRestoredFocus({
  targets,
  headings,
  pageTitleTarget,
  heading,
  generation,
  revision,
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
  generation: number
  revision: number
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
    pageTitleTarget?.generation === generation &&
    pageTitleTarget.revision === revision &&
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

export const OwnedCalendarShell = forwardRef<
  OwnedCalendarShellHandle,
  OwnedCalendarShellProps
>(function OwnedCalendarShell(props, ref) {
  const { t } = useTranslation()
  const theme = useTheme()
  const coordinator = useOwnedCalendarCoordinator(props)
  const {
    acceptedTransitionRevision,
    generation: currentGeneration,
    heading,
    onContextSettled,
    pageTitleTarget,
    presentation,
    routeFocused,
    transitionPending,
  } = props
  const targets = useRef(new Map<string, FocusTarget>()).current
  const headings = useRef(new Map<string, View>()).current
  const activeGeneration = useRef(props.generation)
  const focusContext = useRef<FocusContext>({
    generation: props.generation,
    revision: props.acceptedTransitionRevision ?? 0,
    presentationGeneration: props.presentation?.generation,
    routeFocused: props.routeFocused !== false,
    transitionPending: props.transitionPending ?? false,
  })
  const titleContext = useRef(props.pageTitleTarget)
  const returnFrame = useRef<number | null>(null)
  useLayoutEffect(() => {
    activeGeneration.current = props.generation
    titleContext.current = props.pageTitleTarget
    focusContext.current = {
      generation: props.generation,
      revision: props.acceptedTransitionRevision ?? 0,
      presentationGeneration: props.presentation?.generation,
      routeFocused: props.routeFocused !== false,
      transitionPending: props.transitionPending ?? false,
    }
    if (returnFrame.current !== null) {
      cancelAnimationFrame(returnFrame.current)
      returnFrame.current = null
    }
  }, [
    props.acceptedTransitionRevision,
    props.generation,
    props.presentation?.generation,
    props.pageTitleTarget,
    props.routeFocused,
    props.transitionPending,
  ])
  const lastFocused = useRef<FocusMemory | null>(null)
  const lastRestore = useRef<string | null>(null)
  const lastAutoRevision = useRef<string | null>(null)
  const returnEpoch = useRef(0)
  const pendingReturn = useRef(false)
  const currentColumns = props.presentation?.pages[1].columns ?? NO_COLUMNS
  const isFocusContextCurrent = (generation: number, revision: number) => {
    const current = focusContext.current
    return (
      current.generation === generation &&
      current.revision === revision &&
      current.presentationGeneration === generation &&
      current.routeFocused &&
      !current.transitionPending
    )
  }
  const registerTarget = (
    key: string,
    dateKey: string,
    minute: number,
    node: View | null,
  ) => {
    if (node === null) targets.delete(key)
    else if (!targets.has(key)) targets.set(key, { node, dateKey, minute })
  }
  const rememberTarget = (key: string, dateKey: string, generation: number) => {
    const revision = props.acceptedTransitionRevision ?? 0
    if (
      activeGeneration.current !== generation ||
      !isFocusContextCurrent(generation, revision) ||
      targets.get(key)?.dateKey !== dateKey ||
      (lastFocused.current?.key === key &&
        lastFocused.current.dateKey === dateKey)
    )
      return
    lastFocused.current = { key, dateKey }
  }
  useEffect(() => {
    const revision = acceptedTransitionRevision ?? 0
    if (
      routeFocused === false ||
      transitionPending ||
      presentation?.generation !== currentGeneration
    )
      return
    const autoRevision = `${currentGeneration}:${revision}`
    if (lastAutoRevision.current === autoRevision) return
    const frame = requestRestoredFocus({
      targets,
      headings,
      pageTitleTarget,
      heading,
      generation: currentGeneration,
      revision,
      currentColumns,
      lastFocused,
      lastRestore,
      restoreKey: `${currentGeneration}:${revision}:${returnEpoch.current}`,
      pixelsPerHour: coordinator.pixelsPerHour.get(),
      scrollTo: (y) =>
        coordinator.scrollRef.current?.scrollTo({ y, animated: false }),
      isCurrent: () =>
        isFocusContextCurrent(currentGeneration, revision) &&
        titleContext.current === pageTitleTarget,
      onFocused: (titleFocused) => {
        pendingReturn.current = false
        lastAutoRevision.current = autoRevision
        onContextSettled?.(revision, titleFocused)
      },
    })
    if (frame === null) {
      lastAutoRevision.current = autoRevision
      onContextSettled?.(revision, false)
    }
    if (typeof frame === "number") return () => cancelAnimationFrame(frame)
  }, [
    coordinator.pixelsPerHour,
    coordinator.scrollRef,
    currentColumns,
    currentGeneration,
    headings,
    heading,
    onContextSettled,
    pageTitleTarget,
    acceptedTransitionRevision,
    presentation,
    routeFocused,
    transitionPending,
    targets,
  ])
  const restoreFocus = () => {
    returnEpoch.current += 1
    const revision = props.acceptedTransitionRevision ?? 0
    if (
      props.routeFocused === false ||
      props.transitionPending ||
      props.presentation?.generation !== props.generation
    )
      return
    if (returnFrame.current !== null) cancelAnimationFrame(returnFrame.current)
    const frame = requestRestoredFocus({
      targets,
      headings,
      pageTitleTarget: props.pageTitleTarget,
      heading: props.heading,
      generation: props.generation,
      revision,
      currentColumns,
      lastFocused,
      lastRestore,
      restoreKey: `${props.generation}:${revision}:${returnEpoch.current}`,
      pixelsPerHour: coordinator.pixelsPerHour.get(),
      scrollTo: (y) =>
        coordinator.scrollRef.current?.scrollTo({ y, animated: false }),
      isCurrent: () =>
        isFocusContextCurrent(props.generation, revision) &&
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
      props.routeFocused !== false &&
      !props.transitionPending &&
      props.presentation?.generation === props.generation &&
      props.pageTitleTarget !== null &&
      props.pageTitleTarget !== undefined
    )
      restoreFocusRef.current()
  }, [
    props.acceptedTransitionRevision,
    props.generation,
    props.pageTitleTarget,
    props.presentation?.generation,
    props.routeFocused,
    props.transitionPending,
  ])
  useEffect(
    () => () => {
      if (returnFrame.current !== null)
        cancelAnimationFrame(returnFrame.current)
    },
    [],
  )
  const onEventPress = (uid: string) => {
    if (coordinator.isEventActivationBlocked()) return
    const eventPress = props.onEventPress ?? ignoreEventPress
    eventPress(uid)
  }
  useImperativeHandle(ref, () => ({
    requestZoom: coordinator.requestZoom,
    restoreFocus,
  }))

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
        pages={coordinator.pages}
        locale={props.locale}
        displayZone={props.displayZone}
        todayKey={coordinator.todayKey}
        todayLabel={t("calendar.today")}
        stripStyle={coordinator.headerStripStyle}
      />
      <GestureDetector gesture={coordinator.pinchGesture}>
        <OwnedCalendarCanvas
          heading={props.heading}
          mode={props.mode}
          locale={props.locale}
          displayZone={props.displayZone}
          uses24HourClock={props.uses24HourClock}
          initialVerticalOffset={props.initialVerticalOffset}
          generation={props.generation}
          geometryRevision={coordinator.geometryRevision}
          pages={coordinator.pages}
          pagerRef={coordinator.pagerRef}
          scrollRef={coordinator.scrollRef}
          nativeScrollGesture={coordinator.nativeScrollGesture}
          nativePagerGesture={coordinator.nativePagerGesture}
          onPageScroll={coordinator.onPageScroll}
          onPageSelected={coordinator.onPageSelected}
          onPageScrollStateChanged={coordinator.onPageScrollStateChanged}
          onScroll={coordinator.onScroll}
          onScrollBeginDrag={coordinator.onScrollBeginDrag}
          onScrollEndDrag={coordinator.onScrollEndDrag}
          onViewportLayout={coordinator.onViewportLayout}
          onMomentumScrollBegin={coordinator.onMomentumScrollBegin}
          onMomentumScrollEnd={coordinator.settleVertical}
          onAccessiblePageRequest={coordinator.requestAccessiblePage}
          pixelsPerHour={coordinator.pixelsPerHour}
          settledPixelsPerHour={props.initialPixelsPerHour}
          todayKey={coordinator.todayKey}
          nowMinuteOfDay={coordinator.nowMinuteOfDay}
          nowVisible={coordinator.nowVisible}
          nowOnCommittedPage={coordinator.nowOnCommittedPage}
          nowLabel={formatClockTime(
            props.currentDate,
            props.locale,
            props.displayZone,
            props.uses24HourClock,
          )}
          t={t}
          onEventPress={onEventPress}
          onEventFocused={rememberTarget}
          registerTarget={registerTarget}
          onProbeDiagnostic={props.onProbeDiagnostic}
          isEventActivationBlocked={coordinator.isEventActivationBlocked}
        />
      </GestureDetector>
    </View>
  )
})

const styles = StyleSheet.create({ shell: { flex: 1 } })
