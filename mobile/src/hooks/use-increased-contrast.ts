import { useEffect, useState } from "react"
import { AccessibilityInfo, Platform } from "react-native"

/** Android's high-text-contrast setting; iOS has no supported signal. */
export function useIncreasedContrast(platform: string = Platform.OS): boolean {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (platform !== "android") return
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
  }, [platform])

  return enabled
}
