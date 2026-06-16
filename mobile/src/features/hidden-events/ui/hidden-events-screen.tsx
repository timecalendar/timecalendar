import { Stack } from "expo-router"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, ScrollView, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import {
  formatTimeRange,
  resolveLocale,
  useSyncedEvents,
} from "@/features/calendar/data"
import { useHiddenEvents, useHideActions } from "@/features/hidden-events/data"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

// The hidden-events management screen (D7) — PRESENTATIONAL (70% floor). Hide-by-
// name has no per-event details surface, so un-hide MUST be reachable here. It
// reads the hidden set + the synced events (the sibling calendar data sub-barrel,
// to resolve each uid → its current title/time, Flutter `_buildDisplayItems`) and
// renders a name-hidden section + a uid-hidden section (only uids that STILL
// resolve to a synced event — Flutter parity, so a stale uid is not orphaned in
// the list), each with an accessible un-hide control, plus an empty state. The
// write goes through useHideActions() (the observability-wrapped seam). Themed
// from @/theme (R-3). The route (src/app/hidden-events.tsx) is a thin re-export.

interface UidEntry {
  uid: string
  title: string
  time: string
}

export function HiddenEventsScreen() {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const locale = resolveLocale(i18n.language)
  const { uidHiddenEvents, namedHiddenEvents } = useHiddenEvents()
  const { unhideUid, unhideName, failed } = useHideActions()
  const syncedEvents = useSyncedEvents()

  // Resolve each hidden uid to its current synced event (title + time). Only
  // still-resolving uids are listed (Flutter parity — a uid with no current event
  // is not shown, though the blob retains it for the importer round-trip).
  const uidEntries = useMemo<UidEntry[]>(() => {
    return uidHiddenEvents.flatMap((uid) => {
      const event = syncedEvents.find((e) => e.id === uid)
      if (event === undefined) return []
      return [
        {
          uid,
          title: event.title,
          time: formatTimeRange(event.startsAt, event.endsAt, locale),
        },
      ]
    })
  }, [uidHiddenEvents, syncedEvents, locale])

  const isEmpty = namedHiddenEvents.length === 0 && uidEntries.length === 0

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: t("hiddenEvents.title") }} />
      <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
        {failed && (
          <ThemedText
            themeColor="textSecondary"
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={styles.error}
          >
            {t("hiddenEvents.error")}
          </ThemedText>
        )}

        {isEmpty ? (
          <ThemedText
            themeColor="textSecondary"
            accessibilityLiveRegion="polite"
            accessibilityRole="text"
          >
            {t("hiddenEvents.empty")}
          </ThemedText>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            {namedHiddenEvents.length > 0 && (
              <View style={styles.section}>
                <ThemedText type="subtitle">
                  {t("hiddenEvents.namedSection")}
                </ThemedText>
                {namedHiddenEvents.map((name) => (
                  <HiddenRow
                    key={`name-${name}`}
                    title={name}
                    unhideLabel={t("hiddenEvents.unhideLabel", { title: name })}
                    onUnhide={() => unhideName(name)}
                    background={theme.backgroundElement}
                  />
                ))}
              </View>
            )}

            {uidEntries.length > 0 && (
              <View style={styles.section}>
                <ThemedText type="subtitle">
                  {t("hiddenEvents.uidSection")}
                </ThemedText>
                {uidEntries.map((entry) => (
                  <HiddenRow
                    key={`uid-${entry.uid}`}
                    title={entry.title}
                    subtitle={entry.time}
                    unhideLabel={t("hiddenEvents.unhideLabel", {
                      title: entry.title,
                    })}
                    onUnhide={() => unhideUid(entry.uid)}
                    background={theme.backgroundElement}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  )
}

function HiddenRow({
  title,
  subtitle,
  unhideLabel,
  onUnhide,
  background,
}: {
  title: string
  subtitle?: string
  unhideLabel: string
  onUnhide: () => void
  background: string
}) {
  const { t } = useTranslation()
  return (
    <View style={[styles.row, { backgroundColor: background }]}>
      <View style={styles.rowText}>
        <ThemedText>{title}</ThemedText>
        {subtitle !== undefined && (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={unhideLabel}
        hitSlop={Spacing.two}
        onPress={onUnhide}
        style={styles.unhide}
      >
        <ThemedText type="smallBold" themeColor="primary">
          {t("hiddenEvents.unhide")}
        </ThemedText>
      </Pressable>
    </View>
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  content: {
    gap: Spacing.four,
    paddingBottom: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  error: {
    marginBottom: Spacing.three,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.three,
    borderRadius: Radii.medium,
    gap: Spacing.three,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
  unhide: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "flex-end",
  },
})
