import { router } from "expo-router"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, View } from "react-native"

import { PrimaryAction } from "@/components/primary-action"
import { RootPage } from "@/components/root-page"
import { ThemedText } from "@/components/themed-text"
import { Radii, Spacing, useTheme } from "@/theme"

import { ImportProgressView } from "./import-progress-view"
import { useCalendarImportResult } from "./use-calendar-import-result"

export default function CalendarImportResultScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
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

  return (
    <RootPage
      testID="calendar-import-result"
      lane="readable"
      contentContainerStyle={styles.content}
    >
      <View
        accessibilityRole={phase === "failed" ? "alert" : "text"}
        accessibilityLiveRegion={phase === "failed" ? "assertive" : "polite"}
        style={styles.message}
      >
        <ThemedText type="subtitle">
          {t(
            phase === "failed"
              ? "calendarImport.result.failureTitle"
              : "calendarImport.result.successTitle",
          )}
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          {t(
            phase === "failed"
              ? "calendarImport.result.failureBody"
              : "calendarImport.result.successBody",
          )}
        </ThemedText>
      </View>

      {phase === "failed" ? (
        <>
          <PrimaryAction
            testID="calendar-import-result-retry"
            label={t("calendarImport.action.retry")}
            onPress={retry}
          />
          <Pressable
            testID="calendar-import-result-continue"
            accessibilityRole="button"
            accessibilityLabel={t("calendarImport.action.continue")}
            onPress={openCalendar}
            style={[
              styles.secondary,
              { borderColor: theme.primary, backgroundColor: theme.background },
            ]}
          >
            <ThemedText type="smallBold">
              {t("calendarImport.action.continue")}
            </ThemedText>
          </Pressable>
        </>
      ) : (
        <PrimaryAction
          testID="calendar-import-result-calendar"
          label={t("calendarImport.action.viewCalendar")}
          onPress={openCalendar}
        />
      )}
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
  secondary: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radii.medium,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.three,
  },
})
