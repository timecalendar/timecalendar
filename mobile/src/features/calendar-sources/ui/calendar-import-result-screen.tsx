import { router } from "expo-router"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Button, RootPage, StatusView, ThemedText } from "@/design"
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
        <StatusView
          kind="error"
          presentation="screen"
          title={t("calendarImport.result.failureTitle")}
          caption={t("calendarImport.result.failureBody")}
          action={{
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

      <Button
        variant="filled"
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
