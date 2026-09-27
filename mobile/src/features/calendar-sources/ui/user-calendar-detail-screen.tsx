import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { AccessibilityInfo, Alert } from "react-native"

import {
  NativeSettingsAlert,
  NativeSettingsHost,
  NativeSettingsRow,
  NativeSettingsSection,
  NativeSettingsSwitchRow,
} from "@/components/chrome"
import {
  effectiveCalendarName,
  useUserCalendarActions,
  useUserCalendars,
} from "@/features/calendar-sources/data"

import { RenameCalendarDialog } from "./rename-calendar-dialog"
import {
  useVisibilityController,
  visibleFromOperation,
} from "./visibility-controller"

export function UserCalendarDetailScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const calendars = useUserCalendars()
  const { setVisible, remove, failed } = useUserCalendarActions()
  const visibility = useVisibilityController(calendars, setVisible)
  const [renaming, setRenaming] = useState(false)
  const calendar = calendars.find((candidate) => candidate.id === id)

  // Before the read settles, and behind the pop after a delete, the page is
  // empty; an explicit blank title keeps the route name out of the header.
  if (!calendar) {
    return (
      <>
        <Stack.Screen options={{ title: "" }} />
        <NativeSettingsHost />
      </>
    )
  }

  const name = effectiveCalendarName(
    calendar.name,
    t("userCalendars.namePlaceholder"),
  )

  // The success announce and pop are gated on the resolved write so a failed
  // delete keeps the page and its accessible failure alert mounted.
  const confirmDelete = () => {
    Alert.alert(
      t("userCalendars.delete.title"),
      t("userCalendars.delete.message", { name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("userCalendars.delete.confirm"),
          style: "destructive",
          onPress: async () => {
            if (await remove(calendar.id)) {
              AccessibilityInfo.announceForAccessibility(
                t("userCalendars.deleted", { name }),
              )
              router.back()
            }
          },
        },
      ],
    )
  }

  return (
    <>
      <Stack.Screen
        options={{ title: name, headerBackButtonDisplayMode: "minimal" }}
      />
      <NativeSettingsHost>
        {failed ? (
          <NativeSettingsAlert
            title={t("userCalendars.errorTitle")}
            message={t("userCalendars.error")}
            testID="user-calendars-write-error"
            messageTestID="user-calendars-write-error-message"
          />
        ) : null}
        <NativeSettingsSection testID="user-calendar-details">
          <NativeSettingsRow
            kind="action"
            label={t("userCalendars.detail.name")}
            value={name}
            hint={t("userCalendars.rename.title")}
            onPress={() => setRenaming(true)}
            testID="user-calendar-rename"
          />
          {calendar.schoolName ? (
            <NativeSettingsRow
              kind="value"
              label={t("userCalendars.detail.school")}
              value={calendar.schoolName}
              testID="user-calendar-school"
            />
          ) : null}
        </NativeSettingsSection>
        <NativeSettingsSection footer={t("userCalendars.visibilityFooter")}>
          <NativeSettingsSwitchRow
            label={t("userCalendars.visibilityShort")}
            value={visibleFromOperation(
              calendar.visible,
              visibility.operationFor(calendar.id),
            )}
            onValueChange={(visible) => visibility.toggle(calendar.id, visible)}
            testID={`user-calendar-visibility-row-${calendar.id}`}
            switchTestID={`user-calendar-visibility-${calendar.id}`}
          />
        </NativeSettingsSection>
        <NativeSettingsSection>
          <NativeSettingsRow
            kind="action"
            destructive
            label={t("userCalendars.delete.row")}
            onPress={confirmDelete}
            testID="user-calendar-delete"
          />
        </NativeSettingsSection>
      </NativeSettingsHost>
      {renaming ? (
        <RenameCalendarDialog
          calendar={calendar}
          onClose={() => setRenaming(false)}
        />
      ) : null}
    </>
  )
}
