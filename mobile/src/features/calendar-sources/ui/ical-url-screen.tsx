import { router } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, TextInput, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import {
  useAddCalendar,
  validateIcalUrl,
} from "@/features/calendar-sources/data"
import { recordError } from "@/firebase"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

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
  const { addCalendarFromUrl, isPending, isError, reset } = useAddCalendar()
  const [url, setUrl] = useState("")
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const submit = () => {
    const validationKey = validateIcalUrl(url)
    if (validationKey !== null) {
      // Recoverable client pre-filter miss — inline, no submit, no recordError.
      setErrorKey(validationKey)
      return
    }
    setErrorKey(null)
    reset()
    void addCalendarFromUrl(url)
      .then(() => {
        router.back()
      })
      .catch((error: unknown) => {
        // Genuine create / resolve / persist failure — record through the seam,
        // surface the a11y error + Retry.
        recordError(
          error instanceof Error ? error : new Error(String(error)),
          "calendar-sources/ical-import",
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

        {isError && (
          <View style={styles.errorBlock}>
            <ThemedText
              themeColor="textSecondary"
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
            >
              {t("calendarSources.icalUrl.serverError")}
            </ThemedText>
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
