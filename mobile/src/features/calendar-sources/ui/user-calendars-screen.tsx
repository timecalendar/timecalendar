import { Stack, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Platform, StyleSheet, View } from "react-native"

import {
  NativeList,
  NativeListFloatingAction,
  NativeListRow,
  NativeListSection,
} from "@/components/chrome"
import { RootPage, StatusView } from "@/design"
import {
  effectiveCalendarName,
  useUserCalendars,
  useUserCalendarsLoaded,
} from "@/features/calendar-sources/data"
import { useTheme } from "@/theme"

const addIcon = { ios: "plus", android: "add" } as const

export function UserCalendarsScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const router = useRouter()
  const calendars = useUserCalendars()
  const loaded = useUserCalendarsLoaded()
  const addCalendar = () =>
    router.push({
      pathname: "/onboarding/school",
      params: { source: "calendar-management" },
    })

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
                icon: { type: "sfSymbol" as const, name: addIcon.ios },
                tintColor: theme.text,
                identifier: "user-calendars-add",
                onPress: addCalendar,
              },
            ],
          }),
        }}
      />
      <View style={styles.fill}>
        {/* useLiveQuery starts empty and settles async, so rendering the empty
          state before `loaded` would flash and false-announce "no calendars". */}
        {!loaded ? null : calendars.length === 0 ? (
          <RootPage testID="user-calendars-content" lane="standard">
            <StatusView
              kind="empty"
              presentation="screen"
              title={t("userCalendars.emptyTitle")}
              caption={t("userCalendars.empty")}
              testID="user-calendars-empty"
            />
          </RootPage>
        ) : (
          <NativeList reservesFloatingAction>
            <NativeListSection
              footer={t("userCalendars.listFooter")}
              testID="user-calendars-list"
            >
              {calendars.map((calendar) => {
                const name = effectiveCalendarName(
                  calendar.name,
                  t("userCalendars.namePlaceholder"),
                )
                const school =
                  calendar.schoolName ?? t("userCalendars.personalSubtitle")
                return (
                  <NativeListRow
                    key={calendar.id}
                    kind="navigation"
                    href={{
                      pathname: "/user-calendars/[id]",
                      params: { id: calendar.id },
                    }}
                    label={name}
                    subtitle={school}
                    value={t(
                      calendar.visible
                        ? "userCalendars.shown"
                        : "userCalendars.hidden",
                    )}
                    accessibilityLabel={t("userCalendars.rowLabel", {
                      name,
                      school,
                    })}
                    hint={t("userCalendars.rowHint")}
                    testID={`user-calendar-row-${calendar.id}`}
                  />
                )
              })}
            </NativeListSection>
          </NativeList>
        )}
        <NativeListFloatingAction
          label={t("userCalendars.add")}
          icon={addIcon}
          testID="user-calendars-add"
          onPress={addCalendar}
        />
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
})
