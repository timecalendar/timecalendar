import { Pressable, Text, View } from "react-native"

import {
  headerBarItems,
  type HeaderOptions,
  type HeaderSide,
} from "@/test-support/header-actions"

const SIDES: readonly HeaderSide[] = ["left", "right"]

// Stands in for the native header in feature tests: iOS bar items become
// pressables keyed by their identifier, Android slots render as returned.
export function HeaderActionsPreview({
  options,
}: {
  options: HeaderOptions | undefined
}) {
  return (
    <>
      {SIDES.flatMap((side) =>
        headerBarItems(options, side).map((item) => (
          <Pressable
            key={`${side}-${item.identifier}`}
            testID={item.identifier}
            accessibilityRole="button"
            accessibilityLabel={item.accessibilityLabel}
            accessibilityHint={item.accessibilityHint}
            accessibilityState={{ disabled: item.disabled === true }}
            disabled={item.disabled}
            onPress={item.onPress}
          >
            <View>
              <Text>{item.label}</Text>
            </View>
          </Pressable>
        )),
      )}
      {options?.headerLeft?.({})}
      {options?.headerRight?.({})}
    </>
  )
}
