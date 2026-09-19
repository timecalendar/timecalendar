import { forwardRef, useImperativeHandle } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"
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
  onVerticalOffsetSettled: (offset: number) => void
  onZoomSettled: (settlement: CalendarZoomSettlement) => void
  onTransitionRequest: (request: CalendarTransitionRequest) => void
  onTransitionSettled: (revision: number) => void
  onTransitionCancelled: (revision: number) => void
  presentation?: CalendarTimelinePresentationV1
  onEventPress?: (uid: string) => void
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
          onMomentumScrollBegin={coordinator.cancelVerticalCandidate}
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
          onEventPress={props.onEventPress ?? ignoreEventPress}
        />
      </GestureDetector>
    </View>
  )
})

const styles = StyleSheet.create({ shell: { flex: 1 } })
