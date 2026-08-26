import {
  CHANGELOG_RELEASES,
  CHANGELOG_VERSION,
  getAllChangelogReleases,
  getChangelogReleasesAfter,
} from "./catalog"

describe("changelog catalog", () => {
  it("keeps the current release newest-first and within the current version", () => {
    const releases = getAllChangelogReleases()
    expect(releases).toBe(CHANGELOG_RELEASES)
    expect(releases.map(({ version }) => version)).toEqual(
      [...releases]
        .map(({ version }) => version)
        .sort((left, right) => right - left),
    )
    expect(releases.some(({ version }) => version === CHANGELOG_VERSION)).toBe(
      true,
    )
    expect(releases.every(({ version }) => version <= CHANGELOG_VERSION)).toBe(
      true,
    )
    expect(releases[0]).toMatchObject({ version: 4, label: "4.0" })
    expect(releases[0]?.items).toHaveLength(3)
  })

  it("selects strictly newer releases without mutating the catalog", () => {
    const snapshot = JSON.stringify(CHANGELOG_RELEASES)
    expect(getChangelogReleasesAfter(3).map(({ version }) => version)).toEqual([
      4,
    ])
    expect(getChangelogReleasesAfter(4)).toEqual([])
    expect(getChangelogReleasesAfter(5)).toEqual([])
    expect(JSON.stringify(CHANGELOG_RELEASES)).toBe(snapshot)
  })
})
