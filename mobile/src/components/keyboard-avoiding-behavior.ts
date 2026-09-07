import type { Platform } from "react-native"

export function resolveKeyboardAvoidingBehavior(
  _platform: typeof Platform.OS,
): "height" {
  // A sibling action region must participate in the unobscured height. Padding
  // mode can leave that sibling laid out behind the iOS keyboard even when the
  // scroll body itself flexes, so both platforms use the height constraint.
  return "height"
}
