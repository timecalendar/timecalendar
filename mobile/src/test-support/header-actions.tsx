import { render } from "@testing-library/react-native"
import type {
  NativeStackHeaderItem,
  NativeStackHeaderItemButton,
  NativeStackNavigationOptions,
} from "expo-router"

type HeaderSlots = Pick<
  NativeStackNavigationOptions,
  | "headerLeft"
  | "headerRight"
  | "unstable_headerLeftItems"
  | "unstable_headerRightItems"
>

export type HeaderOptions = {
  [K in keyof HeaderSlots]?: HeaderSlots[K] | undefined
}

export type HeaderSide = "left" | "right"

export function headerBarItems(
  options: HeaderOptions | undefined,
  side: HeaderSide,
): NativeStackHeaderItemButton[] {
  const items =
    side === "left"
      ? options?.unstable_headerLeftItems
      : options?.unstable_headerRightItems
  return (items?.({}) ?? []).filter(
    (item: NativeStackHeaderItem): item is NativeStackHeaderItemButton =>
      item.type === "button",
  )
}

export function headerBarItem(
  options: HeaderOptions | undefined,
  side: HeaderSide,
  identifier: string,
): NativeStackHeaderItemButton | undefined {
  return headerBarItems(options, side).find(
    (item) => item.identifier === identifier,
  )
}

export function renderHeaderSide(
  options: HeaderOptions | undefined,
  side: HeaderSide,
) {
  const header = side === "left" ? options?.headerLeft : options?.headerRight
  return render(<>{header?.({})}</>)
}

// Mirrors navigation.setOptions, which merges each call into the previous
// options: a mock that replaces them would hide a slot that is never cleared.
export function mergedScreenOptions() {
  let current: NativeStackNavigationOptions = {}
  return {
    set: (options: NativeStackNavigationOptions) => {
      current = { ...current, ...options }
    },
    get: () => current,
    reset: () => {
      current = {}
    },
  }
}
