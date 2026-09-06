import { router } from "expo-router"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, Platform } from "react-native"

import { useDeleteEvent } from "@/features/personal-events/form"

export function usePersonalEventDeleteConfirmation(uid?: string) {
  const { t } = useTranslation()
  const deletion = useDeleteEvent()
  const [isDeleting, setIsDeleting] = useState(false)
  const phase = useRef<"idle" | "prompting" | "deleting">("idle")
  const promptGeneration = useRef(0)

  function requestDelete() {
    if (uid === undefined || phase.current !== "idle") {
      return
    }
    phase.current = "prompting"
    const generation = ++promptGeneration.current

    const releasePrompt = () => {
      if (
        promptGeneration.current === generation &&
        phase.current !== "deleting"
      ) {
        promptGeneration.current += 1
        phase.current = "idle"
      }
    }

    Alert.alert(
      t("personalEvents.form.deleteConfirmation.title"),
      t("personalEvents.form.deleteConfirmation.message"),
      [
        {
          text: t("personalEvents.form.deleteConfirmation.cancel"),
          style: "cancel",
          onPress: releasePrompt,
        },
        {
          text: t("personalEvents.form.deleteConfirmation.confirm"),
          style: "destructive",
          onPress: async () => {
            if (
              promptGeneration.current !== generation ||
              phase.current === "deleting"
            ) {
              return
            }
            promptGeneration.current += 1
            phase.current = "deleting"
            setIsDeleting(true)

            const removed = await deletion.remove(uid)
            if (removed) {
              router.back()
              return
            }
            phase.current = "idle"
            setIsDeleting(false)
          },
        },
      ],
      Platform.OS === "android"
        ? { cancelable: true, onDismiss: releasePrompt }
        : undefined,
    )

    if (Platform.OS === "ios") {
      queueMicrotask(() => {
        if (
          promptGeneration.current === generation &&
          phase.current === "prompting"
        ) {
          phase.current = "idle"
        }
      })
    }
  }

  return {
    deleteFailed: deletion.failed,
    isDeleting,
    requestDelete,
  }
}
