import { router, Stack } from "expo-router"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import {
  loadOlderPage,
  markActivityReadFromCache,
  refreshNewestPage,
  useActivityLogs,
  useActivityState,
} from "@/features/activity/data"
import {
  formatEventDateRange,
  formatFullDateTime,
  resolveLocale,
} from "@/features/calendar/data"
import { useDisplayZone } from "@/features/settings/prefs"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

import {
  type ActivityItem,
  type ActivitySection,
  buildActivitySections,
} from "./activity-items"
import { describeChangedItem } from "./describe-change"

export function ActivityScreen() {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const locale = resolveLocale(i18n.language)
  const displayZone = useDisplayZone()
  const { logs, loaded } = useActivityLogs()
  const { unreadCount, olderPageComplete } = useActivityState()
  const [refreshing, setRefreshing] = useState(false)
  const [refreshFailed, setRefreshFailed] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [olderFailed, setOlderFailed] = useState(false)
  const olderInFlight = useRef(false)
  const markedOnMount = useRef(false)

  const sections = useMemo(() => buildActivitySections(logs), [logs])

  useEffect(() => {
    if (markedOnMount.current && unreadCount === 0) return
    markedOnMount.current = true
    // `markActivityRead(asOf)` is deliberately not called here and is not dead
    // code: Ticket 6 first owns a visible refresh's server-issued `asOf` (D2).
    void markActivityReadFromCache()
  }, [unreadCount])

  const refresh = useCallback(async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      const outcome = await refreshNewestPage({ force: true })
      setRefreshFailed(
        outcome.status === "failed" || outcome.status === "too-many-calendars",
      )
    } finally {
      setRefreshing(false)
    }
  }, [refreshing])

  const loadOlder = useCallback(async () => {
    if (olderPageComplete || olderInFlight.current || sections.length === 0) {
      return
    }
    olderInFlight.current = true
    setLoadingOlder(true)
    try {
      const outcome = await loadOlderPage()
      setOlderFailed(
        outcome.status === "failed" ||
          outcome.status === "no-calendars" ||
          outcome.status === "too-many-calendars",
      )
    } finally {
      olderInFlight.current = false
      setLoadingOlder(false)
    }
  }, [olderPageComplete, sections.length])

  const empty = sections.length === 0
  const refreshControl = (
    <RefreshControl
      testID="activity-refresh-control"
      refreshing={refreshing}
      onRefresh={refresh}
      tintColor={theme.primary}
      colors={[theme.primary]}
      accessibilityLabel={t("activity.refresh.accessibilityLabel")}
    />
  )

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: t("activity.title") }} />
      <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
        {!loaded ? (
          <View style={styles.centered} testID="activity-loading">
            <ActivityIndicator
              color={theme.primary}
              accessibilityLabel={t("activity.loading")}
            />
          </View>
        ) : empty && refreshFailed ? (
          <FullError onRetry={refresh} />
        ) : (
          <SectionList<ActivityItem, ActivitySection>
            testID="activity-section-list"
            sections={sections}
            keyExtractor={(item) => item.key}
            stickySectionHeadersEnabled={false}
            refreshControl={refreshControl}
            onEndReached={loadOlder}
            ListHeaderComponent={
              refreshFailed ? <CachedError onRetry={refresh} /> : null
            }
            ListEmptyComponent={<EmptyState />}
            ListFooterComponent={
              <OlderFooter
                loading={loadingOlder}
                failed={olderFailed}
                onRetry={loadOlder}
              />
            }
            contentContainerStyle={styles.content}
            renderSectionHeader={({ section }) => (
              <ActivityGroupHeader
                section={section}
                time={formatFullDateTime(
                  section.log.createdAt,
                  locale,
                  displayZone,
                )}
              />
            )}
            renderItem={({ item }) => (
              <ActivityItemRow
                item={item}
                formatTime={(start, end) =>
                  formatEventDateRange(start, end, locale, false, displayZone)
                }
              />
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  )
}

function ActivityGroupHeader({
  section,
  time,
}: {
  section: ActivitySection
  time: string
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  return (
    <View
      accessibilityRole="header"
      accessibilityLabel={t("activity.group.accessibilityLabel", {
        calendar: section.log.calendarName,
        time,
      })}
      style={[styles.groupHeader, { backgroundColor: theme.background }]}
    >
      <ThemedText type="subtitle">{section.log.calendarName}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {time}
      </ThemedText>
    </View>
  )
}

function validRange(startsAt: string, endsAt: string): [Date, Date] | null {
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  return Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
    ? null
    : [start, end]
}

function ActivityItemRow({
  item,
  formatTime,
}: {
  item: ActivityItem
  formatTime: (start: Date, end: Date) => string
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const event = item.kind === "changed" ? item.change.newItem : item.event
  const range = validRange(event.startsAt, event.endsAt)
  const time = range === null ? null : formatTime(...range)
  const kindColor =
    item.kind === "new"
      ? theme.positive
      : item.kind === "changed"
        ? theme.informational
        : theme.destructive
  const content = (
    <>
      <ThemedText type="smallBold" style={{ color: kindColor }}>
        {t(`activity.kind.${item.kind}`)}
      </ThemedText>
      <ThemedText>{event.title}</ThemedText>
      {time !== null ? (
        <ThemedText type="small" themeColor="textSecondary">
          {time}
        </ThemedText>
      ) : null}
      {item.kind === "changed"
        ? describeChangedItem(
            item.change.previousItem,
            item.change.newItem,
            formatTime,
          ).map((difference) => (
            <ThemedText
              key={difference.field}
              type="small"
              themeColor="textSecondary"
              accessibilityLabel={t("activity.change.spoken", {
                field: t(`activity.change.field.${difference.field}`),
                from: difference.from,
                to: difference.to,
              })}
            >
              {t("activity.change.line", {
                field: t(`activity.change.field.${difference.field}`),
                from: difference.from,
                to: difference.to,
              })}
            </ThemedText>
          ))
        : null}
    </>
  )
  const rowStyle = [styles.item, { backgroundColor: theme.backgroundElement }]

  if (item.kind === "cancelled") {
    return (
      <View testID={`activity-cancelled-${event.uid}`} style={rowStyle}>
        {content}
      </View>
    )
  }

  return (
    <Pressable
      testID={`activity-${item.kind}-${event.uid}`}
      accessibilityRole="button"
      accessibilityLabel={t(`activity.item.${item.kind}.accessibilityLabel`, {
        title: event.title,
      })}
      onPress={() => router.push(`/event-details/${event.uid}`)}
      style={rowStyle}
    >
      {content}
    </Pressable>
  )
}

function EmptyState() {
  const { t } = useTranslation()
  return (
    <ThemedText
      testID="activity-empty"
      themeColor="textSecondary"
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
      style={styles.centeredText}
    >
      {t("activity.empty")}
    </ThemedText>
  )
}

function RetryButton({
  label,
  accessibilityLabel,
  onPress,
  testID,
}: {
  label: string
  accessibilityLabel: string
  onPress: () => void
  testID: string
}) {
  const theme = useTheme()
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[styles.retry, { backgroundColor: theme.backgroundElement }]}
    >
      <ThemedText type="smallBold">{label}</ThemedText>
    </Pressable>
  )
}

function CachedError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <View style={styles.compactError} testID="activity-cached-error">
      <ThemedText
        type="small"
        themeColor="textSecondary"
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={styles.errorText}
      >
        {t("activity.error.cached")}
      </ThemedText>
      <RetryButton
        label={t("activity.retry")}
        accessibilityLabel={t("activity.retry.accessibilityLabel")}
        onPress={onRetry}
        testID="activity-refresh-retry"
      />
    </View>
  )
}

function FullError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <View style={styles.centered} testID="activity-empty-error">
      <ThemedText
        themeColor="textSecondary"
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={styles.centeredText}
      >
        {t("activity.error.empty")}
      </ThemedText>
      <RetryButton
        label={t("activity.retry")}
        accessibilityLabel={t("activity.retry.accessibilityLabel")}
        onPress={onRetry}
        testID="activity-empty-retry"
      />
    </View>
  )
}

function OlderFooter({
  loading,
  failed,
  onRetry,
}: {
  loading: boolean
  failed: boolean
  onRetry: () => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  if (loading) {
    return (
      <ActivityIndicator
        testID="activity-older-loading"
        color={theme.primary}
        accessibilityLabel={t("activity.older.loading")}
        style={styles.footer}
      />
    )
  }
  if (!failed) return null
  return (
    <View style={styles.footer} testID="activity-older-error">
      <ThemedText
        type="small"
        themeColor="textSecondary"
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={styles.centeredText}
      >
        {t("activity.older.error")}
      </ThemedText>
      <RetryButton
        label={t("activity.older.retry")}
        accessibilityLabel={t("activity.older.retry.accessibilityLabel")}
        onPress={onRetry}
        testID="activity-older-retry"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: "row", justifyContent: "center" },
  safeArea: { flex: 1, maxWidth: MaxContentWidth },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.four,
  },
  centeredText: { textAlign: "center" },
  groupHeader: { paddingTop: Spacing.four, gap: Spacing.half },
  item: {
    minHeight: 48,
    padding: Spacing.three,
    borderRadius: Radii.medium,
    gap: Spacing.one,
  },
  compactError: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  errorText: { flex: 1 },
  retry: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: Spacing.three,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Radii.medium,
  },
  footer: {
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
})
