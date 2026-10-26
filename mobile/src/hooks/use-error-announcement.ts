import { useEffect } from "react"
import { AccessibilityInfo, Platform } from "react-native"

/** RN Android surfaces use a polite live region; native hosts need explicit speech. */
export function useErrorAnnouncement(
  message: string | undefined,
  { native = false }: { native?: boolean } = {},
) {
  useEffect(() => {
    if (!message) return
    if (Platform.OS === "ios") {
      AccessibilityInfo.announceForAccessibilityWithOptions(message, {
        queue: true,
      })
    } else if (native) {
      AccessibilityInfo.announceForAccessibility(message)
    }
  }, [message, native])
}
