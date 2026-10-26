import { router, Stack, useFocusEffect } from "expo-router"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { AppState, FlatList, Keyboard, Platform } from "react-native"

import { ListRow, ListRowSeparator, StatusView } from "@/design"
import {
  formatTimezoneOffset,
  getTimezoneCityLabel,
  getTimezoneTerritoryLabel,
  searchTimezones,
  type TimezoneCatalogLocale,
  type TimezoneCatalogRecord,
} from "@/features/settings/data"
import {
  selectManualTimezone,
  useLastManualTimezoneRead,
  useTimezonePreferenceRead,
} from "@/features/settings/prefs"

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
  const remembered = useLastManualTimezoneRead()
  const activeSelection =
    preference.kind === "available" || preference.kind === "unavailable"
      ? preference.identifier
      : undefined
  const rememberedSelection =
    remembered.kind === "available" || remembered.kind === "unavailable"
      ? remembered.identifier
      : undefined
  const pinned = activeSelection ?? rememberedSelection
  const locale: TimezoneCatalogLocale =
    i18n.resolvedLanguage === "fr" ? "fr" : "en"
  const [query, setQuery] = useState("")
  const [now, setNow] = useState(() => new Date())
  const navigating = useRef(false)
  const bottomSearch = supportsBottomSearch()
  const results = searchTimezones(query, locale, pinned)

  useFocusEffect(() => {
    navigating.current = false
    setNow(new Date())
  })

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") setNow(new Date())
    })
    return () => subscription.remove()
  }, [])

  const select = (identifier: string) => {
    if (navigating.current || !selectManualTimezone(identifier)) return
    navigating.current = true
    router.back()
  }

  const renderItem = ({ item }: { item: TimezoneCatalogRecord }) => {
    const city = getTimezoneCityLabel(item, locale)
    const territory = getTimezoneTerritoryLabel(item, locale)
    const offset = formatTimezoneOffset(item.id, now)
    const available = offset !== undefined
    return (
      <ListRow
        label={city}
        subtitle={territory ?? item.id}
        details={territory ? [item.id] : undefined}
        value={offset ?? t("settings.timezone.unavailable")}
        accessibilityLabel={`${city}, ${territory ?? item.id}`}
        selected={item.id === activeSelection}
        disabled={!available}
        onPress={() => select(item.id)}
        testID={`timezone-result-${item.id}`}
      />
    )
  }

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
        ItemSeparatorComponent={ListRowSeparator}
        onScrollBeginDrag={Keyboard.dismiss}
        renderItem={renderItem}
        testID="timezone-results-list"
        ListEmptyComponent={
          <StatusView
            kind="empty"
            presentation="section"
            symbol={{ ios: "magnifyingglass", android: "search" }}
            title={t("settings.timezone.noResults")}
            announcementKey="noResults"
            testID="timezone-no-results"
          />
        }
      />
    </>
  )
}
