import { useEffect, useState } from "react"
import { AccessibilityInfo } from "react-native"

export function useReducedMotion(): boolean | null {
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true

    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled)
    })
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    )

    return () => {
      active = false
      subscription.remove()
    }
  }, [])

  return reduceMotion
}
