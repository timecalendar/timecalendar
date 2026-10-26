import { type EventAppearanceScheme, resolveEventAppearance } from "@/theme"

export function eventSurfaceColor(
  color: string,
  scheme: EventAppearanceScheme = "light",
): string {
  return resolveEventAppearance({ color, scheme, increasedContrast: false })
    .surface
}
