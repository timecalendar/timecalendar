import type { Platform } from "react-native"

export function resolveKeyboardAvoidingBehavior(
  platform: typeof Platform.OS,
): "padding" | "height" {
  return platform === "ios" ? "padding" : "height"
}
