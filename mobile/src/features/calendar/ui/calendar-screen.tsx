import { useCalendars } from "expo-localization"
import { router } from "expo-router"
import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import {
  AccessibilityInfo,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { useAdaptiveLayout } from "@/components/adaptive-content"
import { ThemedView } from "@/components/themed-view"
import {
  DEFAULT_PIXELS_PER_HOUR,
  eventRoute,
  formatFullDay,
  formatMonthYear,
  MAX_PIXELS_PER_HOUR,
  MIN_PIXELS_PER_HOUR,
  resolveLocale,
  useCalendarEvents,
  useSyncCalendars,
} from "@/features/calendar/data"
import {
  OwnedCalendarShell,
  type OwnedCalendarShellHandle,
} from "@/features/calendar/renderer"
import { useChecklistProgress } from "@/features/event-checklists"
import { useShowWeekendsPreference } from "@/features/settings/prefs"
import { Spacing, useTheme } from "@/theme"

import { AgendaList } from "./agenda-list"
import { CalendarAddFab } from "./calendar-screen/calendar-screen-actions"
import { CalendarScreenHeader } from "./calendar-screen/calendar-screen-header"
import { CalendarScreenStatus } from "./calendar-screen/calendar-screen-status"
import { useCalendarScreenController } from "./calendar-screen/use-calendar-screen-controller"

export function CalendarScreen() {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const locale = resolveLocale(i18n.language)
  const uses24HourClock = useCalendars()[0].uses24hourClock
  const {
    view,
    setView,
    now,
    timelineMode,
    selectedDate,
    firstWeekday,
    displayZone,
    range,
    canGoToToday,
    goToToday,
    rendererGeneration,
    transitionRevision,
    acceptedTransitionRevision,
    verticalOffset,
    pixelsPerHour,
    settleVerticalOffset,
    settleZoom,
    requestTransition,
    settleTransition,
    cancelTransition,
  } = useCalendarScreenController()
  const { showWeekends } = useShowWeekendsPreference()
  const timelineHeading = formatFullDay(selectedDate, locale, displayZone)
  const calendarShellRef = useRef<OwnedCalendarShellHandle>(null)
  const announcedRevision = useRef<number | null>(null)

  useEffect(() => {
    if (
      acceptedTransitionRevision === null ||
      acceptedTransitionRevision === announcedRevision.current
    ) {
      return
    }
    announcedRevision.current = acceptedTransitionRevision
    AccessibilityInfo.announceForAccessibility(timelineHeading)
  }, [acceptedTransitionRevision, timelineHeading])
  const events = useCalendarEvents(range)
  const eventUids = events.map((event) => event.id)
  const checklistProgress = useChecklistProgress(eventUids)
  const { sync, isSyncing, isError } = useSyncCalendars()
  const agendaLayout = useAdaptiveLayout("standard")

  const onPressEvent = (uid: string) => router.push(eventRoute(uid))
  const onAdd = () => router.push("/personal-event-form")
  const onSync = () => {
    void sync()
  }
  const zoom =
    view === "agenda"
      ? null
      : {
          canZoomIn: pixelsPerHour < MAX_PIXELS_PER_HOUR,
          canZoomOut: pixelsPerHour > MIN_PIXELS_PER_HOUR,
          canResetZoom: pixelsPerHour !== DEFAULT_PIXELS_PER_HOUR,
          onZoomIn: () => calendarShellRef.current?.requestZoom("in"),
          onZoomOut: () => calendarShellRef.current?.requestZoom("out"),
          onResetZoom: () => calendarShellRef.current?.requestZoom("reset"),
        }
  const refreshControl = (
    <RefreshControl
      testID="calendar-refresh"
      refreshing={isSyncing}
      onRefresh={onSync}
      tintColor={theme.primary}
      colors={[theme.primary]}
      accessibilityLabel={t("calendar.sync.refreshingLabel")}
    />
  )
  const status = (
    <CalendarScreenStatus
      isEmpty={events.length === 0}
      isError={isError}
      isSyncing={isSyncing}
      onRetry={onSync}
    />
  )

  return (
    <ThemedView collapsable={false} style={styles.container}>
      <CalendarScreenHeader
        title={formatMonthYear(selectedDate, locale, displayZone)}
        view={view}
        onViewChange={setView}
        onToday={canGoToToday ? goToToday : undefined}
        onAdd={onAdd}
        zoom={zoom}
      />
      <SafeAreaView
        collapsable={false}
        style={styles.safeArea}
        edges={["left", "right"]}
      >
        <View
          collapsable={false}
          style={styles.calendar}
          testID="calendar-full-bleed-owner"
        >
          {view === "agenda" ? (
            <View
              testID="calendar-agenda-responsive-owner"
              style={styles.agendaOwner}
              onLayout={agendaLayout.onLayout}
            >
              <View
                testID="calendar-agenda-responsive-lane"
                style={[agendaLayout.laneStyle, styles.agendaLane]}
              >
                {status}
                <AgendaList
                  events={events}
                  checklistProgress={checklistProgress}
                  locale={locale}
                  displayZone={displayZone}
                  refreshControl={refreshControl}
                  onPressEvent={(event) => onPressEvent(event.id)}
                />
              </View>
            </View>
          ) : (
            <OwnedCalendarShell
              ref={calendarShellRef}
              heading={timelineHeading}
              mode={timelineMode}
              anchor={selectedDate}
              displayZone={displayZone}
              locale={locale}
              firstWeekday={firstWeekday}
              showWeekends={showWeekends}
              currentDate={now}
              uses24HourClock={uses24HourClock}
              initialVerticalOffset={verticalOffset}
              initialPixelsPerHour={pixelsPerHour}
              generation={rendererGeneration}
              revisionFloor={transitionRevision}
              onTransitionRequest={requestTransition}
              onTransitionSettled={settleTransition}
              onTransitionCancelled={cancelTransition}
              onVerticalOffsetSettled={settleVerticalOffset}
              onZoomSettled={(settlement) => {
                settleZoom(settlement)
                if (settlement.source === "command") {
                  AccessibilityInfo.announceForAccessibility(
                    t("calendar.zoom.announcement", {
                      percent: Math.round(
                        (settlement.pixelsPerHour / DEFAULT_PIXELS_PER_HOUR) *
                          100,
                      ),
                    }),
                  )
                }
              }}
            />
          )}
          {Platform.OS === "android" && <CalendarAddFab onPress={onAdd} />}
        </View>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  calendar: { flex: 1, gap: Spacing.two },
  agendaOwner: { flex: 1 },
  agendaLane: { flex: 1, gap: Spacing.two },
})
