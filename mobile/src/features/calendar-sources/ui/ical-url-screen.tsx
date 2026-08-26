import { router } from "expo-router"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, TextInput, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import {
  CalendarImportHelpKey,
  CalendarImportRecoveryError,
  useAddCalendar,
  validateIcalUrl,
} from "@/features/calendar-sources/data"
import { useSchools, useSelectedSchool } from "@/features/school-selection"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

import { focusCalendarUrl } from "./focus-calendar-url"

interface RecoveryCopy {
  title: `calendarSources.icalUrl.recovery.${CalendarImportHelpKey}.title`
  instruction: `calendarSources.icalUrl.recovery.${CalendarImportHelpKey}.instruction`
}

const RECOVERY_COPY: Record<CalendarImportHelpKey, RecoveryCopy> = {
  rennes_export: {
    title: "calendarSources.icalUrl.recovery.rennes_export.title",
    instruction: "calendarSources.icalUrl.recovery.rennes_export.instruction",
  },
  tours_export: {
    title: "calendarSources.icalUrl.recovery.tours_export.title",
    instruction: "calendarSources.icalUrl.recovery.tours_export.instruction",
  },
  reunion_export: {
    title: "calendarSources.icalUrl.recovery.reunion_export.title",
    instruction: "calendarSources.icalUrl.recovery.reunion_export.instruction",
  },
  montpellier_export: {
    title: "calendarSources.icalUrl.recovery.montpellier_export.title",
    instruction:
      "calendarSources.icalUrl.recovery.montpellier_export.instruction",
  },
  ube_export: {
    title: "calendarSources.icalUrl.recovery.ube_export.title",
    instruction: "calendarSources.icalUrl.recovery.ube_export.instruction",
  },
  lyon2_export: {
    title: "calendarSources.icalUrl.recovery.lyon2_export.title",
    instruction: "calendarSources.icalUrl.recovery.lyon2_export.instruction",
  },
  saint_etienne_outage: {
    title: "calendarSources.icalUrl.recovery.saint_etienne_outage.title",
    instruction:
      "calendarSources.icalUrl.recovery.saint_etienne_outage.instruction",
  },
  bordeaux_inp_outage: {
    title: "calendarSources.icalUrl.recovery.bordeaux_inp_outage.title",
    instruction:
      "calendarSources.icalUrl.recovery.bordeaux_inp_outage.instruction",
  },
  toulouse3_outage: {
    title: "calendarSources.icalUrl.recovery.toulouse3_outage.title",
    instruction:
      "calendarSources.icalUrl.recovery.toulouse3_outage.instruction",
  },
  generic_invalid_calendar: {
    title: "calendarSources.icalUrl.recovery.generic_invalid_calendar.title",
    instruction:
      "calendarSources.icalUrl.recovery.generic_invalid_calendar.instruction",
  },
  generic_upstream_unavailable: {
    title:
      "calendarSources.icalUrl.recovery.generic_upstream_unavailable.title",
    instruction:
      "calendarSources.icalUrl.recovery.generic_upstream_unavailable.instruction",
  },
  generic_unknown: {
    title: "calendarSources.icalUrl.recovery.generic_unknown.title",
    instruction: "calendarSources.icalUrl.recovery.generic_unknown.instruction",
  },
}

// The iCal-URL entry screen (Phase-3 ship 4, rewired by ship 5 / ADR 018) —
// PRESENTATIONAL (70% floor): a labeled RN-core TextInput for the calendar URL, a
// submit control, and accessible loading / server-error-with-retry states over
// the add operation (mirroring school-selection's read flow per data.md). It
// posts the URL to the server (POST /calendars), not a client-side .ics parse —
// Flutter parity (D1).
//
// Two failure classes (D5): an INVALID URL (the pure pre-filter returns a key) is
// recoverable — shown inline, NOT recordError'd (noise avoidance, like the QR
// "not a calendar" path); a failure of the create / token-resolve / durable
// upsert chain is recorded through @/firebase recordError AND surfaced as an
// accessible error + Retry (the URL is syntactically fine, so it's both recorded
// and retryable). On success the shared addCalendarFromUrl seam has persisted a
// DURABLE user_calendars row (replacing ship 3's removed ephemeral holder) and the
// screen dismisses.
//
// It consumes its sibling data sub-barrel (@/features/calendar-sources/data),
// never its own feature barrel (B-2) and never the generated hook / firebase
// seams directly (B-1/B-4 — the data/ layer owns the generated import; the screen
// uses the @/firebase seam). Tested beside this file; the route
// (src/app/onboarding/ical-url.tsx) is a thin re-export (route-structure rule).
export default function IcalUrlScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const { addCalendarFromUrl, isPending, reset } = useAddCalendar()
  const selection = useSelectedSchool()
  const { schools } = useSchools()
  const [url, setUrl] = useState("")
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [failedAttempt, setFailedAttempt] =
    useState<CalendarImportRecoveryError | null>(null)
  const inputRef = useRef<TextInput>(null)
  const selectedSchoolName = schools.find(
    (school) => school.id === selection?.schoolId,
  )?.name

  const report = () => {
    if (!failedAttempt) return
    router.push({
      pathname: "/feedback",
      params: {
        classification: failedAttempt.recovery.classification,
        helpKey: failedAttempt.recovery.helpKey,
      },
    })
  }

  const submit = () => {
    const validationKey = validateIcalUrl(url)
    if (validationKey !== null) {
      // Recoverable client pre-filter miss — inline, no submit, no recordError.
      setErrorKey(validationKey)
      return
    }
    setErrorKey(null)
    reset()
    setFailedAttempt(null)
    const school =
      selection?.schoolId && selectedSchoolName
        ? { schoolId: selection.schoolId, schoolName: selectedSchoolName }
        : undefined
    void addCalendarFromUrl(url, school)
      .then(() => {
        router.back()
      })
      .catch((error: unknown) => {
        setFailedAttempt(
          error instanceof CalendarImportRecoveryError
            ? error
            : new CalendarImportRecoveryError({
                classification: "unknown",
                helpKey: "generic_unknown",
                retryable: true,
              }),
        )
      })
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.intro}>
          <ThemedText type="title">
            {t("calendarSources.icalUrl.title")}
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            {t("calendarSources.icalUrl.helper")}
          </ThemedText>
        </View>

        <ThemedText type="smallBold">
          {t("calendarSources.icalUrl.fieldLabel")}
        </ThemedText>
        <TextInput
          ref={inputRef}
          testID="ical-url-input"
          accessibilityLabel={t("calendarSources.icalUrl.fieldLabel")}
          placeholder={t("calendarSources.icalUrl.placeholder")}
          placeholderTextColor={theme.textSecondary}
          value={url}
          onChangeText={(next) => {
            setUrl(next)
            if (errorKey !== null) {
              setErrorKey(null)
            }
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          inputMode="url"
          editable={!isPending}
          style={[
            styles.input,
            { color: theme.text, borderColor: theme.backgroundSelected },
          ]}
        />

        {errorKey !== null && (
          <ThemedText
            themeColor="textSecondary"
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            {t(errorKey)}
          </ThemedText>
        )}

        <Pressable
          testID="ical-url-submit"
          accessibilityRole="button"
          accessibilityLabel={t("calendarSources.icalUrl.submitLabel")}
          accessibilityState={{ disabled: isPending }}
          disabled={isPending}
          hitSlop={Spacing.two}
          onPress={submit}
          style={[
            styles.cta,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.primary,
            },
          ]}
        >
          <ThemedText type="smallBold">
            {t("calendarSources.icalUrl.submit")}
          </ThemedText>
        </Pressable>

        {isPending && (
          <ThemedText
            themeColor="textSecondary"
            accessibilityLiveRegion="polite"
            accessibilityRole="text"
          >
            {t("calendarSources.icalUrl.importing")}
          </ThemedText>
        )}

        {failedAttempt && (
          <View style={styles.errorBlock}>
            {(() => {
              const copy = RECOVERY_COPY[failedAttempt.recovery.helpKey]
              return (
                <>
                  <ThemedText
                    type="subtitle"
                    themeColor="textSecondary"
                    accessibilityLiveRegion="polite"
                    accessibilityRole="alert"
                  >
                    {t(copy.title)}
                  </ThemedText>
                  <ThemedText themeColor="textSecondary">
                    {t(copy.instruction)}
                  </ThemedText>
                </>
              )
            })()}
            {failedAttempt.recovery.retryable ? (
              <Pressable
                testID="ical-url-retry"
                accessibilityRole="button"
                accessibilityLabel={t("calendarSources.icalUrl.retryLabel")}
                hitSlop={Spacing.two}
                onPress={submit}
                style={[
                  styles.cta,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.primary,
                  },
                ]}
              >
                <ThemedText type="smallBold">
                  {t("calendarSources.icalUrl.retry")}
                </ThemedText>
              </Pressable>
            ) : (
              <Pressable
                testID="ical-url-correct"
                accessibilityRole="button"
                accessibilityLabel={t("calendarSources.icalUrl.correctLabel")}
                hitSlop={Spacing.two}
                onPress={() => focusCalendarUrl(inputRef.current)}
                style={[
                  styles.cta,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.primary,
                  },
                ]}
              >
                <ThemedText type="smallBold">
                  {t("calendarSources.icalUrl.correct")}
                </ThemedText>
              </Pressable>
            )}
            <Pressable
              testID="ical-url-report"
              accessibilityRole="link"
              accessibilityLabel={t("calendarSources.icalUrl.report")}
              accessibilityHint={t("calendarSources.icalUrl.reportHint")}
              hitSlop={Spacing.two}
              onPress={report}
              style={[
                styles.cta,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.primary,
                },
              ]}
            >
              <ThemedText type="smallBold">
                {t("calendarSources.icalUrl.report")}
              </ThemedText>
            </Pressable>
          </View>
        )}
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    justifyContent: "center",
    gap: Spacing.three,
  },
  intro: {
    gap: Spacing.three,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Radii.medium,
    fontSize: 16,
  },
  cta: {
    minHeight: 48,
    paddingHorizontal: Spacing.four,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: Radii.medium,
    borderWidth: 2,
  },
  errorBlock: {
    gap: Spacing.three,
  },
})
