import type { TFunction } from "i18next"

import { ColorSwatchField, DateTimeField, TextField } from "@/design"
import { type AppLocale, formatShortDateTime } from "@/features/calendar/data"
import type {
  EventFormErrors,
  EventFormValues,
} from "@/features/personal-events/form"
import { useUses24HourClock } from "@/hooks/use-uses-24-hour-clock"

import { SWATCH_NAME_KEYS, SWATCH_PRESETS } from "./color-swatch-presets"

export type UpdateEventFormValue = <K extends keyof EventFormValues>(
  key: K,
  value: EventFormValues[K],
) => void

type PersonalEventFieldsProps = {
  values: EventFormValues
  errors: EventFormErrors
  locale: AppLocale
  displayZone: string
  update: UpdateEventFormValue
  onSubmitTitle: () => void
  t: TFunction
}

export function PersonalEventFields({
  values,
  errors,
  locale,
  displayZone,
  update,
  onSubmitTitle,
  t,
}: PersonalEventFieldsProps) {
  const uses24HourClock = useUses24HourClock()
  const formatValue = (date: Date) =>
    formatShortDateTime(date, locale, displayZone, uses24HourClock)

  return (
    <>
      <TextField
        testID="personal-event-title-input"
        label={t("personalEvents.form.titleLabel")}
        error={errors.title && t(errors.title)}
        placeholder={t("personalEvents.form.titlePlaceholder")}
        value={values.title}
        onChangeText={(text) => update("title", text)}
        returnKeyType="done"
        onSubmitEditing={onSubmitTitle}
      />

      <DateTimeField
        testID="personal-event-start-picker"
        label={t("personalEvents.form.startLabel")}
        value={values.startsAt}
        zone={displayZone}
        formatValue={formatValue}
        onChange={(date) => update("startsAt", date)}
      />

      <DateTimeField
        testID="personal-event-end-picker"
        label={t("personalEvents.form.endLabel")}
        value={values.endsAt}
        zone={displayZone}
        formatValue={formatValue}
        error={errors.range && t(errors.range)}
        onChange={(date) => update("endsAt", date)}
      />

      <ColorSwatchField
        testID="color-swatch"
        label={t("personalEvents.form.colorLabel")}
        options={SWATCH_PRESETS.map((hex) => ({
          color: hex,
          label: t(SWATCH_NAME_KEYS[hex]),
        }))}
        value={values.color}
        onChange={(color) => update("color", color)}
      />

      <TextField
        testID="personal-event-location-input"
        label={t("personalEvents.form.locationLabel")}
        placeholder={t("personalEvents.form.locationPlaceholder")}
        value={values.location}
        onChangeText={(text) => update("location", text)}
      />

      <TextField
        testID="personal-event-description-input"
        label={t("personalEvents.form.descriptionLabel")}
        placeholder={t("personalEvents.form.descriptionPlaceholder")}
        value={values.description}
        onChangeText={(text) => update("description", text)}
        multiline
      />
    </>
  )
}
