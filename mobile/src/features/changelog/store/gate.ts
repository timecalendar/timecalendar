import {
  CHANGELOG_VERSION,
  type ChangelogRelease,
  getChangelogReleasesAfter,
} from "@/features/changelog/data"

export type ChangelogGateDecision =
  | { readonly kind: "seedCurrent" }
  | {
      readonly kind: "present"
      readonly releases: readonly ChangelogRelease[]
    }
  | { readonly kind: "skip" }

export function decideChangelogGate(
  seenVersion: number | undefined,
): ChangelogGateDecision {
  if (seenVersion === undefined) return { kind: "seedCurrent" }
  if (seenVersion >= CHANGELOG_VERSION) return { kind: "skip" }
  return {
    kind: "present",
    releases: getChangelogReleasesAfter(seenVersion),
  }
}
