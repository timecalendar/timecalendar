import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"
import { GestureDetector } from "react-native-gesture-handler"

import type {
  AppLocale,
  CalendarTimelineMode,
  CalendarTransitionRequest,
  FirstWeekday,
} from "@/features/calendar/data"
import { useTheme } from "@/theme"

import { OwnedCalendarCanvas } from "./owned-calendar-canvas"
import { useOwnedCalendarCoordinator } from "./owned-calendar-coordinator"
import { OwnedCalendarDateHeader } from "./owned-calendar-header"

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
  generation: number
  revisionFloor: number
  onVerticalOffsetSettled: (offset: number) => void
  onTransitionRequest: (request: CalendarTransitionRequest) => void
  onTransitionSettled: (revision: number) => void
  onTransitionCancelled: (revision: number) => void
}

export function OwnedCalendarShell(props: OwnedCalendarShellProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const coordinator = useOwnedCalendarCoordinator(props)

  return (
    <GestureDetector gesture={coordinator.pinchGesture}>
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
          onLaneLayout={coordinator.onHeaderLaneLayout}
        />
        <OwnedCalendarCanvas
          heading={props.heading}
          mode={props.mode}
          locale={props.locale}
          uses24HourClock={props.uses24HourClock}
          initialVerticalOffset={props.initialVerticalOffset}
          generation={props.generation}
          pages={coordinator.pages}
          pagerRef={coordinator.pagerRef}
          scrollRef={coordinator.scrollRef}
          nativeScrollGesture={coordinator.nativeScrollGesture}
          nativePagerGesture={coordinator.nativePagerGesture}
          onPageScroll={coordinator.onPageScroll}
          onPageSelected={coordinator.onPageSelected}
          onPageScrollStateChanged={coordinator.onPageScrollStateChanged}
          onScrollEndDrag={coordinator.onScrollEndDrag}
          onMomentumScrollBegin={coordinator.cancelVerticalCandidate}
          onMomentumScrollEnd={coordinator.settleVertical}
          onAccessiblePageRequest={coordinator.requestAccessiblePage}
          t={t}
        />
      </View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({ shell: { flex: 1 } })
