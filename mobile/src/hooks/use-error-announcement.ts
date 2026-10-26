import { useEffect, useRef } from "react"
import { AccessibilityInfo, Platform } from "react-native"

type AnnouncementOptions = {
  native?: boolean
  key?: string
}

function announce(message: string | undefined, native: boolean) {
  if (!message) return
  if (Platform.OS === "ios") {
    AccessibilityInfo.announceForAccessibilityWithOptions(message, {
      queue: true,
    })
  } else if (native) {
    AccessibilityInfo.announceForAccessibility(message)
  }
}

/**
 * RN Android surfaces use a polite live region; native hosts need explicit speech.
 * With a `key`, the message is spoken on mount and when the key changes only, so
 * text that tracks input (a no-results query) is not re-spoken on every edit.
 */
export function useErrorAnnouncement(
  message: string | undefined,
  { native = false, key }: AnnouncementOptions = {},
) {
  const latest = useRef(message)

  useEffect(() => {
    latest.current = message
  }, [message])

  useEffect(() => {
    if (key === undefined) return
    announce(latest.current, native)
  }, [key, native])

  useEffect(() => {
    if (key !== undefined) return
    announce(message, native)
  }, [message, native, key])
}
