import { Stack, useRouter } from "expo-router"
import { SymbolView } from "expo-symbols"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  type AccessibilityActionEvent,
  AccessibilityInfo,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  useWindowDimensions,
  View,
} from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"

import { type MenuComponentRef, MenuView } from "@/components/chrome"
import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { WriteErrorNotice } from "@/components/write-error-notice"
import {
  effectiveCalendarName,
  type UserCalendar,
  useUserCalendarActions,
  useUserCalendars,
  useUserCalendarsLoaded,
} from "@/features/calendar-sources/data"
import { RenameCalendarDialog } from "@/features/calendar-sources/ui/rename-calendar-dialog"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

// The user-calendars management screen ("Mes calendriers") — PRESENTATIONAL (70%
// floor) over the existing durable token store (ADR 018). It lists every held
// calendar with an explicit visibility switch (a render-only flag filtered at the
// events-source seam — ADR 031), one overflow menu carrying Rename and a
// confirm-gated Delete, and a platform-native add action routing to school
// selection. Delete goes through useUserCalendarActions() (the observability-
// wrapped seam); failures surface via WriteErrorNotice. Rename goes through the
// dialog's own useRenameCalendar seam, since it is a server write first and a
// local write only on success. Themed from @/theme (R-3). The route
// (src/app/user-calendars.tsx) is a thin re-export.

export function UserCalendarsScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const calendars = useUserCalendars()
  const loaded = useUserCalendarsLoaded()
  const { setVisible, remove, failed } = useUserCalendarActions()
  // The dialog is MOUNTED only while a rename is open, so its controlled input is
  // seeded once per open by its own mount (design D4) with no reset effect.
  const [renameTarget, setRenameTarget] = useState<UserCalendar | null>(null)

  // A native Alert confirms the non-undoable delete. The success announce is
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
          headerBackButtonDisplayMode: "generic",
          ...(Platform.OS === "ios" && {
            unstable_headerRightItems: () => [
              {
                type: "button" as const,
                label: t("userCalendars.add"),
                accessibilityLabel: t("userCalendars.add"),
                icon: { type: "sfSymbol" as const, name: "plus" as const },
                tintColor: theme.text,
                identifier: "user-calendars-add",
                onPress: () =>
                  router.push({
                    pathname: "/onboarding/school",
                    params: { source: "calendar-management" },
                  }),
              },
            ],
          }),
        }}
      />
      <SafeAreaView
        testID="user-calendars-safe-area"
        style={[
          styles.safeArea,
          {
            paddingLeft: Math.max(insets.left, Spacing.three),
            paddingRight: Math.max(insets.right, Spacing.three),
          },
        ]}
        edges={["bottom"]}
      >
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
          <ScrollView
            contentContainerStyle={[
              styles.content,
              Platform.OS === "android" && styles.contentWithFab,
            ]}
          >
            <ThemedText themeColor="textSecondary" style={styles.intro}>
              {t("userCalendars.visibilityDescription")}
            </ThemedText>
            {calendars.map((calendar) => (
              <CalendarRow
                key={calendar.id}
                calendar={calendar}
                onToggle={(visible) => setVisible(calendar.id, visible)}
                onDelete={confirmDelete}
                onRename={setRenameTarget}
              />
            ))}
          </ScrollView>
        )}
        {Platform.OS === "android" && (
          <Pressable
            testID="user-calendars-add"
            accessibilityRole="button"
            accessibilityLabel={t("userCalendars.add")}
            onPress={() =>
              router.push({
                pathname: "/onboarding/school",
                params: { source: "calendar-management" },
              })
            }
            android_ripple={{
              color: theme.ripple,
              borderless: true,
              radius: 28,
            }}
            style={[styles.fab, { backgroundColor: theme.primaryStrong }]}
          >
            <SymbolView
              name={{ android: "add" }}
              size={26}
              tintColor={theme.onPrimary}
            />
          </Pressable>
        )}
        {renameTarget && (
          <RenameCalendarDialog
            calendar={renameTarget}
            onClose={() => setRenameTarget(null)}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  )
}

function CalendarRow({
  calendar,
  onToggle,
  onDelete,
  onRename,
}: {
  calendar: UserCalendar
  onToggle: (visible: boolean) => Promise<boolean>
  onDelete: (id: string, name: string) => void
  onRename: (calendar: UserCalendar) => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  // MenuView does not open itself on Android; the trigger drives it through this
  // ref (the idiom already proven in calendar-view-menu.tsx). iOS opens natively.
  const menuRef = useRef<MenuComponentRef>(null)

  // The effective display name: `trim(stored)` else the localized fallback. The
  // previous `calendar.name || …` let a whitespace-only name through to a blank
  // label — the exact production case TIM-274 measured.
  const name = effectiveCalendarName(
    calendar.name,
    t("userCalendars.namePlaceholder"),
  )
  const school = calendar.schoolName ?? t("userCalendars.personalSubtitle")

  // Android-only trigger wiring: MenuView needs an explicit show(), reachable
  // both by press and by TalkBack's `activate` action (which delivers no press).
  // iOS opens the menu natively on press, so it must NOT also call show().
  const androidTrigger =
    Platform.OS === "android"
      ? {
          accessibilityActions: [{ name: "activate" }],
          onPress: () => menuRef.current?.show(),
          onAccessibilityAction: ({
            nativeEvent,
          }: AccessibilityActionEvent) => {
            if (nativeEvent.actionName === "activate") menuRef.current?.show()
          },
          android_ripple: {
            color: theme.ripple,
            borderless: true,
            radius: 24,
          },
        }
      : null

  return (
    <View
      testID={`user-calendar-row-${calendar.id}`}
      style={[styles.row, { backgroundColor: theme.backgroundElement }]}
    >
      <View style={styles.rowHeader}>
        <View style={styles.rowText}>
          <ThemedText style={styles.rowName}>{name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {school}
          </ThemedText>
        </View>
        <MenuView
          ref={menuRef}
          testID={`user-calendar-actions-${calendar.id}`}
          actions={[
            { id: "rename", title: t("userCalendars.rename.action") },
            {
              id: "delete",
              title: t("userCalendars.delete.action"),
              image: "trash",
              attributes: { destructive: true },
            },
          ]}
          onPressAction={({ nativeEvent }) => {
            if (nativeEvent.event === "rename") onRename(calendar)
            if (nativeEvent.event === "delete") onDelete(calendar.id, name)
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("userCalendars.actions", { name })}
            style={styles.menuButton}
            {...androidTrigger}
          >
            <SymbolView
              name={{ ios: "ellipsis", android: "more_vert" }}
              size={22}
              tintColor={theme.textSecondary}
            />
          </Pressable>
        </MenuView>
      </View>

      <View style={[styles.separator, { backgroundColor: theme.separator }]} />
      <VisibilityControl
        calendarId={calendar.id}
        name={name}
        canonicalVisible={calendar.visible}
        onToggle={onToggle}
      />
    </View>
  )
}

function VisibilityControl({
  calendarId,
  name,
  canonicalVisible,
  onToggle,
}: {
  calendarId: string
  name: string
  canonicalVisible: boolean
  onToggle: (visible: boolean) => Promise<boolean>
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const { fontScale } = useWindowDimensions()
  const [optimisticVisible, setOptimisticVisible] = useState<boolean | null>(
    null,
  )
  const visibilityPendingRef = useRef(false)
  const visible = optimisticVisible ?? canonicalVisible

  useEffect(() => {
    if (optimisticVisible !== null && optimisticVisible === canonicalVisible) {
      // The live query has acknowledged the optimistic write; keeping it would
      // mask a later external change back to the previous value.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOptimisticVisible(null)
    }
  }, [canonicalVisible, optimisticVisible])

  const toggleVisibility = useCallback(
    async (nextVisible: boolean) => {
      if (visibilityPendingRef.current) return
      visibilityPendingRef.current = true
      setOptimisticVisible(nextVisible)
      try {
        if (!(await onToggle(nextVisible))) setOptimisticVisible(null)
      } finally {
        visibilityPendingRef.current = false
      }
    },
    [onToggle],
  )

  return (
    <View
      style={[
        styles.visibilityRow,
        fontScale >= 1.3 && styles.visibilityRowLargeText,
      ]}
    >
      <View
        style={styles.visibilityLabel}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <ThemedText type="small">
          {t("userCalendars.visibilityShort")}
        </ThemedText>
      </View>
      <View
        style={[
          styles.switchTarget,
          fontScale >= 1.3 && styles.switchTargetLargeText,
        ]}
      >
        <Switch
          testID={`user-calendar-visibility-${calendarId}`}
          accessibilityLabel={t("userCalendars.visibilityLabel", { name })}
          accessibilityHint={t("userCalendars.visibilityHint")}
          value={visible}
          onValueChange={(nextVisible) => {
            void toggleVisibility(nextVisible)
          }}
          trackColor={
            Platform.OS === "android"
              ? { false: theme.backgroundSelected, true: theme.primarySoft }
              : { true: theme.primary }
          }
          thumbColor={
            Platform.OS === "android"
              ? visible
                ? theme.primary
                : theme.textSecondary
              : undefined
          }
        />
      </View>
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
    paddingTop: Platform.OS === "ios" ? Spacing.five : Spacing.four,
    gap: Spacing.three,
  },
  content: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  contentWithFab: {
    paddingBottom: Spacing.six + Spacing.five,
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
  intro: { marginBottom: Spacing.two },
  row: {
    borderRadius: Radii.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  rowHeader: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
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
  menuButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.two + Spacing.one,
  },
  visibilityRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.three,
  },
  visibilityRowLargeText: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  visibilityLabel: { flex: 1, flexShrink: 1 },
  switchTarget: {
    minWidth: 51,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  switchTargetLargeText: { alignSelf: "flex-end" },
  fab: {
    position: "absolute",
    right: Spacing.three,
    bottom: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: Radii.pill,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    overflow: "hidden",
  },
})
