import { Stack, useRouter } from "expo-router"
import { SymbolView } from "expo-symbols"
import { useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import {
  AccessibilityInfo,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native"
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { WriteErrorNotice } from "@/components/write-error-notice"
import {
  type UserCalendar,
  useUserCalendarActions,
  useUserCalendars,
} from "@/features/calendar-sources/data"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

// The user-calendars management screen ("Mes calendriers") — PRESENTATIONAL (70%
// floor) over the existing durable token store (ADR 018). It lists every held
// calendar with a visibility checkbox (a render-only flag filtered at the events-
// source seam — ADR 031), a confirm-gated delete (a visible button on both
// platforms + an iOS swipe, no undo), and an add affordance routing to school
// selection. Writes go through useUserCalendarActions() (the observability-wrapped
// seam); failures surface via WriteErrorNotice. Themed from @/theme (R-3). The
// route (src/app/user-calendars.tsx) is a thin re-export.

export function UserCalendarsScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const router = useRouter()
  const calendars = useUserCalendars()
  const { setVisible, remove, failed } = useUserCalendarActions()

  // The one shared delete path (button, iOS swipe, and accessibility action all
  // reach it — Decision 3). A native Alert confirm (R-3, no undo); the success
  // announce is gated on the resolved write so a failed delete keeps the screen
  // and its accessible failure banner mounted.
  const confirmDelete = useCallback(
    (id: string, name: string) => {
      Alert.alert(
        t("userCalendars.delete.title"),
        t("userCalendars.delete.message", { name }),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("userCalendars.delete.confirm"),
            style: "destructive",
            onPress: async () => {
              if (await remove(id)) {
                AccessibilityInfo.announceForAccessibility(
                  t("userCalendars.deleted", { name }),
                )
              }
            },
          },
        ],
      )
    },
    [remove, t],
  )

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: t("userCalendars.title") }} />
      <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
        {failed && (
          <WriteErrorNotice
            message={t("userCalendars.error")}
            style={styles.error}
          />
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("userCalendars.add")}
          hitSlop={Spacing.two}
          onPress={() => router.push("/onboarding/school")}
          style={[styles.addButton, { borderColor: theme.primary }]}
        >
          <ThemedText type="smallBold" themeColor="primary">
            {t("userCalendars.add")}
          </ThemedText>
        </Pressable>

        {calendars.length === 0 ? (
          <ThemedText
            themeColor="textSecondary"
            accessibilityLiveRegion="polite"
            accessibilityRole="text"
          >
            {t("userCalendars.empty")}
          </ThemedText>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            {calendars.map((calendar) => (
              <CalendarRow
                key={calendar.id}
                calendar={calendar}
                onToggle={() => setVisible(calendar.id, !calendar.visible)}
                onDelete={confirmDelete}
                background={theme.backgroundElement}
              />
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  )
}

function CalendarRow({
  calendar,
  onToggle,
  onDelete,
  background,
}: {
  calendar: UserCalendar
  onToggle: () => void
  onDelete: (id: string, name: string) => void
  background: string
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const swipeableRef = useRef<SwipeableMethods>(null)

  const name = calendar.name || t("userCalendars.namePlaceholder")
  const school = calendar.schoolName ?? t("userCalendars.personalSubtitle")
  const deleteLabel = t("userCalendars.delete.label", { name })

  const requestDelete = useCallback(() => {
    swipeableRef.current?.close()
    onDelete(calendar.id, name)
  }, [onDelete, calendar.id, name])

  const row = (
    <View
      testID={`user-calendar-row-${calendar.id}`}
      style={[styles.row, { backgroundColor: background }]}
      accessibilityActions={[{ name: "delete", label: deleteLabel }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "delete") requestDelete()
      }}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: calendar.visible }}
        accessibilityLabel={`${name}, ${school}`}
        hitSlop={Spacing.two}
        onPress={onToggle}
        style={[
          styles.checkbox,
          {
            borderColor: theme.primary,
            backgroundColor: calendar.visible ? theme.primary : "transparent",
          },
        ]}
      >
        {/* The filled primary box IS the checked indicator (no glyph — the app
            wires no icon font, R-3); accessibilityState.checked carries it to AT. */}
        {calendar.visible && (
          <View
            style={[styles.checkDot, { backgroundColor: theme.background }]}
          />
        )}
      </Pressable>

      <View style={styles.rowText}>
        <ThemedText>{name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {school}
        </ThemedText>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={deleteLabel}
        hitSlop={Spacing.two}
        onPress={requestDelete}
        style={styles.delete}
      >
        <TrashAffordance tint={theme.primary} />
      </Pressable>
    </View>
  )

  // iOS-only swipe-to-delete on top of the visible button (Decision 3): a full
  // swipe opens the same confirm (never an instant commit — delete is
  // non-undoable). Android renders the bare row (Material's destructive swipe
  // wants a real undo, which remove() can't give). The pan is device-verified
  // only — jest-expo cannot simulate it, so it must not gate coverage.
  if (Platform.OS !== "ios") return row
  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={2}
      rightThreshold={40}
      onSwipeableWillOpen={requestDelete}
      renderRightActions={() => (
        <View style={[styles.swipeAction, { backgroundColor: theme.primary }]}>
          <SymbolView name="trash" size={22} tintColor={theme.onPrimary} />
        </View>
      )}
    >
      {row}
    </ReanimatedSwipeable>
  )
}

// The trailing trash affordance (Decision 6) — cross-platform: expo-symbols
// SymbolView renders only on iOS (mirroring school-selection/status-symbol), so
// Android falls back to a themed destructive text label (no new dep, no blank
// button). The accessible name lives on the parent Pressable.
function TrashAffordance({ tint }: { tint: string }) {
  const { t } = useTranslation()
  if (Platform.OS === "ios") {
    return <SymbolView name="trash" size={22} tintColor={tint} />
  }
  return (
    <ThemedText type="smallBold" themeColor="primary">
      {t("userCalendars.delete.confirm")}
    </ThemedText>
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
    gap: Spacing.three,
  },
  content: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  error: {
    marginBottom: Spacing.one,
  },
  addButton: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Radii.medium,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.three,
    borderRadius: Radii.medium,
    gap: Spacing.three,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderRadius: Radii.small,
    alignItems: "center",
    justifyContent: "center",
  },
  checkDot: {
    width: 12,
    height: 12,
    borderRadius: Radii.small,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
  delete: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  swipeAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 72,
    borderRadius: Radii.medium,
  },
})
