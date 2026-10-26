import {
  Host as ComposeHost,
  type HostProps as ComposeHostProps,
} from "@expo/ui/jetpack-compose"

import { useColorScheme } from "@/hooks/use-color-scheme"
import { useTheme } from "@/theme"

export function useResolvedScheme(): "light" | "dark" {
  return useColorScheme() === "dark" ? "dark" : "light"
}

export function SeededComposeHost({
  children,
  ...props
}: Pick<
  ComposeHostProps,
  "children" | "matchContents" | "style" | "useViewportSizeMeasurement"
>) {
  const colorScheme = useResolvedScheme()
  const theme = useTheme()
  return (
    <ComposeHost {...props} colorScheme={colorScheme} seedColor={theme.primary}>
      {children}
    </ComposeHost>
  )
}
