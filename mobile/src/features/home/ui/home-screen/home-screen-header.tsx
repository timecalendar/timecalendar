import { Image } from "expo-image"
import { SymbolView } from "expo-symbols"
import { useTranslation } from "react-i18next"
import { Platform, Pressable, StyleSheet, View } from "react-native"

import { GlassSurface } from "@/components/chrome"
import { ThemedText } from "@/components/themed-text"
import { Radii, Spacing, useTheme } from "@/theme"

export function HomeScreenHeader({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation()
  const theme = useTheme()
  return (
    <View style={styles.header}>
      <View style={styles.brandLockup}>
        <Image
          source={require("@/assets/brand/logo.png")}
          style={styles.logo}
          accessibilityElementsHidden
        />
        <ThemedText style={styles.appName} numberOfLines={2}>
          {t("app.name")}
        </ThemedText>
      </View>
      {Platform.OS === "ios" && (
        <GlassSurface
          glassEffectStyle="regular"
          isInteractive
          style={styles.headerActionGlass}
        >
          <Pressable
            testID="home-add-personal-event"
            accessibilityRole="button"
            accessibilityLabel={t("home.addPersonalEvent")}
            onPress={onAdd}
            style={styles.headerAction}
          >
            <SymbolView name="plus" size={24} tintColor={theme.text} />
          </Pressable>
        </GlassSurface>
      )}
    </View>
  )
}

export function HomeAddFab({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation()
  const theme = useTheme()
  return (
    <Pressable
      testID="home-add-personal-event"
      accessibilityRole="button"
      accessibilityLabel={t("home.addPersonalEvent")}
      onPress={onPress}
      android_ripple={{ color: theme.ripple, borderless: true, radius: 28 }}
      style={[styles.fab, { backgroundColor: theme.primary }]}
    >
      <SymbolView
        name={{ android: "add" }}
        size={26}
        tintColor={theme.background}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  header: {
    minHeight: 56,
    paddingHorizontal: Spacing.four,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandLockup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  logo: { width: 30, height: 30 },
  appName: { fontSize: 21, lineHeight: 28, fontWeight: "700" },
  headerActionGlass: {
    width: 44,
    height: 44,
    borderRadius: Radii.pill,
    overflow: "hidden",
  },
  headerAction: {
    flex: 1,
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
    elevation: 6,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    overflow: "hidden",
  },
})
