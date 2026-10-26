import { router, Stack } from "expo-router"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  Button,
  ErrorNotice,
  KeyboardSafeActionLayout,
  PageIntro,
  RootPage,
  TextField,
} from "@/design"
import {
  useAddCalendar,
  validateIcalUrl,
} from "@/features/calendar-sources/data"
import {
  useImportCreateFields,
  useProtectedImportRoute,
} from "@/features/onboarding"
import { recordUnknownError } from "@/firebase"

import { ImportProgressView } from "./import-progress-view"

// The support-report context for a failed attempt. Every field is optional and
// omitted when empty — the /feedback DTO carries only what is actually known.
interface FailedIcalAttempt {
  calendarUrl: string
  schoolId?: string
  schoolName?: string
  calendarName?: string
}

// The URL is posted to the server (POST /calendars), not parsed as .ics on the
// client, for Flutter parity.
//
// Two failure classes: an invalid URL (the client pre-filter returns a key) is
// recoverable and shown inline without being recorded, to keep the crash log
// free of typos; a failure of the create / token-resolve / durable upsert chain
// is recorded through @/firebase and surfaced with resubmission through Import.
export default function IcalUrlScreen() {
  const { t } = useTranslation()
  const { addCalendarFromUrl, isPending, isError } = useAddCalendar()
  // Institution + programme come from the ephemeral journey draft, not from the
  // persisted school selection: a durable selection would attribute an import
  // made weeks later to a school the student is no longer importing from. The
  // derivation stays total during guarded recovery, but no create action is
  // reachable without current completion.
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
      <RootPage testID="ical-url-content" lane="readable">
        {() => (
          <KeyboardSafeActionLayout
            contentPlacement="center"
            testID="ical-url-keyboard-layout"
            actions={
              <>
                {isError && (
                  <ErrorNotice
                    testID="ical-url-error"
                    {...(failedAttempt
                      ? {
                          action: {
                            testID: "ical-url-report",
                            accessibilityRole: "link" as const,
                            label: t("calendarSources.icalUrl.report"),
                            onPress: report,
                          },
                        }
                      : {})}
                    message={t("calendarSources.icalUrl.serverError")}
                  />
                )}
                <Button
                  variant="filled"
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

            <TextField
              testID="ical-url-input"
              label={t("calendarSources.icalUrl.fieldLabel")}
              error={errorKey && t(errorKey)}
              placeholder={t("calendarSources.icalUrl.placeholder")}
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
              textContentType="URL"
              disabled={isPending}
            />
          </KeyboardSafeActionLayout>
        )}
      </RootPage>
    </>
  )
}
