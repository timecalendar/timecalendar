import {
  type BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera"
import { router } from "expo-router"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Linking, Pressable, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import {
  parseScannedSource,
  setScannedSource,
} from "@/features/calendar-sources/data"
import { recordError } from "@/firebase"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

// The QR scanner screen (Phase-3 ship 3) — PRESENTATIONAL (70% floor): drives
// the full camera-permission lifecycle (undetermined → request → granted/denied)
// and renders a QR-only CameraView when granted. It imports CameraView /
// useCameraPermissions DIRECTLY from expo-camera (no chrome wrapper — D5:
// expo-camera is a stable GA module, not an alpha API the chrome seam exists to
// localize). On a single scan it runs the pure parser (data/) and hands the
// result into the EPHEMERAL in-memory holder (data/scanned-source — ship 5 swaps
// it for the durable token store), then dismisses back to onboarding. A non-
// calendar QR is a recoverable state (re-arm, no recordError — D8); a thrown
// failure is recorded through the @/firebase seam (observability ✅).
//
// It consumes its sibling data sub-barrel (@/features/calendar-sources/data),
// never its own feature barrel (B-2) and never the camera/firebase seams beyond
// the allowed feature edges (B-1/B-4). Tested beside this file; the route
// (src/app/onboarding/qr-scan.tsx) is a thin re-export (route-structure rule).
export default function QrScanScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const [permission, requestPermission] = useCameraPermissions()
  // Single-scan debounce: once a result is handled, the ref stops further
  // onBarcodeScanned firings until the screen re-arms (a recoverable miss).
  const scannedRef = useRef(false)
  const [notACalendar, setNotACalendar] = useState(false)
  const [failed, setFailed] = useState(false)

  const handleBarcode = (result: BarcodeScanningResult) => {
    if (scannedRef.current) {
      return
    }
    scannedRef.current = true
    try {
      const source = parseScannedSource(result.data)
      if (source === null) {
        // Recoverable: not a calendar QR — re-arm, do NOT recordError (D8).
        setNotACalendar(true)
        scannedRef.current = false
        return
      }
      setScannedSource(source)
      router.back()
    } catch (error) {
      // Crash-worthy throw — record through the seam, surface an a11y failure.
      recordError(
        error instanceof Error ? error : new Error(String(error)),
        "calendar-sources/qr-scan",
      )
      setFailed(true)
    }
  }

  // Permission not yet resolved by the hook on first render.
  if (permission === null) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText
            themeColor="textSecondary"
            accessibilityLiveRegion="polite"
            accessibilityRole="text"
          >
            {t("calendarSources.qrScan.loading")}
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    )
  }

  // Denied and cannot ask again → point the user to system settings.
  if (!permission.granted && !permission.canAskAgain) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="title">
            {t("calendarSources.qrScan.title")}
          </ThemedText>
          <ThemedText
            themeColor="textSecondary"
            accessibilityLiveRegion="polite"
            accessibilityRole="text"
          >
            {t("calendarSources.qrScan.settings")}
          </ThemedText>
          <Pressable
            testID="qr-scan-open-settings"
            accessibilityRole="button"
            accessibilityLabel={t("calendarSources.qrScan.openSettingsLabel")}
            hitSlop={Spacing.two}
            onPress={() => void Linking.openSettings()}
            style={[
              styles.cta,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.primary,
              },
            ]}
          >
            <ThemedText type="smallBold">
              {t("calendarSources.qrScan.openSettings")}
            </ThemedText>
          </Pressable>
        </SafeAreaView>
      </ThemedView>
    )
  }

  // Undetermined (or askable) → explainer + grant button.
  if (!permission.granted) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="title">
            {t("calendarSources.qrScan.title")}
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            {t("calendarSources.qrScan.explainer")}
          </ThemedText>
          <Pressable
            testID="qr-scan-grant"
            accessibilityRole="button"
            accessibilityLabel={t("calendarSources.qrScan.grantLabel")}
            hitSlop={Spacing.two}
            onPress={() => void requestPermission()}
            style={[
              styles.cta,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.primary,
              },
            ]}
          >
            <ThemedText type="smallBold">
              {t("calendarSources.qrScan.grant")}
            </ThemedText>
          </Pressable>
        </SafeAreaView>
      </ThemedView>
    )
  }

  // Granted → the live QR-only camera surface with a viewfinder overlay.
  return (
    <ThemedView style={styles.container}>
      <CameraView
        testID="qr-scan-camera"
        style={styles.camera}
        // A screen-reader user can't aim a camera; the label states the purpose
        // and the inbox/DoD note owns the manual on-device pass (D6).
        accessibilityLabel={t("calendarSources.qrScan.viewfinderLabel")}
        accessibilityHint={t("calendarSources.qrScan.viewfinderHint")}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarcode}
      >
        <SafeAreaView style={styles.overlay}>
          <View
            style={[styles.viewfinder, { borderColor: theme.primary }]}
            accessibilityElementsHidden
          />
          {notACalendar && (
            <ThemedText
              themeColor="textSecondary"
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
            >
              {t("calendarSources.qrScan.notACalendar")}
            </ThemedText>
          )}
          {failed && (
            <ThemedText
              themeColor="textSecondary"
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
            >
              {t("calendarSources.qrScan.failure")}
            </ThemedText>
          )}
        </SafeAreaView>
      </CameraView>
    </ThemedView>
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
  camera: {
    flex: 1,
  },
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
