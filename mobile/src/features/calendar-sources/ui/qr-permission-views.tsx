import { useTranslation } from "react-i18next"
import { Linking, Pressable, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

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
      <PermissionButton
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
      <PermissionButton
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
      <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
    </ThemedView>
  )
}

function PermissionButton({
  testID,
  label,
  text,
  onPress,
}: {
  testID: string
  label: string
  text: string
  onPress: () => void
}) {
  const theme = useTheme()
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={Spacing.two}
      onPress={onPress}
      style={[
        styles.cta,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.primary,
        },
      ]}
    >
      <ThemedText type="smallBold">{text}</ThemedText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    justifyContent: "center",
    gap: Spacing.three,
  },
  cta: {
    minHeight: 48,
    paddingHorizontal: Spacing.four,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: Radii.medium,
    borderWidth: 2,
  },
})
