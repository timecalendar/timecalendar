import { Stack } from "expo-router"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { RefreshControl, SectionList, StyleSheet, View } from "react-native"

import {
  developerActivityArtwork,
  ErrorNotice,
  headerScrollProps,
  joinRowName,
  ListRow,
  type ListRowPosition,
  listRowPosition,
  ListSectionHeader,
  RootPage,
  StatusView,
} from "@/design"
import {
  loadOlderPage,
  markActivityReadFromCache,
  useActivityLogs,
  useActivityScreenRefresh,
  useActivityState,
} from "@/features/activity/data"
import {
  formatEventDateRange,
  formatFullDateTime,
  resolveLocale,
} from "@/features/calendar/data"
import { useDisplayZone } from "@/features/settings/prefs"
import { Spacing, useTheme } from "@/theme"

import {
  type ActivityItem,
  type ActivitySection,
  buildActivitySections,
} from "./activity-items"
import { describeChangedItem, parseRange } from "./describe-change"

export function ActivityScreen() {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const locale = resolveLocale(i18n.language)
  const displayZone = useDisplayZone()
  const { logs, loaded } = useActivityLogs()
  const { unreadCount, olderPageComplete } = useActivityState()
  const {
    outcome: refreshOutcome,
    isRefreshing: refreshing,
    refresh,
  } = useActivityScreenRefresh()
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [olderFailed, setOlderFailed] = useState(false)
  const olderInFlight = useRef(false)
  const markedOnMount = useRef(false)

  const sections = useMemo(() => buildActivitySections(logs), [logs])
  const hasItems = loaded && sections.length > 0
  const refreshFailed =
    refreshOutcome?.status === "failed" ||
    refreshOutcome?.status === "too-many-calendars"

  useEffect(() => {
    if (markedOnMount.current && unreadCount === 0) return
    markedOnMount.current = true
    // `markActivityRead(asOf)` is deliberately not called here and is not dead
    // code: Ticket 6 first owns a visible refresh's server-issued `asOf` (D2).
    void markActivityReadFromCache()
  }, [unreadCount])

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
    <>
      <Stack.Screen options={{ title: t("activity.title") }} />
      <RootPage
        scrollsUnderHeader={hasItems}
        testID="activity-layout-owner"
        lane="standard"
      >
        {({ laneStyle }) =>
          !loaded ? (
            <View style={[laneStyle, styles.stateLane]}>
              <StatusView
                kind="loading"
                presentation="screen"
                testID="activity-loading"
                title={t("activity.loading")}
              />
            </View>
          ) : sections.length === 0 && refreshFailed ? (
            <View style={[laneStyle, styles.stateLane]}>
              <StatusView
                kind="error"
                presentation="screen"
                testID="activity-empty-error"
                title={t("errors.loadTitle")}
                caption={t("activity.error.empty")}
                action={{
                  label: t("activity.retry"),
                  accessibilityLabel: t("activity.retry.accessibilityLabel"),
                  onPress: refresh,
                  testID: "activity-empty-retry",
                  busy: refreshing,
                }}
              />
            </View>
          ) : (
            <SectionList<ActivityItem, ActivitySection>
              testID="activity-section-list"
              {...headerScrollProps(hasItems)}
              sections={sections}
              keyExtractor={(item) => item.key}
              stickySectionHeadersEnabled={false}
              refreshControl={refreshControl}
              onEndReached={loadOlder}
              ListHeaderComponent={
                refreshFailed ? (
                  <ErrorNotice
                    compact
                    style={styles.noticeGap}
                    testID="activity-cached-error"
                    message={t("activity.error.cached")}
                    action={{
                      label: t("activity.retry"),
                      accessibilityLabel: t(
                        "activity.retry.accessibilityLabel",
                      ),
                      onPress: refresh,
                      testID: "activity-refresh-retry",
                      busy: refreshing,
                    }}
                  />
                ) : null
              }
              ListEmptyComponent={
                <StatusView
                  kind="empty"
                  testID="activity-empty"
                  presentation="section"
                  title={t("activity.empty.title")}
                  caption={t("activity.empty.caption")}
                  artwork={developerActivityArtwork}
                />
              }
              ListFooterComponent={
                <OlderFooter
                  loading={loadingOlder}
                  failed={olderFailed}
                  onRetry={loadOlder}
                />
              }
              contentContainerStyle={[laneStyle, styles.content]}
              renderSectionHeader={({ section }) => {
                const time = formatFullDateTime(
                  section.log.createdAt,
                  locale,
                  displayZone,
                )
                return (
                  <ListSectionHeader
                    title={section.log.calendarName}
                    detail={time}
                    accessibilityLabel={t("activity.group.accessibilityLabel", {
                      calendar: section.log.calendarName,
                      time,
                    })}
                    style={
                      section === sections[0] ? undefined : styles.sectionGap
                    }
                  />
                )
              }}
              renderItem={({ item, index, section }) => (
                <ActivityItemRow
                  item={item}
                  position={listRowPosition(index, section.data.length)}
                  formatTime={(start, end) =>
                    formatEventDateRange(start, end, locale, false, displayZone)
                  }
                />
              )}
            />
          )
        }
      </RootPage>
    </>
  )
}

const OVERLINE_TONE = {
  new: "positive",
  changed: "informational",
  cancelled: "destructive",
} as const

function ActivityItemRow({
  item,
  position,
  formatTime,
}: {
  item: ActivityItem
  position: ListRowPosition
  formatTime: (start: Date, end: Date) => string
}) {
  const { t } = useTranslation()
  const event = item.kind === "changed" ? item.change.newItem : item.event
  const range = parseRange(event)
  const time = range === null ? undefined : formatTime(...range)
  const changes =
    item.kind === "changed"
      ? describeChangedItem(
          item.change.previousItem,
          item.change.newItem,
          formatTime,
        ).map((difference) => {
          const values = {
            field: t(`activity.change.field.${difference.field}`),
            from: difference.from,
            to: difference.to,
          }
          return {
            line: t("activity.change.line", values),
            spoken: t("activity.change.spoken", values),
          }
        })
      : []
  const row = {
    label: event.title,
    subtitle: time,
    details: changes.map((change) => change.line),
    overline: {
      text: t(`activity.kind.${item.kind}`),
      tone: OVERLINE_TONE[item.kind],
    },
    position,
    accessibilityLabel: joinRowName([
      t(`activity.item.${item.kind}.accessibilityLabel`, {
        title: event.title,
      }),
      time,
      ...changes.map((change) => change.spoken),
    ]),
    testID: `activity-${item.kind}-${event.uid}`,
  }

  if (item.kind === "cancelled") return <ListRow {...row} />
  return (
    <ListRow
      {...row}
      href={`/event-details/${event.uid}`}
      hint={t("activity.item.hint")}
    />
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
  if (loading) {
    return (
      <StatusView
        kind="loading"
        presentation="inline"
        testID="activity-older-loading"
        title={t("activity.older.loading")}
        style={styles.footer}
      />
    )
  }
  if (!failed) return null
  return (
    <ErrorNotice
      compact
      style={styles.footer}
      testID="activity-older-error"
      message={t("activity.older.error")}
      action={{
        label: t("activity.older.retry"),
        accessibilityLabel: t("activity.older.retry.accessibilityLabel"),
        onPress: onRetry,
        testID: "activity-older-retry",
      }}
    />
  )
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
  },
  stateLane: { flex: 1, paddingTop: Spacing.four },
  sectionGap: { marginTop: Spacing.four },
  noticeGap: { marginBottom: Spacing.four },
  footer: { marginVertical: Spacing.four },
})
