import { router, useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { DateTimePicker } from "@/components/chrome"
import {
  ColorSwatchPicker,
  SWATCH_PRESETS,
} from "@/components/color-swatch-picker"
import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import {
  buildEventFromForm,
  type EventFormErrors,
  type EventFormValues,
  useDeleteEvent,
  useEventToEdit,
  useSaveEvent,
  validateEventForm,
} from "@/features/personal-events/form"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

// The create/edit personal-event form (B2 / TIM-133) — PRESENTATIONAL (70%
// floor, design D2): it owns NO validation/build/persist logic. It reads the
// optional `uid` route param (no uid → blank create, no delete; a uid → prefill
// + delete), holds local EventFormValues, and only CALLS the feature-folder
// logic (validateEventForm / buildEventFromForm) and the save/delete/edit hooks.
//
// Native date/time controls come through the @/components/chrome seam
// (DateTimePicker — @expo/ui's own SwiftUI/Compose control, ADR 012), never
// @expo/ui directly. Text inputs are RN-core (stable, controllable, testable —
// design D3). Color is the preset swatch picker (D4). All strings via t(); all
// controls carry a role + translated label + ≥44/48 hit target; no
// allowFontScaling={false}.

function defaultValues(): EventFormValues {
  const startsAt = new Date()
  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000)
  return {
    title: "",
    startsAt,
    endsAt,
    color: SWATCH_PRESETS[0],
    location: "",
    description: "",
  }
}

export default function PersonalEventFormScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const params = useLocalSearchParams<{ uid?: string }>()
  const uid = params.uid
  const existing = useEventToEdit(uid)

  const [values, setValues] = useState<EventFormValues>(defaultValues)
  const [errors, setErrors] = useState<EventFormErrors>({})
  const save = useSaveEvent()
  const del = useDeleteEvent()

  // Seed the form from the loaded event once it resolves (edit mode). Deferred
  // to a microtask with an active guard (mirroring splash-screen.tsx) so the
  // seed is not a synchronous setState in the effect body
  // (react-hooks/set-state-in-effect → cascading renders).
  useEffect(() => {
    if (existing === undefined) {
      return
    }
    let active = true
    queueMicrotask(() => {
      if (active) {
        setValues({
          title: existing.title,
          startsAt: existing.startsAt,
          endsAt: existing.endsAt,
          color: existing.color,
          location: existing.location ?? "",
          description: existing.description ?? "",
        })
      }
    })
    return () => {
      active = false
    }
  }, [existing])

  function update<K extends keyof EventFormValues>(
    key: K,
    value: EventFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function onSave() {
    const validation = validateEventForm(values)
    setErrors(validation.errors)
    if (!validation.valid) {
      return
    }
    const event = buildEventFromForm(values, existing)
    const ok = await save.save(event)
    if (ok) {
      router.back()
    }
  }

  async function onDelete() {
    if (uid === undefined) {
      return
    }
    const ok = await del.remove(uid)
    if (ok) {
      router.back()
    }
  }

  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.backgroundElement,
      color: theme.text,
    },
  ]

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title">
            {uid === undefined
              ? t("personalEvents.form.createTitle")
              : t("personalEvents.form.editTitle")}
          </ThemedText>

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
            <DateTimePicker
              testID="personal-event-start-picker"
              mode="datetime"
              presentation="inline"
              value={values.startsAt}
              onValueChange={(_event, date) => update("startsAt", date)}
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">
              {t("personalEvents.form.endLabel")}
            </ThemedText>
            <DateTimePicker
              testID="personal-event-end-picker"
              mode="datetime"
              presentation="inline"
              value={values.endsAt}
              onValueChange={(_event, date) => update("endsAt", date)}
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

          {(save.failed || del.failed) && (
            <ThemedText
              themeColor="textSecondary"
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              {save.failed
                ? t("personalEvents.form.error.saveFailed")
                : t("personalEvents.form.error.deleteFailed")}
            </ThemedText>
          )}

          <Pressable
            testID="personal-event-save"
            accessibilityRole="button"
            accessibilityLabel={t("personalEvents.form.save")}
            onPress={onSave}
            style={[
              styles.action,
              { backgroundColor: theme.backgroundSelected },
            ]}
          >
            <ThemedText type="smallBold">
              {t("personalEvents.form.save")}
            </ThemedText>
          </Pressable>

          {uid !== undefined && (
            <Pressable
              testID="personal-event-delete"
              accessibilityRole="button"
              accessibilityLabel={t("personalEvents.form.delete")}
              onPress={onDelete}
              style={[
                styles.action,
                { backgroundColor: theme.backgroundElement },
              ]}
            >
              <ThemedText type="smallBold" themeColor="primary">
                {t("personalEvents.form.delete")}
              </ThemedText>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.two,
  },
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
  action: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Radii.medium,
  },
})
