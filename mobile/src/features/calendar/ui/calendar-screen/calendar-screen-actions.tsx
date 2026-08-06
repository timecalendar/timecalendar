import { type SFSymbol, SymbolView } from "expo-symbols"
import { useTranslation } from "react-i18next"
import { Platform, Pressable, StyleSheet, View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import { Radii, Spacing, useTheme } from "@/theme"

const HEADER_ICON_SIZE = 24

export function CalendarHeaderActions({
  onToday,
  onAdd,
}: {
  onToday: () => void
  onAdd: () => void
}) {
  const { t } = useTranslation()
  return (
    <View style={styles.headerActions}>
      <HeaderIconAction
        testID="calendar-today"
        symbol="calendar"
        label={t("calendar.todayLabel")}
        onPress={onToday}
      />
      {Platform.OS !== "android" && (
        <HeaderIconAction
          testID="calendar-add"
          symbol="plus"
          label={t("calendar.addLabel")}
          onPress={onAdd}
        />
      )}
    </View>
  )
}

function HeaderIconAction({
  testID,
  symbol,
  label,
  onPress,
}: {
  testID: string
  symbol: SFSymbol
  label: string
  onPress: () => void
}) {
  const theme = useTheme()
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      android_ripple={
        Platform.OS === "android"
          ? { color: theme.ripple, borderless: true, radius: 20 }
          : undefined
      }
      style={styles.headerAction}
    >
      <SymbolView
        name={Platform.OS === "ios" ? symbol : { android: "today" }}
        size={HEADER_ICON_SIZE}
        tintColor={theme.primary}
      />
    </Pressable>
  )
}

export function CalendarAddFab({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation()
  const theme = useTheme()
  return (
    <Pressable
      testID="calendar-fab"
      accessibilityRole="button"
      accessibilityLabel={t("calendar.addLabel")}
      onPress={onPress}
      style={[styles.fab, { backgroundColor: theme.primary }]}
    >
      <ThemedText themeColor="background" style={styles.fabGlyph}>
        {t("calendar.add")}
      </ThemedText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  headerAction: {
    minWidth: Platform.OS === "android" ? 48 : 44,
    minHeight: Platform.OS === "android" ? 48 : 44,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    position: "absolute",
    right: Spacing.three,
    bottom: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  fabGlyph: { fontSize: 30, lineHeight: 32 },
})
