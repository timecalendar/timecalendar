import { SymbolView } from "expo-symbols"
import { useTranslation } from "react-i18next"
import { Platform, ScrollView, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import type { ChangelogRelease } from "@/features/changelog/data"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

interface ChangelogContentProps {
  readonly releases: readonly ChangelogRelease[]
  readonly footer?: React.ReactNode
}

export function ChangelogContent({ releases, footer }: ChangelogContentProps) {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      testID="changelog-safe-area"
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={{ backgroundColor: theme.background }}
      >
        <View style={styles.content}>
          {releases.map((release) => (
            <View
              key={release.version}
              style={styles.release}
              testID={`changelog-release-${release.version}`}
            >
              <ThemedText type="subtitle">
                {t("changelog.versionHeading", { version: release.label })}
              </ThemedText>
              <View style={styles.items}>
                {release.items.map((item) => (
                  <View
                    key={item.titleKey}
                    style={[
                      styles.item,
                      { backgroundColor: theme.backgroundElement },
                    ]}
                  >
                    <View
                      accessible={false}
                      importantForAccessibility="no-hide-descendants"
                      style={[
                        styles.icon,
                        { backgroundColor: theme.primarySoft },
                      ]}
                    >
                      <SymbolView
                        name={item.icon}
                        tintColor={theme.primary}
                        style={styles.symbol}
                      />
                    </View>
                    <View style={styles.copy}>
                      <ThemedText style={styles.itemTitle}>
                        {t(item.titleKey)}
                      </ThemedText>
                      <ThemedText themeColor="textSecondary">
                        {t(item.subtitleKey)}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
          {footer}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: Platform.OS === "ios" ? Spacing.three : Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
  },
  content: { width: "100%", maxWidth: MaxContentWidth, gap: Spacing.four },
  release: { gap: Spacing.three },
  items: { gap: Spacing.two },
  item: {
    minHeight: Platform.OS === "ios" ? 72 : 76,
    borderRadius: Radii.large,
    padding: Spacing.three,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: Radii.medium,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  symbol: { width: 24, height: 24 },
  copy: { flex: 1, minWidth: 0, gap: Spacing.one },
  itemTitle: { fontWeight: "700" },
})
