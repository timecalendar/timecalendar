import { router } from "expo-router"
import { useEffect, useMemo, useRef } from "react"
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
  eventRoute,
  formatFullDay,
  formatMonthYear,
  resolveLocale,
  useCalendarEvents,
  useSyncCalendars,
} from "@/features/calendar/data"
import { OwnedCalendarShell } from "@/features/calendar/renderer"
import { useChecklistProgress } from "@/features/event-checklists"
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
  const {
    view,
    setView,
    selectedDate,
    displayZone,
    range,
    canGoToToday,
    goToToday,
    rendererGeneration,
    rendererPagePosition,
    transitionRevision,
    acceptedTransitionRevision,
    requestTransition,
    settleTransition,
    cancelTransition,
  } = useCalendarScreenController()
  const weekHeading = formatFullDay(selectedDate, locale, displayZone)
  const announcedRevision = useRef<number | null>(null)

  useEffect(() => {
    if (
      acceptedTransitionRevision === null ||
      acceptedTransitionRevision === announcedRevision.current
    ) {
      return
    }
    announcedRevision.current = acceptedTransitionRevision
    AccessibilityInfo.announceForAccessibility(weekHeading)
  }, [acceptedTransitionRevision, weekHeading])
  const events = useCalendarEvents(range)
  const eventUids = useMemo(() => events.map((event) => event.id), [events])
  const checklistProgress = useChecklistProgress(eventUids)
  const { sync, isSyncing, isError } = useSyncCalendars()
  const agendaLayout = useAdaptiveLayout("standard")

  const onPressEvent = (uid: string) => router.push(eventRoute(uid))
  const onAdd = () => router.push("/personal-event-form")
  const onSync = () => {
    void sync()
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
    <ThemedView style={styles.container}>
      <CalendarScreenHeader
        title={formatMonthYear(selectedDate, locale, displayZone)}
        view={view}
        onViewChange={setView}
        onToday={canGoToToday ? goToToday : undefined}
        onAdd={onAdd}
      />
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <View style={styles.calendar} testID="calendar-full-bleed-owner">
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
              heading={weekHeading}
              anchor={selectedDate}
              displayZone={displayZone}
              generation={rendererGeneration}
              pagePosition={rendererPagePosition}
              revisionFloor={transitionRevision}
              onTransitionRequest={requestTransition}
              onTransitionSettled={settleTransition}
              onTransitionCancelled={cancelTransition}
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
