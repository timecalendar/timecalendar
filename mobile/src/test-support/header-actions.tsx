import { render } from "@testing-library/react-native"
import type {
  NativeStackHeaderItem,
  NativeStackHeaderItemButton,
  NativeStackNavigationOptions,
} from "expo-router"

type HeaderOptions = Pick<
  NativeStackNavigationOptions,
  | "headerLeft"
  | "headerRight"
  | "unstable_headerLeftItems"
  | "unstable_headerRightItems"
>

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
