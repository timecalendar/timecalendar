import { getMaterialColors } from "@expo/ui/jetpack-compose"
import { Platform } from "react-native"

import { useColorScheme } from "@/hooks/use-color-scheme"
import { useTheme } from "@/theme"

export type ListPalette = {
  surface: string
  text: string
  textSecondary: string
}

// getMaterialColors is a synchronous native call; a long list must not repeat it
// per row.
const materialPalettes = new Map<string, ListPalette>()

function materialPalette(scheme: "light" | "dark", seed: string): ListPalette {
  const key = `${scheme}:${seed}`
  const cached = materialPalettes.get(key)
  if (cached) return cached
  const colors = getMaterialColors({ scheme, seedColor: seed })
  const palette = {
    surface: colors.surfaceContainer,
    text: colors.onSurface,
    textSecondary: colors.onSurfaceVariant,
  }
  materialPalettes.set(key, palette)
  return palette
}

export function useListPalette(): ListPalette {
  const theme = useTheme()
  const scheme = useColorScheme() === "dark" ? "dark" : "light"
  if (Platform.OS === "android") return materialPalette(scheme, theme.primary)
  return {
    surface: theme.backgroundElement,
    text: theme.text,
    textSecondary: theme.textSecondary,
  }
}
