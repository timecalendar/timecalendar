import { router, Stack, useLocalSearchParams } from "expo-router"
import { SymbolView } from "expo-symbols"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { schoolMatches, useSchools } from "@/features/school-selection/data"
import { MaxContentWidth, Spacing, useTheme } from "@/theme"

import { ListStatus } from "./list-status"
import { RowSeparator } from "./row-separator"
import { SchoolRow } from "./school-row"
import { StatusSymbol } from "./status-symbol"

function MissingSchoolAction() {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <Pressable
      testID="onboarding-school-missing"
      accessibilityRole="button"
      accessibilityLabel={t("onboarding.school.missing")}
      accessibilityHint={t("onboarding.school.missingHint")}
      onPress={() => router.push("/onboarding/ical-url")}
      android_ripple={{ color: theme.ripple }}
      style={({ pressed }) => [
        styles.missingSchool,
        Platform.OS === "ios" &&
          pressed && { backgroundColor: theme.backgroundSelected },
      ]}
    >
      <ThemedText type="small" themeColor="actionText">
        {t("onboarding.school.missing")}
      </ThemedText>
    </Pressable>
  )
}

// Onboarding school step (TIM-134): presentational list over useSchools() —
// native-header chrome, client-side search filter, and centered a11y states.
export default function SchoolPickerScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { source } = useLocalSearchParams<{ source?: string }>()
  const fromCalendarManagement =
    source === "calendar-management" || source === "stale-recovery"
  const { height: windowHeight } = useWindowDimensions()
  const { schools, isLoading, isError, refetch } = useSchools()
  const [filter, setFilter] = useState("")

  const visible = useMemo(
    // Accent-insensitive name/code match.
    () => schools.filter((s) => schoolMatches(filter, s)),
    [schools, filter],
  )

  const searching = filter.trim().length > 0
  const browsing = !isLoading && !isError && schools.length > 0 && !searching

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t("onboarding.school.title"),
          headerTitle: "",
          headerBackButtonDisplayMode: "minimal",
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
                  tintColor: theme.text,
                  identifier: "onboarding-school-back",
                  onPress: () => router.dismiss(),
                },
              ],
            }),
          ...(fromCalendarManagement &&
            Platform.OS === "android" && {
              headerLeft: () => (
                <Pressable
                  testID="onboarding-school-back"
                  accessibilityRole="button"
                  accessibilityLabel={t("common.back")}
                  hitSlop={Spacing.two}
                  onPress={() => router.dismiss()}
                  style={styles.headerBack}
                >
                  <SymbolView
                    name="chevron.backward"
                    size={22}
                    weight="semibold"
                    tintColor={theme.text}
                  />
                </Pressable>
              ),
            }),
          headerStyle: { backgroundColor: theme.background },
          headerShadowVisible: false,
          headerSearchBarOptions: {
            placeholder: t("onboarding.school.search"),
            onChangeText: (e) => setFilter(e.nativeEvent.text),
            onCancelButtonPress: () => setFilter(""),
            onClose: () => setFilter(""),
            autoCapitalize: "none",
            // Default placement; "stacked" overlaps the large title on iOS 26.
            hideWhenScrolling: false,
            tintColor: theme.primary,
            textColor: theme.text,
            hintTextColor: theme.textSecondary,
            headerIconColor: theme.text,
          },
        }}
      />
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
          styles.list,
          {
            paddingBottom:
              Spacing.three + (Platform.OS === "android" ? insets.bottom : 0),
          },
          // Upper-third so the open search keyboard never covers the status.
          visible.length === 0 && { paddingTop: windowHeight * 0.15 },
        ]}
        ListHeaderComponent={
          browsing ? (
            <ThemedView style={styles.listHeader}>
              <ThemedText type="subtitle">
                {t("onboarding.school.title")}
              </ThemedText>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.subtitle}
              >
                {t("onboarding.school.subtitle")}
              </ThemedText>
            </ThemedView>
          ) : null
        }
        ListFooterComponent={
          browsing ? (
            <ThemedView style={styles.listFooter}>
              <MissingSchoolAction />
            </ThemedView>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? (
            <ListStatus
              media={<ActivityIndicator />}
              message={t("onboarding.school.loading")}
              announceKey="loading"
            />
          ) : isError ? (
            <ListStatus
              media={<StatusSymbol name="wifi.exclamationmark" />}
              message={t("onboarding.school.error")}
              announceKey="error"
              alert
            >
              <Pressable
                testID="onboarding-school-retry"
                accessibilityRole="button"
                accessibilityLabel={t("onboarding.school.retry")}
                hitSlop={Spacing.two}
                onPress={refetch}
                style={styles.retry}
              >
                <ThemedText type="smallBold" themeColor="primary">
                  {t("onboarding.school.retry")}
                </ThemedText>
              </Pressable>
            </ListStatus>
          ) : searching ? (
            <ListStatus
              media={<StatusSymbol name="magnifyingglass" />}
              message={t("onboarding.school.noResults", {
                query: filter.trim(),
              })}
              announceKey="noResults"
            >
              <MissingSchoolAction />
            </ListStatus>
          ) : (
            <ListStatus
              media={<StatusSymbol name="graduationcap" />}
              message={t("onboarding.school.empty")}
              announceKey="empty"
            >
              <MissingSchoolAction />
            </ListStatus>
          )
        }
      />
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingTop: Spacing.two,
  },
  headerBack: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  subtitle: {
    fontWeight: "400",
  },
  listHeader: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  listFooter: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  missingSchool: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  retry: {
    minHeight: 48,
    minWidth: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.three,
  },
})
