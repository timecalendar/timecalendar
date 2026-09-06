import { useCameraPermissions } from "expo-camera"
import { router } from "expo-router"

import { useAddCalendar } from "@/features/calendar-sources/data"
import { useImportCreateFields, useImportDraft } from "@/features/onboarding"
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
  const [permission, requestPermission] = useCameraPermissions()
  const { addCalendarFromUrl } = useAddCalendar()
  const fields = useImportCreateFields()
  const { clearDraft } = useImportDraft()
  const controller = useQrImportController({
    fields,
    addCalendarFromUrl,
    clearDraft,
    leaveJourney: leaveImportJourney,
    openManualUrl: () => router.push("/onboarding/ical-url"),
    recordError: recordUnknownError,
  })

  if (permission === null) return <QrPermissionLoadingView />
  if (!permission.granted && !permission.canAskAgain) {
    return <QrPermissionSettingsView />
  }
  if (!permission.granted) {
    return <QrPermissionRequestView requestPermission={requestPermission} />
  }

  switch (controller.phase) {
    case "scanning":
      return (
        <QrScannerView
          onBarcodeScanned={controller.handleBarcode}
          invalidPayload={controller.invalidPayload}
        />
      )
    case "importing":
      return <QrImportingView onBarcodeScanned={controller.handleBarcode} />
    case "failed":
      return (
        <QrImportFailureView
          onBarcodeScanned={controller.handleBarcode}
          retry={controller.retry}
          scanAnother={controller.scanAnother}
          enterManualUrl={controller.enterManualUrl}
        />
      )
    case "completed":
      return (
        <QrImportCompletedView onBarcodeScanned={controller.handleBarcode} />
      )
  }
}
