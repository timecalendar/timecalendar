/* eslint-disable i18next/no-literal-string -- TODO(i18n-step-6): template screen, strings localized or deleted when i18n lands */
import { ScrollView, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { useSchoolControllerFindSchools } from "@/api/generated/schools/schools"
import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { MaxContentWidth, Spacing } from "@/constants/theme"

// The first real consumer of the generated Orval client + mounted QueryClient.
// Template-quality round-trip surface for the test harness (deep-linked at
// `timecalendar-dev://schools`); dies when real onboarding lands.
export default function SchoolsScreen() {
  const { data, isLoading, isError } = useSchoolControllerFindSchools()

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Schools</ThemedText>

        {isLoading && (
          <ThemedText themeColor="textSecondary">Loading schools…</ThemedText>
        )}
        {isError && (
          <ThemedText themeColor="textSecondary">
            Could not load schools.
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
