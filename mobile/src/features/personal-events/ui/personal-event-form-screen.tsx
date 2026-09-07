import { Stack, useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"
import { StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedView } from "@/components/themed-view"
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
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title:
            uid === undefined
              ? t("personalEvents.form.createTitle")
              : t("personalEvents.form.editTitle"),
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
        <PersonalEventEditor
          key={editorKey}
          uid={uid}
          existing={existing}
          locale={locale}
          displayZone={displayZone}
        />
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
})
