import type { SFSymbol } from "expo-symbols"

import { Icon, type MaterialGlyph } from "@/components/icon"
import { useTheme } from "@/theme"

export function StatusSymbol({
  name,
}: {
  name: { ios: SFSymbol; android: MaterialGlyph }
}) {
  const theme = useTheme()
  return (
    <Icon
      testID="status-symbol"
      ios={name.ios}
      android={name.android}
      size={40}
      color={theme.textSecondary}
      scaling="fixed"
    />
  )
}
