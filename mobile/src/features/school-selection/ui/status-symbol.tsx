import { type SFSymbol, SymbolView } from "expo-symbols"
import { Platform } from "react-native"

import { useTheme } from "@/theme"

export function StatusSymbol({ name }: { name: SFSymbol }) {
  const theme = useTheme()
  if (Platform.OS !== "ios") return null
  return <SymbolView name={name} size={40} tintColor={theme.textSecondary} />
}
