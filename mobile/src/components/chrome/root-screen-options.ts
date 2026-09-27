import type { NativeStackNavigationOptions } from "expo-router"
import { HeaderHeightContext } from "expo-router/react-navigation"
import { useContext } from "react"
import { Platform } from "react-native"

type HeaderColors = {
  background: string
  text: string
}

const compactChrome = {
  headerShown: true,
  headerLargeTitle: false,
  headerBackButtonDisplayMode: "minimal",
} satisfies NativeStackNavigationOptions

const iosTransparentChrome = {
  ...compactChrome,
  headerTransparent: true,
} satisfies NativeStackNavigationOptions

// iOS 26 bars draw their own scroll-edge effect; a blur material would stack on
// it as an opaque slab. Before 26, react-native-screens copies the standard
// appearance into scrollEdgeAppearance, so the material is on at scroll top too.
function iosHeaderBlurEffect(): NativeStackNavigationOptions["headerBlurEffect"] {
  return Number.parseInt(String(Platform.Version), 10) >= 26
    ? "none"
    : "systemChromeMaterial"
}

export function buildCompactRootScreenOptions({
  background,
  text,
}: HeaderColors): NativeStackNavigationOptions {
  // Bar buttons take the label color, not the nav theme's brand primary.
  if (Platform.OS === "ios")
    return {
      ...iosTransparentChrome,
      headerBlurEffect: iosHeaderBlurEffect(),
      headerTintColor: text,
    }
  return {
    ...compactChrome,
    headerStyle: { backgroundColor: background },
    headerShadowVisible: false,
    headerTintColor: text,
    headerTitleStyle: { color: text },
  }
}

// Height of the header drawn over the page: the iOS bar is transparent, so a
// non-scrolling page pads by it; a scroll view insets itself natively instead
// (contentInsetAdjustmentBehavior="automatic") so content scrolls under the blur.
export function useHeaderOverlapInset(): number {
  const headerHeight = useContext(HeaderHeightContext) ?? 0
  return Platform.OS === "ios" ? headerHeight : 0
}
