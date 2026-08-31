import { router } from "expo-router"

import { setOnboardingResolution } from "@/features/first-launch"

// What a SUCCESSFUL import does with the navigation stack (TIM-391 / design D9),
// shared by the QR and iCal-URL screens.
//
// `router.back()` alone is wrong once the journey exists: from inside it the
// student would land back on the manual-import step, being asked to import a
// calendar they just imported, holding a draft that is already spent. Dismissing
// the whole onboarding Stack is the correct exit.
//
// The guard is the point. These two routes stay directly deep-linkable with no
// journey in front of them (dev links, external links, restored navigation), and
// `dismissAll()` on a stack with a single entry throws. `canDismiss()` false ⇒
// there is no journey to leave ⇒ fall back to the pre-journey behaviour.
export function leaveImportJourney(clearDraft: () => void): void {
  setOnboardingResolution("calendarImported")
  clearDraft()
  if (router.canDismiss()) {
    router.dismissAll()
    return
  }
  router.replace("/calendar")
}
