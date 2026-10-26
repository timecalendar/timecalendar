import { router, Stack, useLocalSearchParams } from "expo-router"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  FlatList,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from "react-native"

import {
  Button,
  ErrorNotice,
  PageIntro,
  RootPage,
  type StatusAction,
  StatusView,
  ThemedView,
} from "@/design"
import { schoolMatches, useSchools } from "@/features/school-selection/data"
import { Spacing, useTheme } from "@/theme"

import { RowSeparator } from "./row-separator"
import { SchoolRow } from "./school-row"

function useMissingSchoolAction(): StatusAction {
  const { t } = useTranslation()
  return {
    testID: "onboarding-school-missing",
    label: t("onboarding.school.missing"),
    accessibilityHint: t("onboarding.school.missingHint"),
    // The unlisted-institution step (TIM-391): jumping straight to the URL
    // route used to drop the institution entirely, so an unlisted import
    // reached support with no way to place it.
    onPress: () => router.push("/onboarding/institution-name"),
  }
}

// Onboarding school step (TIM-134): presentational list over useSchools() —
// native-header chrome, client-side search filter, and centered a11y states.
export default function SchoolPickerScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const { source } = useLocalSearchParams<{ source?: string }>()
  const fromCalendarManagement = source === "calendar-management"
  const { height: windowHeight } = useWindowDimensions()
  const { schools, isLoading, isError, refetch } = useSchools()
  const [filter, setFilter] = useState("")
  const missingSchool = useMissingSchoolAction()

  const visible = useMemo(
    // Accent-insensitive name/code match.
    () => schools.filter((s) => schoolMatches(filter, s)),
    [schools, filter],
  )

  const searching = filter.trim().length > 0
  const browsing = !isLoading && schools.length > 0 && !searching

  return (
    <>
      <Stack.Screen
        options={{
          title: t("onboarding.school.title"),
          // UIKit gives a nested stack's first screen no back button; Android's
          // native one already walks up to the parent stack.
          ...(fromCalendarManagement &&
            Platform.OS === "ios" && {
              unstable_headerLeftItems: () => [
                {
                  type: "button" as const,
                  label: t("common.back"),
                  accessibilityLabel: t("common.back"),
                  icon: {
                    type: "sfSymbol" as const,
                    name: "chevron.backward" as const,
                  },
                  identifier: "onboarding-school-back",
                  onPress: () => router.dismiss(),
                },
              ],
            }),
          headerSearchBarOptions: {
            placeholder: t("onboarding.school.search"),
            onChangeText: (e) => setFilter(e.nativeEvent.text),
            onCancelButtonPress: () => setFilter(""),
            onClose: () => setFilter(""),
            autoCapitalize: "none",
            // Default placement; "stacked" overlaps the large title on iOS 26.
            hideWhenScrolling: false,
            textColor: theme.text,
            hintTextColor: theme.textSecondary,
            headerIconColor: theme.text,
          },
        }}
      />
      <RootPage
        scrollsUnderHeader
        testID="onboarding-school-content"
        lane="fullBleed"
      >
        {(schoolListLayout) => (
          <FlatList
            data={visible}
            keyExtractor={(school) => school.id}
            renderItem={({ item }) => <SchoolRow school={item} />}
            ItemSeparatorComponent={Platform.OS === "ios" ? RowSeparator : null}
            contentInsetAdjustmentBehavior="automatic"
            // No automaticallyAdjustKeyboardInsets: it sticks content under the
            // header after the keyboard hides (RN #47731).
            alwaysBounceVertical
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              schoolListLayout.laneStyle,
              styles.list,
              // Upper-third so the open search keyboard never covers the status.
              visible.length === 0 && { paddingTop: windowHeight * 0.15 },
            ]}
            ListHeaderComponent={
              <>
                {isError && schools.length > 0 ? (
                  <ErrorNotice
                    compact
                    testID="onboarding-school-cached-error"
                    message={t("onboarding.school.error")}
                    action={{
                      label: t("onboarding.school.retry"),
                      testID: "onboarding-school-retry",
                      onPress: refetch,
                    }}
                  />
                ) : null}
                {browsing ? (
                  <PageIntro
                    caption={t("onboarding.school.subtitle")}
                    style={styles.listHeader}
                  />
                ) : null}
              </>
            }
            ListFooterComponent={
              browsing ? (
                <ThemedView style={styles.listFooter}>
                  <Button variant="text" size="small" {...missingSchool} />
                </ThemedView>
              ) : null
            }
            ListEmptyComponent={
              isLoading ? (
                <StatusView
                  kind="loading"
                  presentation="section"
                  title={t("onboarding.school.loading")}
                />
              ) : isError && schools.length === 0 ? (
                <StatusView
                  kind="error"
                  presentation="section"
                  testID="onboarding-school-error"
                  title={t("errors.loadTitle")}
                  caption={t("onboarding.school.error")}
                  action={{
                    label: t("onboarding.school.retry"),
                    testID: "onboarding-school-retry",
                    onPress: refetch,
                  }}
                />
              ) : searching ? (
                <StatusView
                  kind="empty"
                  presentation="section"
                  testID="onboarding-school-no-results"
                  symbol={{ ios: "magnifyingglass", android: "search" }}
                  title={t("onboarding.school.noResults", {
                    query: filter.trim(),
                  })}
                  announcementKey="noResults"
                  secondaryAction={missingSchool}
                />
              ) : (
                <StatusView
                  kind="empty"
                  presentation="section"
                  symbol={{ ios: "graduationcap", android: "school" }}
                  title={t("onboarding.school.empty")}
                  announcementKey="empty"
                  secondaryAction={missingSchool}
                />
              )
            }
          />
        )}
      </RootPage>
    </>
  )
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: Spacing.three,
  },
  listHeader: {
    width: "100%",
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  listFooter: {
    width: "100%",
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
})
