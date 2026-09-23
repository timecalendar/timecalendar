import { router, Stack } from "expo-router"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, TextInput } from "react-native"

import { ErrorNotice, FieldError } from "@/components/error-surfaces"
import { KeyboardSafeActionLayout } from "@/components/keyboard-safe-action-layout"
import { PrimaryAction } from "@/components/primary-action"
import { PageIntro, RootPage } from "@/components/root-page"
import { ThemedText } from "@/components/themed-text"
import {
  useAddCalendar,
  validateIcalUrl,
} from "@/features/calendar-sources/data"
import {
  useImportCreateFields,
  useProtectedImportRoute,
} from "@/features/onboarding"
import { recordUnknownError } from "@/firebase"
import { Radii, Spacing, useTheme } from "@/theme"

import { ImportProgressView } from "./import-progress-view"

// The support-report context for a failed attempt. Every field is optional and
// omitted when empty — the /feedback DTO carries only what is actually known.
interface FailedIcalAttempt {
  calendarUrl: string
  schoolId?: string
  schoolName?: string
  calendarName?: string
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
// upsert chain is recorded through @/firebase recordError and surfaced as an
// accessible error with resubmission through Import. On success, the shared
// addCalendarFromUrl seam has persisted a durable user_calendars row and the
// screen hands off to the root result.
//
// It consumes its sibling data sub-barrel (@/features/calendar-sources/data),
// never its own feature barrel (B-2) and never the generated hook / firebase
// seams directly (B-1/B-4 — the data/ layer owns the generated import; the screen
// uses the @/firebase seam). Tested beside this file; the route
// (src/app/onboarding/ical-url.tsx) is a thin re-export (route-structure rule).
export default function IcalUrlScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const { addCalendarFromUrl, isPending, isError } = useAddCalendar()
  // Institution + programme come from the ephemeral journey draft, NOT from the
  // persisted school selection: a durable selection would attribute an import
  // made weeks later to a school the student is no longer importing from
  // (TIM-391 / design D3, D10). The derivation stays total during guarded
  // recovery, but no create action is reachable without current completion.
  const importFields = useImportCreateFields()
  const legal = useProtectedImportRoute("ical", "/onboarding/ical-url")
  const [url, setUrl] = useState("")
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [failedAttempt, setFailedAttempt] = useState<FailedIcalAttempt | null>(
    null,
  )
  const [submitting, setSubmitting] = useState(false)
  const activeRef = useRef(true)
  const inFlightRef = useRef(false)

  useEffect(
    () => () => {
      activeRef.current = false
    },
    [],
  )

  if (!legal) return null

  const report = () => {
    if (!failedAttempt) return
    router.push({
      pathname: "/feedback",
      params: { ...failedAttempt },
    })
  }

  const submit = () => {
    if (inFlightRef.current) return
    const validationKey = validateIcalUrl(url)
    if (validationKey !== null) {
      // Recoverable client pre-filter miss — inline, no submit, no recordError.
      setErrorKey(validationKey)
      return
    }
    setErrorKey(null)
    setFailedAttempt(null)
    const attempt: FailedIcalAttempt = {
      calendarUrl: url.trim(),
      ...(importFields.schoolId ? { schoolId: importFields.schoolId } : {}),
      ...(importFields.schoolName
        ? { schoolName: importFields.schoolName }
        : {}),
      ...(importFields.name ? { calendarName: importFields.name } : {}),
    }
    inFlightRef.current = true
    setSubmitting(true)
    void addCalendarFromUrl(url, importFields)
      .then(() => {
        if (!activeRef.current) return
        router.dismissTo("/calendar-import-result")
      })
      .catch((error: unknown) => {
        if (!activeRef.current) return
        // Genuine create / resolve / persist failure — record through the seam,
        // surface the error with Import still available. The draft and URL stay
        // untouched so the student can retry or switch to the QR route without
        // re-entering their institution and programme (design D9).
        recordUnknownError(error, "calendar-sources/ical-import")
        setFailedAttempt(attempt)
      })
      .finally(() => {
        inFlightRef.current = false
        if (activeRef.current) setSubmitting(false)
      })
  }

  if (submitting || isPending) {
    return (
      <>
        <Stack.Screen options={{ title: t("calendarSources.icalUrl.title") }} />
        <ImportProgressView message={t("calendarImport.source.importing")} />
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: t("calendarSources.icalUrl.title") }} />
      <RootPage testID="ical-url-content" lane="readable" style={styles.fill}>
        {() => (
          <KeyboardSafeActionLayout
            testID="ical-url-keyboard-layout"
            contentContainerStyle={styles.formContent}
            actionContainerStyle={styles.actionRegion}
            actions={
              <>
                {isError && (
                  <ErrorNotice
                    testID="ical-url-error"
                    {...(failedAttempt
                      ? {
                          action: {
                            testID: "ical-url-report",
                            role: "link" as const,
                            label: t("calendarSources.icalUrl.report"),
                            onPress: report,
                          },
                        }
                      : {})}
                    message={t("calendarSources.icalUrl.serverError")}
                  />
                )}
                <PrimaryAction
                  testID="ical-url-submit"
                  accessibilityLabel={t("calendarSources.icalUrl.submitLabel")}
                  label={t("calendarSources.icalUrl.submit")}
                  onPress={submit}
                  busy={isPending}
                />
              </>
            }
          >
            <PageIntro caption={t("calendarSources.icalUrl.helper")} />

            <ThemedText type="smallBold">
              {t("calendarSources.icalUrl.fieldLabel")}
            </ThemedText>
            <TextInput
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
                {
                  color: theme.text,
                  borderColor: errorKey
                    ? theme.error
                    : theme.backgroundSelected,
                },
              ]}
            />

            {errorKey !== null && <FieldError message={t(errorKey)} />}
          </KeyboardSafeActionLayout>
        )}
      </RootPage>
    </>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  formContent: {
    flexGrow: 1,
    justifyContent: "center",
    gap: Spacing.three,
  },
  actionRegion: {
    gap: Spacing.two,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Radii.medium,
    fontSize: 16,
  },
})
