import { StyleSheet } from "react-native"

import { Spacing } from "@/theme"

// The shared frame of the Connect and manual-import steps, which are seen back
// to back in one sitting: a padding that drifts on one of them reads as a layout
// bug rather than as a variation.
export const stepStyles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.three,
  },
})
