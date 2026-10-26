import { Stack, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"

import { useHeaderActions } from "@/components/chrome"
import type { EventDetails } from "@/features/calendar/data"
import { useHiddenEvents, useHideActions } from "@/features/hidden-events/data"

export interface EventDetailsAction {
  accessibilityLabel: string
  text: string
  onPress: () => void
}

export function useEventDetailsAction(event: EventDetails): {
  action: EventDetailsAction
  failed: boolean
} {
  const { t } = useTranslation()
  const router = useRouter()
  const { uidHiddenEvents, namedHiddenEvents } = useHiddenEvents()
  const { hideByUid, hideByName, unhideUid, unhideName, failed } =
    useHideActions()

  if (event.kind === "personal") {
    return {
      action: {
        accessibilityLabel: t("eventDetails.edit.actionLabel"),
        text: t("eventDetails.edit.action"),
        onPress: () => router.push(`/personal-event-form?uid=${event.id}`),
      },
      failed,
    }
  }

  const title = event.title
  const hiddenByUid = uidHiddenEvents.includes(event.id)
  const hiddenByName = title !== undefined && namedHiddenEvents.includes(title)

  if (hiddenByUid || hiddenByName) {
    return {
      action: {
        accessibilityLabel: t("eventDetails.unhide.actionLabel"),
        text: t("eventDetails.unhide.action"),
        onPress: () => {
          if (hiddenByUid) unhideUid(event.id)
          if (title !== undefined && hiddenByName) unhideName(title)
        },
      },
      failed,
    }
  }

  return {
    action: {
      accessibilityLabel: t("eventDetails.hide.actionLabel"),
      text: t("eventDetails.hide.action"),
      onPress: () => {
        Alert.alert(t("eventDetails.hide.title"), undefined, [
          {
            text: t("eventDetails.hide.thisEvent"),
            onPress: () => {
              if (hideByUid(event.id)) router.back()
            },
          },
          ...(title === undefined
            ? []
            : [
                {
                  text: t("eventDetails.hide.byName"),
                  onPress: () => {
                    if (hideByName(title)) router.back()
                  },
                },
              ]),
          { text: t("eventDetails.hide.cancel"), style: "cancel" },
        ])
      },
    },
    failed,
  }
}

export function EventDetailsHeader({
  action,
}: {
  action?: EventDetailsAction
}) {
  const { t } = useTranslation()
  const headerActions = useHeaderActions({
    right: action
      ? [
          {
            label: action.text,
            accessibilityLabel: action.accessibilityLabel,
            testID: "event-details-action",
            onPress: action.onPress,
          },
        ]
      : [],
  })
  return (
    <Stack.Screen
      options={{ title: t("eventDetails.title"), ...headerActions }}
    />
  )
}
