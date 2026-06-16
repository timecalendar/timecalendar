import { Link, router } from "expo-router"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import {
  eventRoute,
  formatFullDay,
  resolveLocale,
  useCalendarEvents,
  useSyncCalendars,
} from "@/features/calendar/data"
import {
  displayedDay,
  dynamicHourRange,
  eventsForDay,
} from "@/features/home/data"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

import { TodayTimeline } from "./today-timeline"
import { UpcomingScroller } from "./upcoming-scroller"

// The Home tab's today / next-up view (D1) — PRESENTATIONAL (70% floor). It reads
// the merged synced+personal events through the unchanged events-source seam
// (useCalendarEvents), computes the displayed day + the day's events + the dynamic
// hour window through the home data selectors (the only new logic), and composes the
// landed primitives: a header (app name heading + formatFullDay date + the pluralized
// count / empty state), the horizontal UpcomingScroller, the today section header,
// and the TodayTimeline mini-grid (the salvage engine's first rendering consumer).
// Pull-to-refresh + the error/retry banner reuse the sync orchestrator verbatim;
// tap routing reuses the calendar screen's origin-keyed handler. A designed brand
// surface from @/theme (R-3). The route ((tabs)/index.tsx) is a thin re-export.

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function HomeScreen() {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const locale = resolveLocale(i18n.language)

  // The clock is read once at mount (like the calendar/agenda) so the render stays
  // deterministic for "what day to show" + the now-indicator.
  const [now] = useState(() => new Date())

  // Read a window wide enough to resolve "today or the next day with events": from
  // today's local midnight forward two weeks. The merged set is the bounded
  // synced+personal set the calendar already reads; filtering to one day is a cheap
  // useMemo. The selectors decide which day to actually show.
  const range = useMemo(() => {
    const from = new Date(now)
    from.setHours(0, 0, 0, 0)
    const to = new Date(from)
    to.setDate(to.getDate() + 14)
    return { from, to }
  }, [now])

  const events = useCalendarEvents(range)

  const day = useMemo(() => displayedDay(events, now), [events, now])
  const dayEvents = useMemo(() => eventsForDay(events, day), [events, day])
  const hourRange = useMemo(() => dynamicHourRange(dayEvents), [dayEvents])
  const isToday = isSameLocalDay(day, now)

  const { sync, isSyncing, isError } = useSyncCalendars()

  // Route a tapped event by ORIGIN (item 3 parity): a synced calendar event carries
  // a userCalendarId → the read-only details screen; a personal event (no
  // userCalendarId) → its editable form.
  const handlePressEvent = (
    uid: string,
    userCalendarId: string | undefined,
  ) => {
    router.push(eventRoute(uid, userCalendarId))
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          testID="home-scroll"
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              testID="home-refresh"
              refreshing={isSyncing}
              onRefresh={() => {
                void sync()
              }}
              tintColor={theme.primary}
              colors={[theme.primary]}
              accessibilityLabel={t("calendar.sync.refreshingLabel")}
            />
          }
        >
          <View style={styles.header}>
            <ThemedText type="title">{t("app.name")}</ThemedText>
            <ThemedText type="subtitle">
              {formatFullDay(day, locale)}
            </ThemedText>
            <ThemedText
              themeColor="textSecondary"
              accessibilityLiveRegion="polite"
              accessibilityRole="text"
            >
              {dayEvents.length === 0
                ? t("home.header.empty")
                : t("home.header.count", { count: dayEvents.length })}
            </ThemedText>
          </View>

          {isError && (
            <View
              style={styles.syncError}
              accessibilityLiveRegion="polite"
              testID="home-sync-error"
            >
              <ThemedText
                type="small"
                themeColor="textSecondary"
                accessibilityRole="alert"
                style={styles.syncErrorText}
              >
                {t("calendar.sync.error")}
              </ThemedText>
              <Pressable
                testID="home-sync-retry"
                accessibilityRole="button"
                accessibilityLabel={t("calendar.sync.retryLabel")}
                hitSlop={Spacing.two}
                onPress={() => {
                  void sync()
                }}
                style={[
                  styles.retryButton,
                  { backgroundColor: theme.backgroundElement },
                ]}
              >
                <ThemedText type="smallBold">
                  {t("calendar.sync.retry")}
                </ThemedText>
              </Pressable>
            </View>
          )}

          <UpcomingScroller
            events={dayEvents}
            locale={locale}
            onPressEvent={(event) =>
              handlePressEvent(event.id, event.userCalendarId)
            }
          />

          <ThemedText type="subtitle" accessibilityRole="header">
            {t("home.today.title")}
          </ThemedText>

          {dayEvents.length === 0 ? (
            <ThemedText
              themeColor="textSecondary"
              accessibilityRole="text"
              accessibilityLiveRegion="polite"
            >
              {t("home.today.empty")}
            </ThemedText>
          ) : (
            <TodayTimeline
              events={dayEvents}
              range={hourRange}
              locale={locale}
              isToday={isToday}
              now={now}
              onPressEvent={(event) =>
                handlePressEvent(event.id, event.userCalendarId)
              }
            />
          )}

          <Link href="/personal-event-form" asChild>
            <Pressable
              testID="home-add-personal-event"
              accessibilityRole="button"
              accessibilityLabel={t("home.addPersonalEvent")}
              hitSlop={Spacing.two}
              style={StyleSheet.flatten([
                styles.addButton,
                { backgroundColor: theme.backgroundElement },
              ])}
            >
              <ThemedText type="smallBold">
                {t("home.addPersonalEvent")}
              </ThemedText>
            </Pressable>
          </Link>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
  },
  syncError: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  syncErrorText: {
    flex: 1,
  },
  retryButton: {
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    justifyContent: "center",
    borderRadius: Radii.medium,
  },
  addButton: {
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Radii.medium,
  },
})
