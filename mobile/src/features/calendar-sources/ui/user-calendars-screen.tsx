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
  useUserCalendarsLoaded,
} from "@/features/calendar-sources/data"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

// The user-calendars management screen ("Mes calendriers") — PRESENTATIONAL (70%
// floor) over the existing durable token store (ADR 018). It lists every held
// calendar with a row-level visibility toggle (a render-only flag filtered at the
// events-source seam — ADR 031), a confirm-gated delete (a visible button on both
// platforms + an iOS swipe, no undo), and a native header add action routing to
// school selection. Writes go through useUserCalendarActions() (the observability-
// wrapped seam); failures surface via WriteErrorNotice. Themed from @/theme (R-3).
// The route (src/app/user-calendars.tsx) is a thin re-export.

// Android checked-state glyph (iOS uses an SF Symbol) — a decorative mark, not
// copy, so it stays out of the i18n catalog.
const CHECKMARK = "✓"

export function UserCalendarsScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const router = useRouter()
  const calendars = useUserCalendars()
  const loaded = useUserCalendarsLoaded()
  const { setVisible, remove, failed } = useUserCalendarActions()

  // The one shared delete path (button, iOS swipe, and accessibility action all
  // reach it). A native Alert confirm (R-3, no undo); the success announce is
  // gated on the resolved write so a failed delete keeps the screen and its
  // accessible failure banner mounted.
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
      <Stack.Screen
        options={{
          title: t("userCalendars.title"),
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("userCalendars.add")}
              hitSlop={Spacing.two}
              onPress={() => router.push("/onboarding/school")}
              android_ripple={{ color: theme.ripple, foreground: true }}
              style={({ pressed }) => [
                styles.headerAdd,
                Platform.OS === "ios" &&
                  pressed && { backgroundColor: theme.backgroundSelected },
              ]}
            >
              <ThemedText type="smallBold" themeColor="primary">
                {t("userCalendars.add.short")}
              </ThemedText>
            </Pressable>
          ),
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
        {failed && (
          <WriteErrorNotice
            message={t("userCalendars.error")}
            style={styles.error}
          />
        )}

        {/* Gate the empty state on the read resolving: useLiveQuery starts empty
            and settles async, so rendering it before `loaded` would flash and
            false-announce "no calendars" on entry. */}
        {!loaded ? null : calendars.length === 0 ? (
          <View style={styles.empty}>
            <ThemedText type="subtitle">
              {t("userCalendars.emptyTitle")}
            </ThemedText>
            <ThemedText
              themeColor="textSecondary"
              accessibilityLiveRegion="polite"
              accessibilityRole="text"
            >
              {t("userCalendars.empty")}
            </ThemedText>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            {calendars.map((calendar) => (
              <CalendarRow
                key={calendar.id}
                calendar={calendar}
                onToggle={() => setVisible(calendar.id, !calendar.visible)}
                onDelete={confirmDelete}
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
}: {
  calendar: UserCalendar
  onToggle: () => void
  onDelete: (id: string, name: string) => void
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
    <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      {/* The row-level toggle IS the accessibility element (a real one, unlike a
          plain View): it carries the checkbox role/state, the merged name+school
          label, and the delete custom action, so both stay reachable to AT. The
          delete is a sibling Pressable (never nested — no-nested-touchables). */}
      <Pressable
        testID={`user-calendar-row-${calendar.id}`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: calendar.visible }}
        accessibilityLabel={t("userCalendars.rowLabel", { name, school })}
        accessibilityHint={t("userCalendars.visibilityHint")}
        accessibilityActions={[
          { name: "delete", label: t("userCalendars.delete.action") },
        ]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "delete") requestDelete()
        }}
        onPress={onToggle}
        android_ripple={{ color: theme.ripple, foreground: true }}
        style={({ pressed }) => [
          styles.toggle,
          Platform.OS === "ios" &&
            pressed && { backgroundColor: theme.backgroundSelected },
        ]}
      >
        <View
          style={[
            styles.checkbox,
            {
              borderColor: theme.primary,
              backgroundColor: calendar.visible
                ? theme.primaryStrong
                : "transparent",
            },
          ]}
        >
          {calendar.visible &&
            (Platform.OS === "ios" ? (
              <SymbolView
                name="checkmark"
                size={16}
                tintColor={theme.onPrimary}
              />
            ) : (
              <ThemedText type="smallBold" themeColor="onPrimary">
                {CHECKMARK}
              </ThemedText>
            ))}
        </View>

        {/* The label already carries name+school; hide the text from AT so the
            name is not spoken three times per row. */}
        <View
          style={styles.rowText}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <ThemedText style={styles.rowName}>{name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {school}
          </ThemedText>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={deleteLabel}
        hitSlop={Spacing.two}
        onPress={requestDelete}
        android_ripple={{ color: theme.ripple, foreground: true }}
        style={({ pressed }) => [
          styles.delete,
          Platform.OS === "ios" &&
            pressed && { backgroundColor: theme.backgroundSelected },
        ]}
      >
        <TrashAffordance tint={theme.primary} />
      </Pressable>
    </View>
  )

  // iOS-only swipe-to-delete on top of the visible button: a full swipe opens the
  // same confirm (never an instant commit — delete is non-undoable). Android
  // renders the bare row (Material's destructive swipe wants a real undo, which
  // remove() can't give). The pan is device-verified only — jest-expo cannot
  // simulate it, so it must not gate coverage.
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

// The trailing trash affordance — cross-platform: expo-symbols SymbolView renders
// only on iOS (mirroring school-selection/status-symbol), so Android falls back
// to a themed destructive text label (no new dep, no blank button). The accessible
// name lives on the parent Pressable.
function TrashAffordance({ tint }: { tint: string }) {
  const { t } = useTranslation()
  if (Platform.OS === "ios") {
    return <SymbolView name="trash" size={22} tintColor={tint} />
  }
  return (
    <ThemedText type="smallBold" themeColor="primary">
      {t("userCalendars.delete.action")}
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
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.one,
  },
  headerAdd: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: Spacing.two,
    borderRadius: Radii.medium,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radii.medium,
    overflow: "hidden",
  },
  toggle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.three,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderRadius: Radii.small,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
  rowName: {
    // Platform body: iOS 17pt / Android 16sp regular (ThemedText default reads as emphasis).
    ...Platform.select({
      ios: { fontSize: 17, lineHeight: 22, fontWeight: "400" as const },
      default: { fontWeight: "400" as const },
    }),
  },
  delete: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: Spacing.three,
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
