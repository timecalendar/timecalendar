import { Image } from "expo-image"
import { useTranslation } from "react-i18next"
import { Platform, Pressable, StyleSheet, View } from "react-native"

import { GlassSurface } from "@/components/chrome"
import { Icon } from "@/components/icon"
import { ThemedText } from "@/components/themed-text"
import { Radii, Spacing, useTheme, WordmarkMaxFontScale } from "@/theme"

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
        <ThemedText
          type="title2"
          numberOfLines={1}
          maxFontSizeMultiplier={WordmarkMaxFontScale}
          style={styles.appName}
        >
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
            <Icon ios="plus" size={24} color={theme.text} scaling="fixed" />
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
      <Icon android="add" size={26} color={theme.background} scaling="fixed" />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  header: {
    minHeight: 56,
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
  appName: { flexShrink: 1 },
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
