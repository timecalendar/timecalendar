import { Stack, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import {
  FloatingAction,
  NativeList,
  NativeListRow,
  NativeListSection,
  useHeaderActions,
} from "@/components/chrome"
import { RootPage, StatusView } from "@/design"
import {
  effectiveCalendarName,
  useUserCalendars,
  useUserCalendarsLoaded,
} from "@/features/calendar-sources/data"

const addIcon = { ios: "plus", android: "add" } as const

export function UserCalendarsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const calendars = useUserCalendars()
  const loaded = useUserCalendarsLoaded()
  const addCalendar = () =>
    router.push({
      pathname: "/onboarding/school",
      params: { source: "calendar-management" },
    })
  const headerActions = useHeaderActions({
    right: [
      {
        icon: addIcon,
        accessibilityLabel: t("userCalendars.add"),
        testID: "user-calendars-add",
        platform: "ios",
        onPress: addCalendar,
      },
    ],
  })

  return (
    <>
      <Stack.Screen
        options={{
          title: t("userCalendars.title"),
          headerBackButtonDisplayMode: "minimal",
          ...headerActions,
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
        <FloatingAction
          icon={addIcon}
          label={t("userCalendars.add")}
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
