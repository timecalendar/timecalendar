import { useTranslation } from "react-i18next"
import { Linking, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { AdaptiveContent } from "@/components/adaptive-content"
import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { Spacing } from "@/theme"

import { QrActionButton } from "./qr-action-button"

export function QrPermissionLoadingView() {
  const { t } = useTranslation()
  return (
    <PermissionFrame>
      <ThemedText
        themeColor="textSecondary"
        accessibilityLiveRegion="polite"
        accessibilityRole="text"
      >
        {t("calendarSources.qrScan.loading")}
      </ThemedText>
    </PermissionFrame>
  )
}

export function QrPermissionRequestView({
  requestPermission,
}: {
  requestPermission: () => Promise<unknown>
}) {
  const { t } = useTranslation()
  return (
    <PermissionFrame>
      <ThemedText type="title">{t("calendarSources.qrScan.title")}</ThemedText>
      <ThemedText themeColor="textSecondary">
        {t("calendarSources.qrScan.explainer")}
      </ThemedText>
      <QrActionButton
        testID="qr-scan-grant"
        label={t("calendarSources.qrScan.grantLabel")}
        text={t("calendarSources.qrScan.grant")}
        onPress={() => void requestPermission()}
      />
    </PermissionFrame>
  )
}

export function QrPermissionSettingsView() {
  const { t } = useTranslation()
  return (
    <PermissionFrame>
      <ThemedText type="title">{t("calendarSources.qrScan.title")}</ThemedText>
      <ThemedText
        themeColor="textSecondary"
        accessibilityLiveRegion="polite"
        accessibilityRole="text"
      >
        {t("calendarSources.qrScan.settings")}
      </ThemedText>
      <QrActionButton
        testID="qr-scan-open-settings"
        label={t("calendarSources.qrScan.openSettingsLabel")}
        text={t("calendarSources.qrScan.openSettings")}
        onPress={() => void Linking.openSettings()}
      />
    </PermissionFrame>
  )
}

function PermissionFrame({ children }: { children: React.ReactNode }) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeAreaOwner}>
        <AdaptiveContent
          testID="qr-permission-content"
          lane="readable"
          style={styles.adaptiveOwner}
          contentContainerStyle={styles.safeArea}
        >
          {children}
        </AdaptiveContent>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeAreaOwner: {
    flex: 1,
  },
  adaptiveOwner: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Spacing.four,
    justifyContent: "center",
    gap: Spacing.three,
  },
})
