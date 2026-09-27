import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react"
import { useTranslation } from "react-i18next"
import {
  AccessibilityInfo,
  findNodeHandle,
  StyleSheet,
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
  focusReturnEpoch?: number
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
}

const ignoreEventPress = () => undefined

export const OwnedCalendarShell = forwardRef<
  OwnedCalendarShellHandle,
  OwnedCalendarShellProps
>(function OwnedCalendarShell(props, ref) {
  const { t } = useTranslation()
  const theme = useTheme()
  const coordinator = useOwnedCalendarCoordinator(props)
  const focusRegistry = useMemo(
    () => ({
      generation: props.generation,
      targets: new Map<
        string,
        { node: View; dateKey: string; minute: number }
      >(),
      headings: new Map<string, View>(),
    }),
    [props.generation],
  )
  const targets = focusRegistry.targets
  const headings = focusRegistry.headings
  const activeTargets = useRef(targets)
  useLayoutEffect(() => {
    activeTargets.current = targets
  }, [targets])
  const lastFocused = useRef<{ key: string; dateKey: string } | null>(null)
  const lastRestore = useRef<string | null>(null)
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
    if (activeTargets.current !== targets) return
    if (targets.get(key)?.dateKey === dateKey)
      lastFocused.current = { key, dateKey }
  }
  useEffect(() => {
    const revision = props.acceptedTransitionRevision ?? 0
    if (
      props.transitionPending ||
      props.presentation?.generation !== props.generation
    )
      return
    const restoreKey = `${props.generation}:${revision}:${props.focusReturnEpoch ?? 0}`
    if (lastRestore.current === restoreKey || lastFocused.current === null)
      return
    const last = lastFocused.current
    const target = targets.get(last.key)
    const node =
      target?.node ??
      headings.get(last.dateKey) ??
      headings.values().next().value
    if (node === null || node === undefined) return
    if (target !== undefined) {
      coordinator.scrollRef.current?.scrollTo({
        y: Math.max(
          0,
          (target.minute / 60) * coordinator.pixelsPerHour.get() - 96,
        ),
        animated: false,
      })
    }
    const frame = requestAnimationFrame(() => {
      if (activeTargets.current !== targets || props.transitionPending) return
      const handle = findNodeHandle(node)
      if (handle !== null) {
        lastRestore.current = restoreKey
        AccessibilityInfo.setAccessibilityFocus(handle)
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [
    coordinator.pixelsPerHour,
    coordinator.scrollRef,
    headings,
    props.acceptedTransitionRevision,
    props.focusReturnEpoch,
    props.generation,
    props.presentation,
    props.transitionPending,
    targets,
  ])
  const onEventPress = (uid: string) => {
    if (coordinator.isEventActivationBlocked()) return
    const eventPress = props.onEventPress ?? ignoreEventPress
    eventPress(uid)
  }
  useImperativeHandle(ref, () => ({ requestZoom: coordinator.requestZoom }), [
    coordinator.requestZoom,
  ])

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
