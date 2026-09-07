import type { NativeStackNavigationOptions } from "expo-router"
import type { ColorValue } from "react-native"

export function buildCompactRootScreenOptions(
  backgroundColor: ColorValue,
): NativeStackNavigationOptions {
  return {
    headerShown: true,
    headerLargeTitle: false,
    headerBackButtonDisplayMode: "minimal",
    headerStyle: { backgroundColor },
  }
}
