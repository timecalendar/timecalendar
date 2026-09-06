import type { TFunction } from "i18next"
import { Pressable, StyleSheet, View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import { WriteErrorNotice } from "@/components/write-error-notice"
import { Radii, Spacing, useTheme } from "@/theme"

type PersonalEventActionsProps = {
  canDelete: boolean
  isDeleting: boolean
  saveFailed: boolean
  deleteFailed: boolean
  onSave: () => void
  onDelete: () => void
  t: TFunction
}

export function PersonalEventActions({
  canDelete,
  isDeleting,
  saveFailed,
  deleteFailed,
  onSave,
  onDelete,
  t,
}: PersonalEventActionsProps) {
  const theme = useTheme()

  return (
    <View style={styles.footer}>
      {(saveFailed || deleteFailed) && (
        <WriteErrorNotice
          message={
            saveFailed
              ? t("personalEvents.form.error.saveFailed")
              : t("personalEvents.form.error.deleteFailed")
          }
        />
      )}

      <Pressable
        testID="personal-event-save"
        accessibilityRole="button"
        accessibilityLabel={t("personalEvents.form.save")}
        onPress={onSave}
        style={[styles.action, { backgroundColor: theme.backgroundSelected }]}
      >
        <ThemedText type="smallBold">
          {t("personalEvents.form.save")}
        </ThemedText>
      </Pressable>

      {canDelete && (
        <Pressable
          testID="personal-event-delete"
          accessibilityRole="button"
          accessibilityLabel={t("personalEvents.form.delete")}
          accessibilityState={{ disabled: isDeleting }}
          disabled={isDeleting}
          onPress={onDelete}
          style={[styles.action, { backgroundColor: theme.backgroundElement }]}
        >
          <ThemedText type="smallBold" themeColor="primary">
            {t("personalEvents.form.delete")}
          </ThemedText>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  action: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Radii.medium,
  },
})
