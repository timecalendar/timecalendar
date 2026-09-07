import type { EmptyStateArtwork } from "@/components/empty-state"

export const developerActivityArtwork = {
  light: require("../../assets/images/empty-states/developer-activity-light.png"),
  dark: require("../../assets/images/empty-states/developer-activity-dark.png"),
} as const satisfies EmptyStateArtwork

export const noDataArtwork = {
  light: require("../../assets/images/empty-states/no-data-light.png"),
  dark: require("../../assets/images/empty-states/no-data-dark.png"),
} as const satisfies EmptyStateArtwork
