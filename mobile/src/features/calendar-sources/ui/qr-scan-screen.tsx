import { useCameraPermissions } from "expo-camera"
import { router, Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { useAddCalendar } from "@/features/calendar-sources/data"
import {
  useImportCreateFields,
  useImportDraft,
  useProtectedImportRoute,
} from "@/features/onboarding"
import { recordUnknownError } from "@/firebase"

import { leaveImportJourney } from "./leave-import-journey"
import {
  QrImportCompletedView,
  QrImportFailureView,
  QrImportingView,
  QrScannerView,
} from "./qr-import-views"
import {
  QrPermissionLoadingView,
  QrPermissionRequestView,
  QrPermissionSettingsView,
} from "./qr-permission-views"
import { useQrImportController } from "./use-qr-import-controller"

export default function QrScanScreen() {
  const { t } = useTranslation()
  const [permission, requestPermission] = useCameraPermissions()
  const { addCalendarFromUrl } = useAddCalendar()
  const fields = useImportCreateFields()
  const { clearDraft, dispatch } = useImportDraft()
  const legal = useProtectedImportRoute("qr", "/onboarding/qr-scan")
  const controller = useQrImportController({
    fields,
    addCalendarFromUrl,
    clearDraft,
    leaveJourney: leaveImportJourney,
    openManualUrl: () => {
      dispatch({ type: "set-manual-handoff", target: "ical" })
      router.push("/onboarding/ical-url")
    },
    recordError: recordUnknownError,
  })

  if (!legal) return null

  let content: React.ReactNode
  if (permission === null) content = <QrPermissionLoadingView />
  else if (!permission.granted && !permission.canAskAgain)
    content = <QrPermissionSettingsView />
  else if (!permission.granted)
    content = <QrPermissionRequestView requestPermission={requestPermission} />
  else
    switch (controller.phase) {
      case "scanning":
        content = (
          <QrScannerView
            onBarcodeScanned={controller.handleBarcode}
            invalidPayload={controller.invalidPayload}
          />
        )
        break
      case "importing":
        content = (
          <QrImportingView onBarcodeScanned={controller.handleBarcode} />
        )
        break
      case "failed":
        content = (
          <QrImportFailureView
            onBarcodeScanned={controller.handleBarcode}
            retry={controller.retry}
            scanAnother={controller.scanAnother}
            enterManualUrl={controller.enterManualUrl}
          />
        )
        break
      case "completed":
        content = (
          <QrImportCompletedView onBarcodeScanned={controller.handleBarcode} />
        )
        break
    }
  return (
    <>
      <Stack.Screen options={{ title: t("calendarSources.qrScan.title") }} />
      {content}
    </>
  )
}
