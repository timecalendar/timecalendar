import { type BarcodeScanningResult, CameraView } from "expo-camera"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { WriteErrorNotice } from "@/components/write-error-notice"
import { Radii, Spacing, useTheme } from "@/theme"

interface ScannerProps {
  onBarcodeScanned: (result: BarcodeScanningResult) => void
}

export function QrScannerView({
  onBarcodeScanned,
  invalidPayload,
}: ScannerProps & { invalidPayload: boolean }) {
  const { t } = useTranslation()
  return (
    <QrCameraFrame onBarcodeScanned={onBarcodeScanned}>
      {invalidPayload && (
        <ThemedText
          themeColor="textSecondary"
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {t("calendarSources.qrScan.notACalendar")}
        </ThemedText>
      )}
    </QrCameraFrame>
  )
}

export function QrImportingView(props: ScannerProps) {
  return <QrCameraFrame {...props} />
}

export function QrImportCompletedView(props: ScannerProps) {
  return <QrCameraFrame {...props} />
}

export function QrImportFailureView({
  onBarcodeScanned,
  retry,
  scanAnother,
  enterManualUrl,
}: ScannerProps & {
  retry: () => void
  scanAnother: () => void
  enterManualUrl: () => void
}) {
  const { t } = useTranslation()
  return (
    <QrCameraFrame onBarcodeScanned={onBarcodeScanned}>
      <View style={styles.recoveryActions}>
        <WriteErrorNotice message={t("calendarSources.qrScan.failure")} />
        <RecoveryButton
          testID="qr-scan-retry"
          label={t("calendarSources.qrScan.retryLabel")}
          text={t("calendarSources.qrScan.retry")}
          onPress={retry}
        />
        <RecoveryButton
          testID="qr-scan-another"
          label={t("calendarSources.qrScan.scanAnotherLabel")}
          text={t("calendarSources.qrScan.scanAnother")}
          onPress={scanAnother}
        />
        <RecoveryButton
          testID="qr-scan-manual-url"
          label={t("calendarSources.qrScan.manualUrlLabel")}
          text={t("calendarSources.qrScan.manualUrl")}
          onPress={enterManualUrl}
        />
      </View>
    </QrCameraFrame>
  )
}

function QrCameraFrame({
  onBarcodeScanned,
  children,
}: ScannerProps & { children?: React.ReactNode }) {
  const { t } = useTranslation()
  const theme = useTheme()
  return (
    <ThemedView style={styles.container}>
      <CameraView
        testID="qr-scan-camera"
        style={styles.camera}
        accessibilityLabel={t("calendarSources.qrScan.viewfinderLabel")}
        accessibilityHint={t("calendarSources.qrScan.viewfinderHint")}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={onBarcodeScanned}
      >
        <SafeAreaView style={styles.overlay}>
          <View
            style={[styles.viewfinder, { borderColor: theme.primary }]}
            accessibilityElementsHidden
          />
          {children}
        </SafeAreaView>
      </CameraView>
    </ThemedView>
  )
}

function RecoveryButton({
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
      accessibilityState={{ disabled: false }}
      disabled={false}
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
  container: { flex: 1 },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  viewfinder: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderRadius: Radii.large,
  },
  recoveryActions: {
    alignSelf: "stretch",
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
