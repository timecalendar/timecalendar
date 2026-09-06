import type { TFunction } from "i18next"
import { StyleSheet, TextInput, View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import type { AppLocale } from "@/features/calendar/data"
import type {
  EventFormErrors,
  EventFormValues,
} from "@/features/personal-events/form"
import { Radii, Spacing, useTheme } from "@/theme"

import { ColorSwatchPicker } from "./color-swatch-picker"
import { DateTimeField } from "./date-time-field"

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
  t: TFunction
}

export function PersonalEventFields({
  values,
  errors,
  locale,
  displayZone,
  update,
  t,
}: PersonalEventFieldsProps) {
  const theme = useTheme()
  const inputStyle = [
    styles.input,
    { backgroundColor: theme.backgroundElement, color: theme.text },
  ]

  return (
    <>
      <View style={styles.field}>
        <ThemedText type="smallBold">
          {t("personalEvents.form.titleLabel")}
        </ThemedText>
        <TextInput
          testID="personal-event-title-input"
          accessibilityLabel={t("personalEvents.form.titleLabel")}
          placeholder={t("personalEvents.form.titlePlaceholder")}
          placeholderTextColor={theme.textSecondary}
          value={values.title}
          onChangeText={(text) => update("title", text)}
          style={inputStyle}
        />
        {errors.title !== undefined && (
          <ThemedText
            themeColor="textSecondary"
            type="small"
            accessibilityRole="alert"
          >
            {t(errors.title)}
          </ThemedText>
        )}
      </View>

      <View style={styles.field}>
        <ThemedText type="smallBold">
          {t("personalEvents.form.startLabel")}
        </ThemedText>
        <DateTimeField
          testID="personal-event-start-picker"
          accessibilityLabel={t("personalEvents.form.startLabel")}
          value={values.startsAt}
          locale={locale}
          zone={displayZone}
          onChange={(date) => update("startsAt", date)}
        />
      </View>

      <View style={styles.field}>
        <ThemedText type="smallBold">
          {t("personalEvents.form.endLabel")}
        </ThemedText>
        <DateTimeField
          testID="personal-event-end-picker"
          accessibilityLabel={t("personalEvents.form.endLabel")}
          value={values.endsAt}
          locale={locale}
          zone={displayZone}
          onChange={(date) => update("endsAt", date)}
        />
        {errors.range !== undefined && (
          <ThemedText
            themeColor="textSecondary"
            type="small"
            accessibilityRole="alert"
          >
            {t(errors.range)}
          </ThemedText>
        )}
      </View>

      <View style={styles.field}>
        <ThemedText type="smallBold">
          {t("personalEvents.form.colorLabel")}
        </ThemedText>
        <ColorSwatchPicker
          value={values.color}
          onChange={(hex) => update("color", hex)}
        />
      </View>

      <View style={styles.field}>
        <ThemedText type="smallBold">
          {t("personalEvents.form.locationLabel")}
        </ThemedText>
        <TextInput
          testID="personal-event-location-input"
          accessibilityLabel={t("personalEvents.form.locationLabel")}
          placeholder={t("personalEvents.form.locationPlaceholder")}
          placeholderTextColor={theme.textSecondary}
          value={values.location}
          onChangeText={(text) => update("location", text)}
          style={inputStyle}
        />
      </View>

      <View style={styles.field}>
        <ThemedText type="smallBold">
          {t("personalEvents.form.descriptionLabel")}
        </ThemedText>
        <TextInput
          testID="personal-event-description-input"
          accessibilityLabel={t("personalEvents.form.descriptionLabel")}
          placeholder={t("personalEvents.form.descriptionPlaceholder")}
          placeholderTextColor={theme.textSecondary}
          value={values.description}
          onChangeText={(text) => update("description", text)}
          multiline
          style={[inputStyle, styles.multiline]}
        />
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  field: { gap: Spacing.two },
  input: {
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.medium,
    fontSize: 16,
  },
  multiline: {
    minHeight: 96,
    paddingTop: Spacing.three,
    textAlignVertical: "top",
  },
})
