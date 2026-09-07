import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { AccessibilityInfo } from "react-native"

import { NativeTextEntryDialog } from "@/components/chrome"
import {
  effectiveCalendarName,
  type UserCalendar,
  useRenameCalendar,
} from "@/features/calendar-sources/data"

const MaxNameLength = 100

// Static declarations keep the selectors discoverable by the Maestro source
// guard while the chrome contract passes them to either native toolkit.
const renameDialogSelectors = {
  dialog: { testID: "user-calendar-rename-dialog" },
  input: { testID: "user-calendar-rename-input" },
  message: { testID: "user-calendar-rename-message" },
  cancel: { testID: "user-calendar-rename-cancel" },
  submit: { testID: "user-calendar-rename-save" },
} as const

const renameDialogIds = {
  dialog: renameDialogSelectors.dialog.testID,
  input: renameDialogSelectors.input.testID,
  message: renameDialogSelectors.message.testID,
  cancel: renameDialogSelectors.cancel.testID,
  submit: renameDialogSelectors.submit.testID,
} as const

export function RenameCalendarDialog({
  calendar,
  onClose,
}: {
  calendar: UserCalendar
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { rename, isPending, isError } = useRenameCalendar()
  const [initialValue] = useState(() => calendar.name.trim())
  const [validationValue, setValidationValue] = useState(initialValue)
  const active = useRef(true)
  const submitting = useRef(false)

  useEffect(
    () => () => {
      active.current = false
    },
    [],
  )

  const tooLong = validationValue.trim().length > MaxNameLength
  const fallback = t("userCalendars.namePlaceholder")
  const submitLabel = isError
    ? t("userCalendars.rename.retry")
    : t("userCalendars.rename.save")
  const inlineMessage = tooLong
    ? t("userCalendars.rename.tooLong")
    : isError
      ? t("userCalendars.rename.error")
      : null

  useEffect(() => {
    if (inlineMessage !== null) {
      AccessibilityInfo.announceForAccessibility(inlineMessage)
    }
  }, [inlineMessage])

  const cancel = () => {
    active.current = false
    onClose()
  }

  const save = async (currentValue: string) => {
    // The native buffer is authoritative. Recheck its trimmed length here so a
    // native change event queued behind the press cannot bypass validation.
    if (
      submitting.current ||
      isPending ||
      currentValue.trim().length > MaxNameLength
    ) {
      return
    }

    submitting.current = true
    try {
      await rename({
        id: calendar.id,
        token: calendar.token,
        name: currentValue,
      })
    } catch {
      submitting.current = false
      return
    }

    if (!active.current) return
    AccessibilityInfo.announceForAccessibility(
      t("userCalendars.rename.renamed", {
        name: effectiveCalendarName(currentValue, fallback),
      }),
    )
    active.current = false
    onClose()
  }

  return (
    <NativeTextEntryDialog
      title={t("userCalendars.rename.title")}
      initialValue={initialValue}
      label={t("userCalendars.rename.label")}
      placeholder={fallback}
      message={inlineMessage}
      cancelLabel={t("common.cancel")}
      submitLabel={submitLabel}
      pending={isPending}
      submitDisabled={tooLong}
      ids={renameDialogIds}
      onChange={setValidationValue}
      onSubmit={(currentValue) => {
        void save(currentValue)
      }}
      onCancel={cancel}
    />
  )
}
