import type { Href } from "expo-router"
import { router } from "expo-router"
import { type AndroidSymbol, type SFSymbol, SymbolView } from "expo-symbols"
import { Platform, Pressable, StyleSheet, View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import { Radii, Spacing, useTheme } from "@/theme"

interface SettingsRowProps {
  href: Href
  icon: {
    ios: SFSymbol
    android: AndroidSymbol
    web: AndroidSymbol
  }
  label: string
  accessibilityLabel?: string
  hint: string
  testID: string
  secondary?: string
  first?: boolean
}

export function SettingsRow({
  href,
  icon,
  label,
  accessibilityLabel,
  hint,
  testID,
  secondary,
  first = false,
}: SettingsRowProps) {
  const theme = useTheme()
  const minimumHeight = Platform.OS === "ios" ? 44 : 48

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={hint}
      testID={testID}
      onPress={() => router.push(href)}
      android_ripple={{ color: theme.ripple, foreground: true }}
      style={({ pressed }) => [
        styles.row,
        {
          minHeight: minimumHeight,
          backgroundColor:
            Platform.OS === "ios" && pressed
              ? theme.backgroundSelected
              : theme.backgroundElement,
        },
      ]}
    >
      {!first ? (
        <View
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={[styles.separator, { backgroundColor: theme.separator }]}
        />
      ) : null}
      <View
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={[styles.icon, { backgroundColor: theme.primarySoft }]}
      >
        <SymbolView
          name={icon}
          size={20}
          tintColor={theme.primary}
          style={styles.symbol}
        />
      </View>
      <View style={styles.text}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        {secondary ? (
          <ThemedText themeColor="textSecondary" type="small">
            {secondary}
          </ThemedText>
        ) : null}
      </View>
      <View
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={styles.chevronContainer}
      >
        <SymbolView
          name={{
            ios: "chevron.right",
            android: "chevron_right",
            web: "chevron_right",
          }}
          size={16}
          tintColor={theme.textTertiary}
          style={styles.chevron}
        />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: Radii.medium,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  symbol: { width: 20, height: 20 },
  chevron: { width: 16, height: 16 },
  text: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.one,
  },
  label: {
    flexShrink: 1,
  },
  chevronContainer: { flexShrink: 0 },
  separator: {
    position: "absolute",
    top: 0,
    right: 0,
    left: Spacing.three + 32 + Spacing.three,
    height: StyleSheet.hairlineWidth,
  },
})
