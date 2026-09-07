import { Stack, useRouter } from "expo-router"
import { SymbolView } from "expo-symbols"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  AccessibilityInfo,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native"

import { EmptyState } from "@/components/empty-state"
import { PageIntro, RootPage } from "@/components/root-page"
import { WriteErrorNotice } from "@/components/write-error-notice"
import {
  type UserCalendar,
  useUserCalendarActions,
  useUserCalendars,
  useUserCalendarsLoaded,
} from "@/features/calendar-sources/data"
import { RenameCalendarDialog } from "@/features/calendar-sources/ui/rename-calendar-dialog"
import { Radii, Spacing, useTheme } from "@/theme"

import { CalendarRow } from "./calendar-row"
import {
  useVisibilityController,
  visibleFromOperation,
} from "./visibility-controller"

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
  const router = useRouter()
  const calendars = useUserCalendars()
  const loaded = useUserCalendarsLoaded()
  const { setVisible, remove, failed } = useUserCalendarActions()
  const visibility = useVisibilityController(calendars, setVisible)
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
    <>
      <Stack.Screen
        options={{
          title: t("userCalendars.title"),
          headerBackButtonDisplayMode: "minimal",
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
      <RootPage testID="user-calendars-content" lane="standard">
        {(layout) => (
          <View
            testID="user-calendars-safe-area"
            style={[layout.laneStyle, styles.safeArea]}
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
              <EmptyState
                variant="screen"
                title={t("userCalendars.emptyTitle")}
                caption={t("userCalendars.empty")}
                testID="user-calendars-empty"
              />
            ) : (
              <FlatList
                testID="user-calendars-list"
                data={calendars}
                keyExtractor={(calendar) => calendar.id}
                contentContainerStyle={[
                  styles.content,
                  Platform.OS === "android" && styles.contentWithFab,
                ]}
                ListHeaderComponent={
                  <PageIntro
                    caption={t("userCalendars.visibilityDescription")}
                  />
                }
                renderItem={({ item: calendar }) => (
                  <CalendarRow
                    calendar={calendar}
                    visible={visibleFromOperation(
                      calendar.visible,
                      visibility.operationFor(calendar.id),
                    )}
                    onToggle={(visible) =>
                      visibility.toggle(calendar.id, visible)
                    }
                    onDelete={confirmDelete}
                    onRename={setRenameTarget}
                  />
                )}
              />
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
          </View>
        )}
      </RootPage>
    </>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
