import { router, Stack, useFocusEffect } from "expo-router"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  AppState,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native"

import { ThemedText } from "@/components/themed-text"
import {
  formatTimezoneOffset,
  getTimezoneCityLabel,
  getTimezoneTerritoryLabel,
  isTimezoneRuntimeSupported,
  searchTimezones,
  type TimezoneCatalogLocale,
  type TimezoneCatalogRecord,
} from "@/features/settings/data"
import {
  selectManualTimezone,
  useTimezonePreferenceRead,
} from "@/features/settings/prefs"
import { Spacing, useTheme } from "@/theme"

function supportsBottomSearch(): boolean {
  return (
    Platform.OS === "ios" &&
    !Platform.isPad &&
    Number.parseInt(String(Platform.Version), 10) >= 26
  )
}

export default function TimezoneChooserScreen() {
  const { t, i18n } = useTranslation()
  const preference = useTimezonePreferenceRead()
  const selected =
    preference.kind === "available" || preference.kind === "unavailable"
      ? preference.identifier
      : undefined
  const locale: TimezoneCatalogLocale =
    i18n.resolvedLanguage === "fr" ? "fr" : "en"
  const [query, setQuery] = useState("")
  const [now, setNow] = useState(() => new Date())
  const navigating = useRef(false)
  const borderColor = useTheme().separator
  const bottomSearch = supportsBottomSearch()
  const results = useMemo(
    () => searchTimezones(query, locale, selected),
    [locale, query, selected],
  )

  useFocusEffect(
    useCallback(() => {
      navigating.current = false
      setNow(new Date())
    }, []),
  )

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") setNow(new Date())
    })
    return () => subscription.remove()
  }, [])

  const select = useCallback((identifier: string) => {
    if (navigating.current || !selectManualTimezone(identifier)) return
    navigating.current = true
    router.back()
  }, [])

  const renderItem = useCallback(
    ({ item }: { item: TimezoneCatalogRecord }) => {
      const available = isTimezoneRuntimeSupported(item.id)
      const city = getTimezoneCityLabel(item, locale)
      const territory = getTimezoneTerritoryLabel(item, locale)
      const offset = formatTimezoneOffset(item.id, now)
      const isSelected = item.id === selected
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${city}, ${territory ?? item.id}, ${offset ?? t("settings.timezone.unavailable")}`}
          accessibilityState={{ disabled: !available, selected: isSelected }}
          disabled={!available}
          onPress={() => select(item.id)}
          style={({ pressed }) => [
            styles.row,
            { borderBottomColor: borderColor },
            pressed && styles.pressed,
            !available && styles.disabled,
          ]}
          testID={`timezone-result-${item.id}`}
        >
          <View style={styles.labelColumn}>
            <ThemedText>{city}</ThemedText>
            <ThemedText type="small">{territory ?? item.id}</ThemedText>
            <ThemedText type="small">{item.id}</ThemedText>
          </View>
          <View style={styles.valueColumn}>
            {isSelected ? (
              <ThemedText type="smallBold">
                {t("settings.timezone.selected")}
              </ThemedText>
            ) : null}
            <ThemedText type="small">
              {offset ?? t("settings.timezone.unavailable")}
            </ThemedText>
          </View>
        </Pressable>
      )
    },
    [borderColor, locale, now, select, selected, t],
  )

  return (
    <>
      <Stack.Screen options={{ title: t("settings.timezone.choose") }} />
      <Stack.SearchBar
        allowToolbarIntegration={bottomSearch}
        autoCapitalize="none"
        hideWhenScrolling={false}
        onCancelButtonPress={() => setQuery("")}
        onChangeText={(event) => setQuery(event.nativeEvent.text)}
        onClose={() => setQuery("")}
        placeholder={t("settings.timezone.searchPlaceholder")}
      />
      {Platform.OS === "ios" && !bottomSearch ? (
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button
            accessibilityLabel={t("settings.close")}
            onPress={() => router.back()}
          >
            {t("settings.close")}
          </Stack.Toolbar.Button>
        </Stack.Toolbar>
      ) : null}
      {bottomSearch ? (
        <Stack.Toolbar placement="bottom">
          <Stack.Toolbar.SearchBarSlot />
          <Stack.Toolbar.Button
            accessibilityLabel={t("settings.close")}
            onPress={() => router.back()}
          >
            {t("settings.close")}
          </Stack.Toolbar.Button>
        </Stack.Toolbar>
      ) : null}
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={results}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.id}
        onScrollBeginDrag={Keyboard.dismiss}
        renderItem={renderItem}
        testID="timezone-results-list"
        ListEmptyComponent={
          <View
            accessibilityRole="summary"
            style={styles.empty}
            testID="timezone-no-results"
          >
            <ThemedText>{t("settings.timezone.noResults")}</ThemedText>
          </View>
        }
      />
    </>
  )
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  labelColumn: { flex: 1 },
  valueColumn: { alignItems: "flex-end" },
  pressed: { opacity: 0.65 },
  disabled: { opacity: 0.45 },
  empty: { padding: Spacing.four, alignItems: "center" },
})
