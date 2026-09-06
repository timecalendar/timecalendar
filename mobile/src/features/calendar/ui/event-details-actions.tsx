import { Stack, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Alert, Pressable, StyleSheet } from "react-native"

import { ThemedText } from "@/components/themed-text"
import type { EventDetails } from "@/features/calendar/data"
import { useHiddenEvents, useHideActions } from "@/features/hidden-events/data"
import { Spacing } from "@/theme"

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

  const hiddenByUid = uidHiddenEvents.includes(event.id)
  const hiddenByName = namedHiddenEvents.includes(event.title)

  if (hiddenByUid || hiddenByName) {
    return {
      action: {
        accessibilityLabel: t("eventDetails.unhide.actionLabel"),
        text: t("eventDetails.unhide.action"),
        onPress: () => {
          if (hiddenByUid) unhideUid(event.id)
          if (hiddenByName) unhideName(event.title)
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
          {
            text: t("eventDetails.hide.byName"),
            onPress: () => {
              if (hideByName(event.title)) router.back()
            },
          },
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
  const title = t("eventDetails.title")

  if (action === undefined) {
    return <Stack.Screen options={{ title }} />
  }

  return (
    <Stack.Screen
      options={{
        title,
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel}
            hitSlop={Spacing.two}
            onPress={action.onPress}
            style={styles.headerAction}
          >
            <ThemedText type="smallBold" themeColor="primary">
              {action.text}
            </ThemedText>
          </Pressable>
        ),
      }}
    />
  )
}

const styles = StyleSheet.create({
  headerAction: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.two,
  },
})
