import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { useSchoolControllerFindSchools } from "@/api/generated/schools/schools"
import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { MaxContentWidth, Spacing } from "@/theme"

// The first real consumer of the generated Orval client + mounted QueryClient.
// Template-quality round-trip surface for the test harness (deep-linked at
// `timecalendar-dev://schools` via the thin src/app/schools.tsx route); dies
// when real onboarding lands. Lives outside src/app/ so it is testable: Expo
// Router bundles every file under src/app/ as a route, and the lint boundary
// forbids importing routes from elsewhere.
export default function SchoolsScreen() {
  const { t } = useTranslation()
  const { data, isLoading, isError } = useSchoolControllerFindSchools()

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">{t("schools.title")}</ThemedText>

        {isLoading && (
          <ThemedText
            themeColor="textSecondary"
            accessibilityLiveRegion="polite"
            accessibilityRole="text"
          >
            {t("schools.loading")}
          </ThemedText>
        )}
        {isError && (
          <ThemedText
            themeColor="textSecondary"
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            {t("schools.error")}
          </ThemedText>
        )}

        {data && (
          <ScrollView contentContainerStyle={styles.list}>
            {data.schools.map((school) => (
              <ThemedText key={school.id}>{school.name}</ThemedText>
            ))}
          </ScrollView>
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
    gap: Spacing.three,
  },
  list: {
    gap: Spacing.two,
  },
})
