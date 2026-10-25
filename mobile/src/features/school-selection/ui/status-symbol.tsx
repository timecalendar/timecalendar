import { type AndroidSymbol, type SFSymbol, SymbolView } from "expo-symbols"

import { useTheme } from "@/theme"

export function StatusSymbol({
  name,
}: {
  name: { ios: SFSymbol; android: AndroidSymbol }
}) {
  const theme = useTheme()
  return (
    <SymbolView
      name={name}
      size={40}
      tintColor={theme.textSecondary}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  )
}
