import type { ImageSource } from "expo-image"

export type StatusArtwork = {
  light: ImageSource
  dark: ImageSource
}

export const developerActivityArtwork = {
  light: require("../../../assets/images/empty-states/developer-activity-light.png"),
  dark: require("../../../assets/images/empty-states/developer-activity-dark.png"),
} as const satisfies StatusArtwork

export const noDataArtwork = {
  light: require("../../../assets/images/empty-states/no-data-light.png"),
  dark: require("../../../assets/images/empty-states/no-data-dark.png"),
} as const satisfies StatusArtwork
