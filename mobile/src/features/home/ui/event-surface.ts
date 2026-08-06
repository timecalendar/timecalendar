export function eventSurfaceColor(color: string): string {
  return /^#[0-9A-F]{6}$/i.test(color) ? `${color}59` : color
}
