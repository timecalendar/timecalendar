import type { ParseKeys } from "i18next"

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

export type SwatchPreset = (typeof SWATCH_PRESETS)[number]

export const DEFAULT_SWATCH = SWATCH_PRESETS[0]

export const SWATCH_NAME_KEYS = {
  "#E91E63": "personalEvents.color.name.pink",
  "#9C27B0": "personalEvents.color.name.purple",
  "#3F51B5": "personalEvents.color.name.indigo",
  "#03A9F4": "personalEvents.color.name.lightBlue",
  "#009688": "personalEvents.color.name.teal",
  "#4CAF50": "personalEvents.color.name.green",
  "#FF9800": "personalEvents.color.name.orange",
  "#795548": "personalEvents.color.name.brown",
} as const satisfies Record<SwatchPreset, ParseKeys>
