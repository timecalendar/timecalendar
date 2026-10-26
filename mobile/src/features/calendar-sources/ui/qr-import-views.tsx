import { type BarcodeScanningResult, CameraView } from "expo-camera"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import {
  AdaptiveContent,
  ErrorNotice,
  RootPage,
  StatusView,
  ThemedView,
} from "@/design"
import { Radii, Spacing, useTheme } from "@/theme"

import { ImportProgressView } from "./import-progress-view"

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
        <ErrorNotice
          testID="qr-scan-invalid-payload"
          message={t("calendarSources.qrScan.notACalendar")}
        />
      )}
    </QrCameraFrame>
  )
}

export function QrImportingView() {
  const { t } = useTranslation()
  return <ImportProgressView message={t("calendarImport.source.importing")} />
}

export function QrImportFailureView({
  retry,
  changeMethod,
}: {
  retry: () => void
  changeMethod: () => void
}) {
  const { t } = useTranslation()
  return (
    <RootPage lane="readable">
      <StatusView
        kind="error"
        presentation="screen"
        testID="qr-scan-failure"
        title={t("calendarSources.qrScan.failureTitle")}
        caption={t("calendarSources.qrScan.failure")}
        action={{
          testID: "qr-scan-retry",
          accessibilityLabel: t("calendarSources.qrScan.retryLabel"),
          label: t("calendarSources.qrScan.retry"),
          onPress: retry,
        }}
        secondaryAction={{
          testID: "qr-scan-change-method",
          label: t("calendarSources.qrScan.changeMethod"),
          onPress: changeMethod,
        }}
      />
    </RootPage>
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
})
