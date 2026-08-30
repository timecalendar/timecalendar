import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  AccessibilityInfo,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native"

import { ThemedText } from "@/components/themed-text"
import {
  effectiveCalendarName,
  type UserCalendar,
  useRenameCalendar,
} from "@/features/calendar-sources/data"
import { Radii, Spacing, useTheme } from "@/theme"

// The shared controlled rename dialog (TIM-392 / design D4) — PRESENTATIONAL (70%
// floor). ONE React Native `Modal` used unchanged on both platforms, deliberately
// NOT iOS `Alert.prompt` plus a separate Android path: `Alert.prompt` is iOS-only
// and dismisses itself the moment a button is pressed, so an offline rename would
// throw away what the user typed — exactly what the canonical spec's Error-behavior
// table forbids. A controlled dialog also gives both platforms one validation rule,
// one accessibility surface, and one test surface reachable without gestures.
//
// The input's value is LOCAL React state seeded ONCE from `trim(current name)`.
// It is never bound to a `useLiveQuery` value: a controlled input whose `value`
// round-trips through an async SQLite read drops non-adjacent characters under
// fast typing (TIM-268 found exactly that on the checklist input, and Maestro
// types fast enough to hit it every run). The component is mounted by the screen
// only while a rename is open, so "seeded once" is the mount itself.
//
// Dismissal is explicit: a resolved success, the Cancel control, or Android's
// hardware back (`onRequestClose`). The backdrop is inert on purpose — a stray tap
// must not discard typing that survived a failed save.

// The server's normalized maximum (`UpdateCalendarDto.name`, @maxLength 100),
// checked against the TRIMMED value because the server trims before it measures.
const MaxNameLength = 100

export function RenameCalendarDialog({
  calendar,
  onClose,
}: {
  calendar: UserCalendar
  onClose: () => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const { rename, isPending, isError } = useRenameCalendar()
  const [value, setValue] = useState(() => calendar.name.trim())

  // An empty or whitespace-only value is VALID — an empty name is legal and
  // renders as the fallback. Only an over-long one blocks the save.
  const tooLong = value.trim().length > MaxNameLength
  const fallback = t("userCalendars.namePlaceholder")
  const inlineMessage = tooLong
    ? t("userCalendars.rename.tooLong")
    : isError
      ? t("userCalendars.rename.error")
      : null

  useEffect(() => {
    // `accessibilityLiveRegion` is Android-only, so iOS needs the imperative
    // announce for a message that appears without the user moving focus (the
    // validation flip while typing, and the async save failure).
    if (inlineMessage !== null && Platform.OS === "ios") {
      AccessibilityInfo.announceForAccessibility(inlineMessage)
    }
  }, [inlineMessage])

  const save = async () => {
    if (tooLong || isPending) return
    try {
      await rename({ id: calendar.id, token: calendar.token, name: value })
    } catch {
      // The seam already flipped isError; the dialog stays open with the entered
      // text so the user can retry or cancel. Nothing local changed.
      return
    }
    AccessibilityInfo.announceForAccessibility(
      t("userCalendars.rename.renamed", {
        name: effectiveCalendarName(value, fallback),
      }),
    )
    onClose()
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      // Android's hardware back is an explicit cancel; the inert backdrop is not.
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { backgroundColor: theme.textTertiary }]}>
        <View
          testID="user-calendar-rename-dialog"
          // iOS-only prop (a no-op on Android): isolates VoiceOver to the dialog
          // so the list behind it is not reachable while it is open.
          accessibilityViewIsModal
          style={[styles.card, { backgroundColor: theme.background }]}
        >
          {/* A title string distinct from the menu's "Rename" action: two live
              elements sharing one anchored a11y string made both Maestro tapOns
              hit the first element on iOS in TIM-264. */}
          <ThemedText type="subtitle">
            {t("userCalendars.rename.title")}
          </ThemedText>

          <TextInput
            testID="user-calendar-rename-input"
            accessibilityLabel={t("userCalendars.rename.label")}
            placeholder={fallback}
            placeholderTextColor={theme.textSecondary}
            value={value}
            onChangeText={setValue}
            autoFocus
            autoCorrect={false}
            editable={!isPending}
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.backgroundSelected },
            ]}
          />

          {inlineMessage !== null && (
            <ThemedText
              testID="user-calendar-rename-message"
              themeColor="textSecondary"
              accessibilityLiveRegion="assertive"
              accessibilityRole="alert"
            >
              {inlineMessage}
            </ThemedText>
          )}

          <View style={styles.actions}>
            <Pressable
              testID="user-calendar-rename-cancel"
              accessibilityRole="button"
              accessibilityLabel={t("common.cancel")}
              hitSlop={Spacing.two}
              onPress={onClose}
              style={[styles.action, { borderColor: theme.backgroundSelected }]}
            >
              <ThemedText type="smallBold">{t("common.cancel")}</ThemedText>
            </Pressable>
            {/* One primary control across all three states: after a failure it
                relabels to Retry and reissues the SAME request, so the Maestro
                flow's `id: user-calendar-rename-save` selector stays stable. */}
            <Pressable
              testID="user-calendar-rename-save"
              accessibilityRole="button"
              accessibilityLabel={
                isError
                  ? t("userCalendars.rename.retry")
                  : t("userCalendars.rename.save")
              }
              accessibilityState={{ disabled: tooLong || isPending }}
              disabled={tooLong || isPending}
              hitSlop={Spacing.two}
              onPress={() => {
                void save()
              }}
              style={[styles.action, { borderColor: theme.primary }]}
            >
              <ThemedText type="smallBold">
                {isError
                  ? t("userCalendars.rename.retry")
                  : t("userCalendars.rename.save")}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.four,
  },
  card: {
    alignSelf: "stretch",
    borderRadius: Radii.medium,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Radii.medium,
    fontSize: 16,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.two,
  },
  action: {
    minHeight: 48,
    minWidth: 88,
    paddingHorizontal: Spacing.four,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Radii.medium,
    borderWidth: 2,
  },
})
