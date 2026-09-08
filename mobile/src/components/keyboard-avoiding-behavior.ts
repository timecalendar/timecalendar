import type { Platform } from "react-native"

export function resolveKeyboardAvoidingBehavior(
  _platform: typeof Platform.OS,
): "height" {
  // A sibling action region must participate in the unobscured height. Padding
  // mode can leave that sibling laid out behind the iOS keyboard even when the
  // scroll body itself flexes, so both platforms use the height constraint.
  return "height"
}

export function resolveKeyboardVerticalOffset(
  platform: typeof Platform.OS,
  measuredOwnerY: number,
): number {
  // Android's keyboard frame is already expressed against the full window.
  // Re-applying the owner's Y position leaves the avoided view that many
  // pixels below the keyboard edge. iOS needs the measured chrome offset.
  return platform === "ios" ? measuredOwnerY : 0
}
