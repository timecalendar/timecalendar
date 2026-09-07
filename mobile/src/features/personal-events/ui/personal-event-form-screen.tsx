import { Stack, useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"

import { RootPage } from "@/components/root-page"
import { resolveLocale } from "@/features/calendar/data"
import { useEventToEdit } from "@/features/personal-events/form"
import { useDisplayZone } from "@/features/settings/prefs"

import { PersonalEventEditor } from "./personal-event-editor"

export default function PersonalEventFormScreen() {
  const { i18n, t } = useTranslation()
  const locale = resolveLocale(i18n.language)
  const displayZone = useDisplayZone()
  const { uid } = useLocalSearchParams<{ uid?: string }>()
  const loadedEvent = useEventToEdit(uid)
  const existing = loadedEvent?.uid === uid ? loadedEvent : undefined
  const editorKey =
    uid === undefined ? "create" : `${uid}:${existing?.uid ?? "loading"}`

  return (
    <>
      <Stack.Screen
        options={{
          title:
            uid === undefined
              ? t("personalEvents.form.createTitle")
              : t("personalEvents.form.editTitle"),
        }}
      />
      <RootPage lane="readable" testID="personal-event-form-layout-owner">
        {() => (
          <PersonalEventEditor
            key={editorKey}
            uid={uid}
            existing={existing}
            locale={locale}
            displayZone={displayZone}
          />
        )}
      </RootPage>
    </>
  )
}
