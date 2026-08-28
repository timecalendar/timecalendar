import {
  encodeSourceHealthSnapshot,
  mapSourceHealthDto,
  mapSourceHealthSnapshot,
  parseSourceHealthSnapshot,
} from "./types"

describe("calendar source-health mapping", () => {
  it("maps every supported status and stale code", () => {
    expect(
      mapSourceHealthDto({
        status: "stale",
        reason: "known_source_transition",
        recoveryAction: "re_add",
        guide: "amu_2026_2027",
      }),
    ).toEqual({
      status: "stale",
      reason: "known_source_transition",
      recoveryAction: "re_add",
      guide: "amu_2026_2027",
    })
    expect(
      mapSourceHealthDto({
        status: "healthy",
        reason: null,
        recoveryAction: null,
        guide: null,
      }).status,
    ).toBe("healthy")
  })

  it.each([
    undefined,
    null,
    { status: "future", reason: null, recoveryAction: null, guide: null },
    { status: "stale", reason: "future", recoveryAction: "re_add" },
    {
      status: "stale",
      reason: "expired_export_window",
      recoveryAction: null,
      guide: null,
    },
    {
      status: "healthy",
      reason: "expired_export_window",
      recoveryAction: null,
      guide: null,
    },
  ])("degrades malformed or future DTO values to unknown", (value) => {
    expect(mapSourceHealthDto(value)).toEqual({
      status: "unknown",
      reason: null,
      recoveryAction: null,
      guide: null,
    })
  })

  it("maps a response by calendar ID and prunes absent prior IDs", () => {
    expect(
      mapSourceHealthSnapshot([
        {
          calendar: { id: "calendar-2" },
          sourceHealth: {
            status: "stale",
            reason: "expired_export_window",
            recoveryAction: "re_add",
            guide: null,
          },
        },
      ]),
    ).toEqual({
      "calendar-2": {
        status: "stale",
        reason: "expired_export_window",
        recoveryAction: "re_add",
        guide: null,
      },
    })
  })

  it("serializes only calendar IDs and fixed metadata", () => {
    const encoded = encodeSourceHealthSnapshot({
      "calendar-1": {
        status: "stale",
        reason: "expired_export_window",
        recoveryAction: "re_add",
        guide: null,
      },
    })
    expect(JSON.parse(encoded)).toEqual({
      "calendar-1": {
        status: "stale",
        reason: "expired_export_window",
        recoveryAction: "re_add",
        guide: null,
      },
    })
    expect(encoded).not.toMatch(/https|token|error/)
  })

  it.each([undefined, "not-json", "[]", '"text"'])(
    "totally decodes a corrupt snapshot",
    (raw) => {
      expect(parseSourceHealthSnapshot(raw)).toEqual({})
    },
  )
})
