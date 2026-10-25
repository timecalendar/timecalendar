import { type AndroidSymbol, type SFSymbol, SymbolView } from "expo-symbols"
import { View } from "react-native"

import { useTheme } from "@/theme"

// expo-symbols' Android SymbolView renders a Text glyph and drops the a11y
// props, so the host wrapper is what keeps TalkBack off the decoration.
export function StatusSymbol({
  name,
}: {
  name: { ios: SFSymbol; android: AndroidSymbol }
}) {
  const theme = useTheme()
  return (
    <View
      testID="status-symbol"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <SymbolView name={name} size={40} tintColor={theme.textSecondary} />
    </View>
  )
}
