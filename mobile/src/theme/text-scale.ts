import { useWindowDimensions } from "react-native"

// UIKit's accessibilityMedium (AX1) content-size multiplier, which React Native
// reports as `fontScale`; on Android it falls between system scales 1.5 and 1.8.
export const AccessibilityFontScale = 1.786

export function isAccessibilityTextSize(fontScale: number): boolean {
  return fontScale >= AccessibilityFontScale
}

export function useIsAccessibilityTextSize(): boolean {
  return isAccessibilityTextSize(useWindowDimensions().fontScale)
}
