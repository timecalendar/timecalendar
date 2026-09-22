import { router } from "expo-router"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, View } from "react-native"

import { ErrorState } from "@/components/error-surfaces"
import { PrimaryAction } from "@/components/primary-action"
import { RootPage } from "@/components/root-page"
import { ThemedText } from "@/components/themed-text"
import { Spacing } from "@/theme"

import { ImportProgressView } from "./import-progress-view"
import { useCalendarImportResult } from "./use-calendar-import-result"

export default function CalendarImportResultScreen() {
  const { t } = useTranslation()
  const { phase, retry } = useCalendarImportResult()
  const openCalendar = () => router.dismissTo("/calendar")

  if (phase === "loading") {
    return (
      <ImportProgressView
        testID="calendar-import-result-loading"
        message={t("calendarImport.result.loading")}
      />
    )
  }

  if (phase === "failed")
    return (
      <RootPage testID="calendar-import-result" lane="readable">
        <ScrollView contentContainerStyle={styles.content}>
          <ErrorState
            title={t("calendarImport.result.failureTitle")}
            message={t("calendarImport.result.failureBody")}
            primaryAction={{
              testID: "calendar-import-result-retry",
              label: t("calendarImport.action.retry"),
              onPress: retry,
            }}
            secondaryAction={{
              testID: "calendar-import-result-continue",
              label: t("calendarImport.action.continue"),
              onPress: openCalendar,
            }}
          />
        </ScrollView>
      </RootPage>
    )

  return (
    <RootPage
      testID="calendar-import-result"
      lane="readable"
      contentContainerStyle={styles.content}
    >
      <View
        accessibilityRole="text"
        accessibilityLiveRegion="polite"
        style={styles.message}
      >
        <ThemedText type="subtitle">
          {t("calendarImport.result.successTitle")}
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          {t("calendarImport.result.successBody")}
        </ThemedText>
      </View>

      <PrimaryAction
        testID="calendar-import-result-calendar"
        label={t("calendarImport.action.viewCalendar")}
        onPress={openCalendar}
      />
    </RootPage>
  )
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.five,
  },
  message: { gap: Spacing.two },
})
