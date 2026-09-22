import { useEffect, useState } from "react"
import { AccessibilityInfo, Platform } from "react-native"

/** Calendar-owned mapping of Android's supported high-text-contrast signal. */
export function useCalendarIncreasedContrast(): boolean {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (Platform.OS !== "android") return
    let active = true
    void AccessibilityInfo.isHighTextContrastEnabled()
      .then((value) => {
        if (active) setEnabled(value)
      })
      .catch(() => {
        if (active) setEnabled(false)
      })
    const subscription = AccessibilityInfo.addEventListener(
      "highTextContrastChanged",
      setEnabled,
    )
    return () => {
      active = false
      subscription.remove()
    }
  }, [])

  return enabled
}
