import { type BarcodeScanningResult, CameraView } from "expo-camera"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { AdaptiveContent } from "@/components/adaptive-content"
import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { WriteErrorNotice } from "@/components/write-error-notice"
import { Radii, Spacing, useTheme } from "@/theme"

import { QrActionButton } from "./qr-action-button"

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
        <QrActionButton
          testID="qr-scan-retry"
          label={t("calendarSources.qrScan.retryLabel")}
          text={t("calendarSources.qrScan.retry")}
          onPress={retry}
          disabled={false}
        />
        <QrActionButton
          testID="qr-scan-another"
          label={t("calendarSources.qrScan.scanAnotherLabel")}
          text={t("calendarSources.qrScan.scanAnother")}
          onPress={scanAnother}
          disabled={false}
        />
        <QrActionButton
          testID="qr-scan-manual-url"
          label={t("calendarSources.qrScan.manualUrlLabel")}
          text={t("calendarSources.qrScan.manualUrl")}
          onPress={enterManualUrl}
          disabled={false}
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
          <AdaptiveContent
            testID="qr-overlay-content"
            lane="readable"
            contentContainerStyle={styles.overlayLane}
          >
            <View
              style={[styles.viewfinder, { borderColor: theme.primary }]}
              accessibilityElementsHidden
            />
            {children}
          </AdaptiveContent>
        </SafeAreaView>
      </CameraView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayLane: {
    alignItems: "center",
    gap: Spacing.three,
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
})
