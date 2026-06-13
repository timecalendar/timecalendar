// Side-effect import: loads the web font CSS variables the `Fonts.web` tokens
// reference. It travelled here from the old constants/theme.ts when the token
// layer split out; every token consumer imports `@/theme`, so this loads with
// the tokens and web font rendering is preserved (tasks 1.4).
import "@/global.css"

export {
  Colors,
  Fonts,
  Spacing,
  Radii,
  BottomTabInset,
  MaxContentWidth,
} from "@/theme/tokens"
export type { ThemeColor } from "@/theme/tokens"
export { useTheme } from "@/theme/use-theme"
