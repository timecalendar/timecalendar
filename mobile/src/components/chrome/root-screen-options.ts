import { Stack } from "expo-router"
import type { ComponentProps } from "react"
import type { ColorValue } from "react-native"

type StackScreenOptions = Exclude<
  ComponentProps<typeof Stack>["screenOptions"],
  ((...args: never[]) => unknown) | undefined
>

export function buildCompactRootScreenOptions(
  backgroundColor: ColorValue,
): StackScreenOptions {
  return {
    headerShown: true,
    headerLargeTitle: false,
    headerBackButtonDisplayMode: "minimal",
    headerStyle: { backgroundColor },
  }
}
