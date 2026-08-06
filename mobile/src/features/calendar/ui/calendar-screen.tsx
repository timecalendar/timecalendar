import { router } from "expo-router"
import { useTranslation } from "react-i18next"
import { Platform, RefreshControl, StyleSheet, View } from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"

import { ThemedView } from "@/components/themed-view"
import {
  eventRoute,
  formatMonthYear,
  GRID_END_MINUTE,
  GRID_START_MINUTE,
  resolveLocale,
  useCalendarEvents,
  useSyncCalendars,
} from "@/features/calendar/data"
import { CalendarTimeline } from "@/features/calendar/renderer"
import { Spacing, useTheme } from "@/theme"

import { AgendaList } from "./agenda-list"
import { CalendarAddFab } from "./calendar-screen/calendar-screen-actions"
import { CalendarScreenHeader } from "./calendar-screen/calendar-screen-header"
import { CalendarScreenStatus } from "./calendar-screen/calendar-screen-status"
import { useCalendarScreenController } from "./calendar-screen/use-calendar-screen-controller"

export function CalendarScreen() {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const bottomInset = Platform.OS === "ios" ? insets.bottom : 0
  const locale = resolveLocale(i18n.language)
  const {
    view,
    setView,
    anchorDate,
    visibleDate,
    range,
    timelineRef,
    goToToday,
    onVisibleDateChange,
    onSettledDateChange,
  } = useCalendarScreenController()
  const events = useCalendarEvents(range)
  const { sync, isSyncing, isError } = useSyncCalendars()

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

  return (
    <ThemedView style={styles.container}>
      <CalendarScreenHeader
        title={formatMonthYear(visibleDate, locale)}
        view={view}
        onViewChange={setView}
        onToday={goToToday}
        onAdd={onAdd}
      />
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <CalendarScreenStatus
          isEmpty={events.length === 0}
          isError={isError}
          onRetry={onSync}
        />
        <View style={styles.calendar}>
          {view === "agenda" ? (
            <AgendaList
              events={events}
              locale={locale}
              refreshControl={refreshControl}
              onPressEvent={(event) => onPressEvent(event.id)}
            />
          ) : (
            <CalendarTimeline
              ref={timelineRef}
              mode={view}
              anchorDate={anchorDate}
              events={events}
              startMinute={GRID_START_MINUTE}
              endMinute={GRID_END_MINUTE}
              showWeekends
              bottomInset={bottomInset}
              onVisibleDateChange={onVisibleDateChange}
              onSettledDateChange={onSettledDateChange}
              onPressEvent={(event) => onPressEvent(event.id)}
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
  safeArea: { flex: 1, gap: Spacing.two },
  calendar: { flex: 1 },
})
