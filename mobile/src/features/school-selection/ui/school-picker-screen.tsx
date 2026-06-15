import { router } from "expo-router"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FlatList, Pressable, StyleSheet, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import {
  type SchoolListItem,
  schoolMatches,
  useSchools,
} from "@/features/school-selection/data"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

// The onboarding school step (C1 / TIM-134) — PRESENTATIONAL (70% floor): the
// list over the feature's useSchools() (which wraps the generated findSchools
// hook over customFetch). It owns no data logic — render + navigation only.
// Selecting a school pushes the nested group step with its id. Loading/error/
// empty states are accessible (polite live region + status role); the error
// state offers an accessible retry → refetch. A client-side text filter narrows
// the list. Tested beside this file; the route (src/app/onboarding/index.tsx) is
// a thin re-export (route-structure rule).
export default function SchoolPickerScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const { schools, isLoading, isError, refetch } = useSchools()
  const [filter, setFilter] = useState("")

  const visible = useMemo(
    // Accent-insensitive name-or-code match through the pure data/ helper (D2).
    () => schools.filter((s) => schoolMatches(filter, s)),
    [schools, filter],
  )

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">{t("onboarding.school.title")}</ThemedText>

        <TextInput
          testID="onboarding-school-filter"
          value={filter}
          onChangeText={setFilter}
          placeholder={t("onboarding.school.search")}
          accessibilityLabel={t("onboarding.school.search")}
          style={[
            styles.filter,
            { color: theme.text, backgroundColor: theme.backgroundElement },
          ]}
          placeholderTextColor={theme.textSecondary}
        />

        {isLoading && (
          <ThemedText
            themeColor="textSecondary"
            accessibilityLiveRegion="polite"
            accessibilityRole="text"
          >
            {t("onboarding.school.loading")}
          </ThemedText>
        )}

        {isError && (
          <ThemedView style={styles.errorBlock}>
            <ThemedText
              themeColor="textSecondary"
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
            >
              {t("onboarding.school.error")}
            </ThemedText>
            <Pressable
              testID="onboarding-school-retry"
              accessibilityRole="button"
              accessibilityLabel={t("onboarding.school.retry")}
              hitSlop={Spacing.two}
              onPress={refetch}
              style={[
                styles.retry,
                { backgroundColor: theme.backgroundElement },
              ]}
            >
              <ThemedText type="smallBold">
                {t("onboarding.school.retry")}
              </ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {!isLoading && !isError && visible.length === 0 && (
          <ThemedText
            themeColor="textSecondary"
            accessibilityLiveRegion="polite"
            accessibilityRole="text"
          >
            {t("onboarding.school.empty")}
          </ThemedText>
        )}

        <FlatList
          data={visible}
          keyExtractor={(school) => school.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <SchoolRow school={item} />}
        />
      </SafeAreaView>
    </ThemedView>
  )
}

function SchoolRow({ school }: { school: SchoolListItem }) {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <Pressable
      testID={`onboarding-school-row-${school.id}`}
      accessibilityRole="button"
      // The label is exactly the school name (not "Select {name}"): iOS merges an
      // accessible Pressable's children into this label, so the name is only
      // reachable here — keeping it verbatim lets the shared Maestro flow match
      // the row by its name cross-platform. The select affordance is the hint.
      accessibilityLabel={school.name}
      accessibilityHint={t("onboarding.school.rowHint")}
      onPress={() => router.push(`/onboarding/groups?schoolId=${school.id}`)}
      style={[styles.row, { backgroundColor: theme.backgroundElement }]}
    >
      <ThemedText type="smallBold">{school.name}</ThemedText>
    </Pressable>
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
  filter: {
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.medium,
  },
  errorBlock: {
    gap: Spacing.two,
  },
  retry: {
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    justifyContent: "center",
    alignSelf: "flex-start",
    borderRadius: Radii.medium,
  },
  list: {
    gap: Spacing.two,
  },
  row: {
    minHeight: 48,
    padding: Spacing.three,
    justifyContent: "center",
    borderRadius: Radii.medium,
  },
})
