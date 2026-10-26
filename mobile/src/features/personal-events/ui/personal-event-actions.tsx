import type { TFunction } from "i18next"
import { StyleSheet, View } from "react-native"

import { Button, ErrorNotice } from "@/design"
import { Spacing } from "@/theme"

type PersonalEventActionsProps = {
  canDelete: boolean
  isSaving: boolean
  isDeleting: boolean
  saveFailed: boolean
  deleteFailed: boolean
  onSave: () => void
  onDelete: () => void
  t: TFunction
}

export function PersonalEventActions({
  canDelete,
  isSaving,
  isDeleting,
  saveFailed,
  deleteFailed,
  onSave,
  onDelete,
  t,
}: PersonalEventActionsProps) {
  return (
    <View testID="personal-event-actions" style={styles.footer}>
      {(saveFailed || deleteFailed) && (
        <ErrorNotice
          message={
            saveFailed
              ? t("personalEvents.form.error.saveFailed")
              : t("personalEvents.form.error.deleteFailed")
          }
        />
      )}

      <Button
        variant="filled"
        testID="personal-event-save"
        label={t("personalEvents.form.save")}
        onPress={onSave}
        busy={isSaving}
      />

      {canDelete && (
        <Button
          variant="destructive"
          testID="personal-event-delete"
          label={t("personalEvents.form.delete")}
          onPress={onDelete}
          busy={isDeleting}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  footer: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
})
