import {
  GlassView,
  type GlassViewProps,
  isLiquidGlassAvailable,
} from "expo-glass-effect"
import { View } from "react-native"

// The single import site for `expo-glass-effect` (alpha, iOS-26-only Liquid
// Glass). The lint boundary forbids importing it outside src/components/chrome/.
//
// This wrapper centralizes the degradation decision in ONE place, mirroring the
// prose baseline under the Architecture Book's Minimum OS floors:
//   iOS 26+                         → Liquid Glass (GlassView)
//   iOS 16.4–25, Android, web, Jest → a plain View rendering the same children
// Consumers request a glass surface without branching on platform or OS version;
// `isLiquidGlassAvailable()` is itself alpha, so it lives here too.

export function GlassSurface(props: GlassViewProps) {
  if (isLiquidGlassAvailable()) {
    return <GlassView {...props} />
  }

  // Drop the glass-only props (ignoreRestSiblings keeps these unused names
  // clean); everything else (style, children, …) is a plain View.
  const { glassEffectStyle, tintColor, isInteractive, colorScheme, ...rest } =
    props

  return <View {...rest} />
}
