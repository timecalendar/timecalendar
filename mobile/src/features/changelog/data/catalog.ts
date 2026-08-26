import type { AndroidSymbol, SFSymbol } from "expo-symbols"

export const CHANGELOG_VERSION = 4

export type ChangelogTranslationKey =
  | "changelog.item.design.title"
  | "changelog.item.design.subtitle"
  | "changelog.item.speed.title"
  | "changelog.item.speed.subtitle"
  | "changelog.item.native.title"
  | "changelog.item.native.subtitle"

export interface ChangelogIcon {
  readonly ios: SFSymbol
  readonly android: AndroidSymbol
  readonly web: AndroidSymbol
}

export interface ChangelogItem {
  readonly icon: ChangelogIcon
  readonly titleKey: ChangelogTranslationKey
  readonly subtitleKey: ChangelogTranslationKey
}

export interface ChangelogRelease {
  readonly version: number
  readonly label: string
  readonly items: readonly ChangelogItem[]
}

export const CHANGELOG_RELEASES: readonly ChangelogRelease[] = [
  {
    version: 4,
    label: "4.0",
    items: [
      {
        icon: { ios: "paintpalette", android: "palette", web: "palette" },
        titleKey: "changelog.item.design.title",
        subtitleKey: "changelog.item.design.subtitle",
      },
      {
        icon: { ios: "bolt.fill", android: "bolt", web: "bolt" },
        titleKey: "changelog.item.speed.title",
        subtitleKey: "changelog.item.speed.subtitle",
      },
      {
        icon: {
          ios: "iphone",
          android: "smartphone",
          web: "smartphone",
        },
        titleKey: "changelog.item.native.title",
        subtitleKey: "changelog.item.native.subtitle",
      },
    ],
  },
] as const

export function getAllChangelogReleases(): readonly ChangelogRelease[] {
  return CHANGELOG_RELEASES
}

export function getChangelogReleasesAfter(
  version: number,
): readonly ChangelogRelease[] {
  return CHANGELOG_RELEASES.filter((release) => release.version > version)
}
