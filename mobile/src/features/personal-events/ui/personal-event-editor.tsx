import { router } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet } from "react-native"

import { KeyboardSafeActionLayout } from "@/components/keyboard-safe-action-layout"
import type { AppLocale } from "@/features/calendar/data"
import type { PersonalEvent } from "@/features/personal-events/data"
import {
  buildEventFromForm,
  type EventFormErrors,
  type EventFormValues,
  useSaveEvent,
  validateEventForm,
} from "@/features/personal-events/form"
import { Spacing } from "@/theme"

import { DEFAULT_SWATCH } from "./color-swatch-presets"
import { PersonalEventActions } from "./personal-event-actions"
import {
  PersonalEventFields,
  type UpdateEventFormValue,
} from "./personal-event-fields"
import { usePersonalEventDeleteConfirmation } from "./use-personal-event-delete-confirmation"

type PersonalEventEditorProps = {
  uid: string | undefined
  existing: PersonalEvent | undefined
  locale: AppLocale
  displayZone: string
}

function initialValues(existing?: PersonalEvent): EventFormValues {
  if (existing !== undefined) {
    return {
      title: existing.title,
      startsAt: existing.startsAt,
      endsAt: existing.endsAt,
      color: existing.color,
      location: existing.location ?? "",
      description: existing.description ?? "",
    }
  }
  const startsAt = new Date()
  return {
    title: "",
    startsAt,
    endsAt: new Date(startsAt.getTime() + 60 * 60 * 1000),
    color: DEFAULT_SWATCH,
    location: "",
    description: "",
  }
}

export function PersonalEventEditor({
  uid,
  existing,
  locale,
  displayZone,
}: PersonalEventEditorProps) {
  const { t } = useTranslation()
  const [values, setValues] = useState<EventFormValues>(() =>
    initialValues(existing),
  )
  const [errors, setErrors] = useState<EventFormErrors>({})
  const [saving, setSaving] = useState(false)
  const save = useSaveEvent()
  const deletion = usePersonalEventDeleteConfirmation(uid)

  const update: UpdateEventFormValue = (key, value) => {
    setValues((previous) => ({ ...previous, [key]: value }))
  }

  async function onSave() {
    if (saving) return
    const validation = validateEventForm(values)
    setErrors(validation.errors)
    if (!validation.valid) {
      return
    }
    setSaving(true)
    const saved = await save
      .save(buildEventFromForm(values, existing))
      .finally(() => setSaving(false))
    if (saved) {
      router.back()
    }
  }

  return (
    <KeyboardSafeActionLayout
      testID="personal-event-form-responsive-owner"
      contentContainerStyle={styles.content}
      actionContainerStyle={styles.footer}
      actions={
        <PersonalEventActions
          canDelete={uid !== undefined}
          isSaving={saving}
          isDeleting={deletion.isDeleting}
          saveFailed={save.failed}
          deleteFailed={deletion.deleteFailed}
          onSave={onSave}
          onDelete={deletion.requestDelete}
          t={t}
        />
      }
    >
      <PersonalEventFields
        values={values}
        errors={errors}
        locale={locale}
        displayZone={displayZone}
        update={update}
        t={t}
      />
    </KeyboardSafeActionLayout>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  footer: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
  },
})
