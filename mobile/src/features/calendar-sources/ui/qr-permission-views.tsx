import { useTranslation } from "react-i18next"
import { Linking, StyleSheet } from "react-native"

import { PageIntro, RootPage } from "@/components/root-page"
import { ThemedText } from "@/components/themed-text"
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
      <PageIntro caption={t("calendarSources.qrScan.explainer")} />
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
    <RootPage
      testID="qr-permission-content"
      lane="readable"
      style={styles.fill}
      contentContainerStyle={styles.safeArea}
    >
      {children}
    </RootPage>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.three,
  },
})
