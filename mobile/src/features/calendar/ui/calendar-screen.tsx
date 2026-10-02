import { useCalendars } from "expo-localization"
import { router, useIsFocused, useLocalSearchParams } from "expo-router"
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

import { ThemedView } from "@/components/themed-view"
import { isDevVariant } from "@/config/variant"
import {
  DEFAULT_PIXELS_PER_HOUR,
  eventRoute,
  formatCompactMonthYear,
  formatFullDay,
  formatMonthYear,
  MAX_PIXELS_PER_HOUR,
  MIN_PIXELS_PER_HOUR,
  pageIndexOfInstant,
  pageKey,
  resolveLocale,
  useCalendarWindow,
  usePagePresenter,
  useSyncCalendars,
} from "@/features/calendar/data"
import {
  OwnedCalendarShell,
  type OwnedCalendarShellHandle,
} from "@/features/calendar/renderer"
import { useShowWeekendsPreference } from "@/features/settings/prefs"
import {
  ACCESSIBILITY_PROBE_INITIAL_VERTICAL_OFFSET,
  accessibilityProbeReader,
  recordAccessibilityProbeDiagnostic,
} from "@/test-support/owned-calendar/accessibility-probe"
import { Spacing, useTheme } from "@/theme"

import { CalendarAgendaPane } from "./calendar-agenda-pane"
import { CalendarAddFab } from "./calendar-screen/calendar-screen-actions"
import { CalendarScreenHeader } from "./calendar-screen/calendar-screen-header"
import { useCalendarScreenController } from "./calendar-screen/use-calendar-screen-controller"
import { useCalendarTitleFocus } from "./calendar-screen/use-calendar-title-focus"

export function CalendarScreen() {
  const { accessibilityProbe } = useLocalSearchParams<{
    accessibilityProbe?: string
  }>()
  const isAccessibilityProbe =
    isDevVariant() && accessibilityProbe === "timed-events"
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
    canGoToToday,
    goToToday,
    commitDate,
    verticalOffset,
    pixelsPerHour,
    settleVerticalOffset,
    settleZoom,
  } = useCalendarScreenController()
  const { showWeekends } = useShowWeekendsPreference()
  const timelineHeading = formatFullDay(selectedDate, locale, displayZone)
  const calendarShellRef = useRef<OwnedCalendarShellHandle>(null)
  const isFocused = useIsFocused()

  const space = { mode: timelineMode, firstWeekday }
  const { store, snapshot } = useCalendarWindow({
    displayZone,
    firstWeekday,
    reader: isAccessibilityProbe ? accessibilityProbeReader : undefined,
  })
  const presentPage = usePagePresenter({
    snapshot,
    space,
    locale,
    displayZone,
    showWeekends,
  })
  const selectedIndex = pageIndexOfInstant(space, selectedDate, displayZone)
  useEffect(() => {
    store.ensure({ mode: timelineMode, firstWeekday }, selectedIndex)
  }, [store, timelineMode, firstWeekday, selectedIndex])
  const {
    pageTitleTarget,
    setPageTitleTarget,
    titleTargetActive,
    onContextSettled,
  } = useCalendarTitleFocus({
    view,
    routeFocused: isFocused,
    presentationReady: presentPage(selectedIndex).status === "ready",
    pageKey: pageKey(space, selectedIndex),
    heading: timelineHeading,
  })
  const { sync, isSyncing, isError } = useSyncCalendars()

  const onPressEvent = (uid: string) => {
    if (isAccessibilityProbe) {
      recordAccessibilityProbeDiagnostic({ kind: "route", uid })
    }
    router.push(eventRoute(uid))
  }
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

  return (
    <ThemedView collapsable={false} style={styles.container}>
      <CalendarScreenHeader
        title={formatMonthYear(selectedDate, locale, displayZone)}
        compactTitle={formatCompactMonthYear(selectedDate, locale, displayZone)}
        contextHeading={timelineHeading}
        pageKey={pageKey(space, selectedIndex)}
        titleTargetActive={titleTargetActive}
        onTitleTargetChange={setPageTitleTarget}
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
            <CalendarAgendaPane
              selectedDate={selectedDate}
              displayZone={displayZone}
              locale={locale}
              isSyncing={isSyncing}
              isError={isError}
              onSync={onSync}
              refreshControl={refreshControl}
              onPressEvent={onPressEvent}
            />
          ) : (
            <OwnedCalendarShell
              ref={calendarShellRef}
              heading={timelineHeading}
              pageTitleTarget={pageTitleTarget}
              onContextSettled={onContextSettled}
              mode={timelineMode}
              anchor={selectedDate}
              displayZone={displayZone}
              locale={locale}
              firstWeekday={firstWeekday}
              showWeekends={showWeekends}
              currentDate={now}
              uses24HourClock={uses24HourClock}
              initialVerticalOffset={
                isAccessibilityProbe
                  ? ACCESSIBILITY_PROBE_INITIAL_VERTICAL_OFFSET
                  : verticalOffset
              }
              initialPixelsPerHour={pixelsPerHour}
              presentPage={presentPage}
              routeFocused={isFocused}
              onDateCommitted={commitDate}
              onPageWindowChange={(center) => store.ensure(space, center)}
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
              onEventPress={onPressEvent}
              onProbeDiagnostic={
                isAccessibilityProbe
                  ? recordAccessibilityProbeDiagnostic
                  : undefined
              }
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
})
