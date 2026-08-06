import { Image } from "expo-image"
import { router, useFocusEffect } from "expo-router"
import { SymbolView } from "expo-symbols"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Platform,
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
  type CalendarEvent,
  eventRoute,
  formatDayMonth,
  formatFullDay,
  formatTime,
  resolveLocale,
  useCalendarEvents,
  useSyncCalendars,
} from "@/features/calendar/data"
import {
  type DayCaption,
  dayCaption,
  dynamicHourRange,
  eventsForDay,
  type GreetingSelection,
  greetingSelection,
  nextActiveDay,
  remainingEvents,
  splitDayEvents,
} from "@/features/home/data"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

import { eventSurfaceColor } from "./event-surface"
import { TodayTimeline } from "./today-timeline"
import { UpcomingScroller } from "./upcoming-scroller"

const FUTURE_WINDOW_DAYS = 14
const MAX_EVENT_DOTS = 5

function startOfLocalDay(date: Date): Date {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  return start
}

function localDayKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function greetingKey(selection: GreetingSelection): string {
  const prefix = selection.weekend ? "home.greeting.weekend." : "home.greeting."
  return `${prefix}${selection.period}.${selection.variant}`
}

export function HomeScreen() {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const locale = resolveLocale(i18n.language)
  const [now, setNow] = useState(() => new Date())

  useFocusEffect(
    useCallback(() => {
      let timer: ReturnType<typeof setTimeout>
      const refreshClock = () => {
        const current = new Date()
        setNow(current)
        timer = setTimeout(refreshClock, 60_050 - (Date.now() % 60_000))
      }
      refreshClock()
      return () => clearTimeout(timer)
    }, []),
  )

  const range = useMemo(() => {
    const from = startOfLocalDay(now)
    const to = new Date(from)
    to.setDate(to.getDate() + FUTURE_WINDOW_DAYS)
    return { from, to }
  }, [now])
  const events = useCalendarEvents(range)
  const todayEvents = useMemo(() => eventsForDay(events, now), [events, now])
  const { allDay, timed } = useMemo(
    () => splitDayEvents(todayEvents),
    [todayEvents],
  )
  const upcoming = useMemo(() => remainingEvents(timed, now), [timed, now])
  const nextDay = useMemo(() => nextActiveDay(events, now), [events, now])
  const hourRange = useMemo(() => dynamicHourRange(timed, now), [timed, now])
  const caption = useMemo(
    () => dayCaption(todayEvents, now),
    [todayEvents, now],
  )
  const greeting = useMemo(() => greetingSelection(now), [now])
  const { sync, isSyncing, isError } = useSyncCalendars()

  const openEvent = (event: CalendarEvent) => router.push(eventRoute(event.id))
  const addEvent = () => router.push("/personal-event-form")
  const openCalendar = (day: Date) =>
    router.push({
      pathname: "/calendar",
      params: { focusDate: localDayKey(day) },
    })

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <BrandHeader onAdd={addEvent} />
        <ScrollView
          testID="home-scroll"
          contentContainerStyle={[
            styles.content,
            Platform.OS === "android"
              ? styles.androidContent
              : styles.iosContent,
          ]}
          refreshControl={
            <RefreshControl
              testID="home-refresh"
              refreshing={isSyncing}
              onRefresh={() => void sync()}
              tintColor={theme.primary}
              colors={[theme.primary]}
              accessibilityLabel={t("calendar.sync.refreshingLabel")}
            />
          }
        >
          <WelcomeCard
            date={formatDayMonth(now, locale)}
            greeting={t(greetingKey(greeting))}
            caption={captionText(caption, locale, t)}
            events={todayEvents}
          />

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
                onPress={() => void sync()}
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

          <View style={styles.section}>
            <SectionHeader
              title={t("home.upcoming.title")}
              action={t("home.upcoming.seeAll")}
              onAction={() => openCalendar(now)}
            />
            {upcoming.length > 0 ? (
              <UpcomingScroller
                events={upcoming}
                locale={locale}
                onPressEvent={openEvent}
              />
            ) : todayEvents.length > 0 ? (
              <ThemedText themeColor="textSecondary">
                {t("home.upcoming.finished")}
              </ThemedText>
            ) : nextDay !== undefined ? (
              <NextDayCard
                day={nextDay.day}
                count={nextDay.events.length}
                firstStart={nextDay.firstTimedStart}
                onPress={() => openCalendar(nextDay.day)}
              />
            ) : (
              <ThemedText themeColor="textSecondary">
                {t("home.upcoming.none")}
              </ThemedText>
            )}
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              {t("home.today.title")}
            </ThemedText>
            {allDay.length > 0 && (
              <AllDayEvents events={allDay} onPressEvent={openEvent} />
            )}
            {timed.length > 0 ? (
              <TodayTimeline
                events={timed}
                range={hourRange}
                locale={locale}
                isToday
                now={now}
                onPressEvent={openEvent}
              />
            ) : todayEvents.length === 0 ? (
              <ThemedText
                themeColor="textSecondary"
                accessibilityLiveRegion="polite"
              >
                {t("home.today.empty")}
              </ThemedText>
            ) : null}
          </View>
        </ScrollView>
        {Platform.OS === "android" && <AddFab onPress={addEvent} />}
      </SafeAreaView>
    </ThemedView>
  )
}

function BrandHeader({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation()
  const theme = useTheme()
  return (
    <View style={styles.brandHeader}>
      <View style={styles.brandLockup}>
        <Image
          source={require("@/assets/brand/logo.png")}
          style={styles.logo}
          accessibilityElementsHidden
        />
        <ThemedText style={styles.appName} numberOfLines={2}>
          {t("app.name")}
        </ThemedText>
      </View>
      {Platform.OS === "ios" && (
        <Pressable
          testID="home-add-personal-event"
          accessibilityRole="button"
          accessibilityLabel={t("home.addPersonalEvent")}
          onPress={onAdd}
          style={styles.headerAction}
        >
          <SymbolView name="plus" size={24} tintColor={theme.primary} />
        </Pressable>
      )}
    </View>
  )
}

function WelcomeCard({
  date,
  greeting,
  caption,
  events,
}: {
  date: string
  greeting: string
  caption: string
  events: CalendarEvent[]
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  return (
    <View style={[styles.hero, { backgroundColor: theme.homeHero }]}>
      <ThemedText
        type="smallBold"
        style={[styles.heroDate, { color: theme.homeHeroDate }]}
      >
        {date.toLocaleUpperCase()}
      </ThemedText>
      <ThemedText style={styles.heroGreeting} accessibilityRole="header">
        {greeting}
      </ThemedText>
      <ThemedText>{caption}</ThemedText>
      <View style={styles.summaryRow}>
        <View style={styles.dots} accessibilityElementsHidden>
          {events.slice(0, MAX_EVENT_DOTS).map((event, index) => (
            <View
              key={event.id}
              style={[
                styles.dot,
                {
                  backgroundColor: event.color,
                  marginLeft: index === 0 ? 0 : -Spacing.one,
                },
              ]}
            />
          ))}
          {events.length > MAX_EVENT_DOTS && (
            <ThemedText type="smallBold" style={styles.extraDots}>
              {`+${events.length - MAX_EVENT_DOTS}`}
            </ThemedText>
          )}
        </View>
        <ThemedText type="smallBold">
          {events.length === 0
            ? t("home.header.empty")
            : t("home.header.count", { count: events.length })}
        </ThemedText>
      </View>
    </View>
  )
}

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string
  action: string
  onAction: () => void
}) {
  return (
    <View style={styles.sectionHeader}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action}
        onPress={onAction}
        style={styles.textAction}
      >
        <ThemedText type="smallBold" themeColor="primary">
          {action}
        </ThemedText>
      </Pressable>
    </View>
  )
}

function NextDayCard({
  day,
  count,
  firstStart,
  onPress,
}: {
  day: Date
  count: number
  firstStart: Date | undefined
  onPress: () => void
}) {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const locale = resolveLocale(i18n.language)
  const date = formatFullDay(day, locale)
  return (
    <Pressable
      testID="home-next-day"
      accessibilityRole="button"
      accessibilityLabel={t("home.nextDay.openLabel", { date })}
      onPress={onPress}
      android_ripple={{ color: theme.ripple, foreground: true }}
      style={({ pressed }) => [
        styles.nextDayCard,
        { backgroundColor: theme.backgroundElement },
        Platform.OS === "ios" && pressed && styles.iosPressed,
      ]}
    >
      <ThemedText type="smallBold">
        {t("home.nextDay.count", { date, count })}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {firstStart === undefined
          ? t("home.nextDay.allDay")
          : t("home.nextDay.first", { time: formatTime(firstStart, locale) })}
      </ThemedText>
    </Pressable>
  )
}

function AllDayEvents({
  events,
  onPressEvent,
}: {
  events: CalendarEvent[]
  onPressEvent: (event: CalendarEvent) => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  return (
    <View testID="home-all-day" style={styles.allDayRow}>
      <ThemedText
        type="small"
        themeColor="textSecondary"
        style={styles.allDayLabel}
        accessibilityRole="header"
      >
        {t("home.today.allDay")}
      </ThemedText>
      <View style={styles.allDayItems}>
        {events.map((event) => (
          <Pressable
            key={event.id}
            accessibilityRole="button"
            accessibilityLabel={t("home.event.openLabel", {
              title: event.title,
              time: t("home.today.allDay"),
              location: event.location ?? "",
            })}
            accessibilityHint={
              event.userCalendarId !== undefined
                ? t("home.event.hint.details")
                : t("home.event.hint.edit")
            }
            onPress={() => onPressEvent(event)}
            android_ripple={{ color: theme.ripple, foreground: true }}
            style={({ pressed }) => [
              styles.allDayEvent,
              {
                backgroundColor: eventSurfaceColor(event.color),
              },
              Platform.OS === "ios" && pressed && styles.iosPressed,
            ]}
          >
            <ThemedText type="smallBold" numberOfLines={2}>
              {event.title}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

function AddFab({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation()
  const theme = useTheme()
  return (
    <Pressable
      testID="home-add-personal-event"
      accessibilityRole="button"
      accessibilityLabel={t("home.addPersonalEvent")}
      onPress={onPress}
      android_ripple={{ color: theme.ripple, borderless: true, radius: 28 }}
      style={[styles.fab, { backgroundColor: theme.primary }]}
    >
      <SymbolView
        name={{ android: "add" }}
        size={26}
        tintColor={theme.background}
      />
    </Pressable>
  )
}

function captionText(
  caption: DayCaption,
  locale: "fr" | "en",
  t: ReturnType<typeof useTranslation>["t"],
): string {
  switch (caption.kind) {
    case "ongoing":
      return t("home.caption.ongoing", { end: formatTime(caption.end, locale) })
    case "singleFuture":
      return t("home.caption.singleFuture", {
        start: formatTime(caption.start, locale),
        end: formatTime(caption.end, locale),
      })
    case "futureSpan":
      return t("home.caption.futureSpan", {
        start: formatTime(caption.start, locale),
        end: formatTime(caption.end, locale),
      })
    default:
      return t(`home.caption.${caption.kind}`)
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: "row", justifyContent: "center" },
  safeArea: { flex: 1, maxWidth: MaxContentWidth },
  brandHeader: {
    minHeight: 56,
    paddingHorizontal: Spacing.four,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandLockup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  logo: { width: 30, height: 30 },
  appName: { fontSize: 21, lineHeight: 28, fontWeight: "700" },
  headerAction: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  androidContent: { paddingBottom: 96 },
  iosContent: { paddingBottom: 112 },
  hero: {
    padding: Spacing.four,
    borderRadius: Radii.large,
    gap: Spacing.two,
  },
  heroDate: { letterSpacing: 0.6 },
  heroGreeting: { fontSize: 30, lineHeight: 36, fontWeight: "700" },
  summaryRow: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  dots: { flexDirection: "row", alignItems: "center" },
  dot: {
    width: 12,
    height: 12,
    borderRadius: Radii.pill,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  extraDots: { marginLeft: Spacing.one },
  sectionHeader: {
    minHeight: Platform.OS === "android" ? 48 : 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  section: { gap: Spacing.one },
  sectionTitle: { fontSize: 20, lineHeight: 25, fontWeight: "700" },
  textAction: {
    minWidth: Platform.OS === "android" ? 48 : 44,
    minHeight: Platform.OS === "android" ? 48 : 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  nextDayCard: {
    minHeight: 72,
    padding: Spacing.three,
    borderRadius: Radii.large,
    gap: Spacing.one,
  },
  allDayRow: { gap: Spacing.two },
  allDayLabel: { paddingTop: Spacing.one },
  allDayItems: { flex: 1, gap: Spacing.two },
  allDayEvent: {
    minHeight: Platform.OS === "android" ? 48 : 44,
    padding: Spacing.two,
    borderRadius: Radii.large,
    justifyContent: "center",
    overflow: "hidden",
  },
  iosPressed: { opacity: 0.62 },
  fab: {
    position: "absolute",
    right: Spacing.three,
    bottom: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    overflow: "hidden",
  },
  syncError: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  syncErrorText: { flex: 1 },
  retryButton: {
    minHeight: Platform.OS === "android" ? 48 : 44,
    paddingHorizontal: Spacing.three,
    justifyContent: "center",
    borderRadius: Radii.medium,
  },
})
