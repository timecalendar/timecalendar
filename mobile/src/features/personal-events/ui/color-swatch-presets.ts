// Event colors are stored verbatim per ADR 011. Keeping this feature-owned data
// outside the component module leaves that module component-only.
export const SWATCH_PRESETS = [
  "#E91E63",
  "#9C27B0",
  "#3F51B5",
  "#03A9F4",
  "#009688",
  "#4CAF50",
  "#FF9800",
  "#795548",
] as const

export const DEFAULT_SWATCH = SWATCH_PRESETS[0]
