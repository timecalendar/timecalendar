import { useEffect, useState } from "react"
import { AccessibilityInfo } from "react-native"

export function useReducedMotion(): boolean | null {
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    let changed = false
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active && !changed) setReduceMotion(enabled)
      })
      .catch(() => {
        if (active && !changed) setReduceMotion(true)
      })
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => {
        changed = true
        if (active) setReduceMotion(enabled)
      },
    )
    return () => {
      active = false
      subscription.remove()
    }
  }, [])

  return reduceMotion
}
