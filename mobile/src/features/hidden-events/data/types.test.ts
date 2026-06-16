import {
  emptyHiddenEvents,
  encodeHiddenEvents,
  type HiddenEventsSet,
  parseHiddenEvents,
} from "./types"

// The total parser + the verbatim encode. The hidden set is IRREPLACEABLE (no
// server backup, a Phase-09 importer target), so the parser must NEVER throw
// (corrupt/absent → empty) and the encode must preserve the Flutter toMap() shape
// { uidHiddenEvents, namedHiddenEvents } verbatim.

describe("parseHiddenEvents", () => {
  it("reads the empty set when unset", () => {
    expect(parseHiddenEvents(undefined)).toEqual(emptyHiddenEvents())
  })

  it("round-trips a populated verbatim blob", () => {
    const raw = JSON.stringify({
      uidHiddenEvents: ["uid-1", "uid-2"],
      namedHiddenEvents: ["Algorithms"],
    })
    expect(parseHiddenEvents(raw)).toEqual({
      uidHiddenEvents: ["uid-1", "uid-2"],
      namedHiddenEvents: ["Algorithms"],
    })
  })

  it("is total on non-JSON / wrong shape / non-string members (never throws)", () => {
    expect(parseHiddenEvents("{not json")).toEqual(emptyHiddenEvents())
    expect(parseHiddenEvents("42")).toEqual(emptyHiddenEvents())
    expect(parseHiddenEvents("null")).toEqual(emptyHiddenEvents())
    expect(parseHiddenEvents('"a string"')).toEqual(emptyHiddenEvents())
    expect(parseHiddenEvents("[1, 2]")).toEqual(emptyHiddenEvents())
    // Non-string members in a list → that list drops to [].
    expect(
      parseHiddenEvents(
        JSON.stringify({ uidHiddenEvents: [1, 2], namedHiddenEvents: ["ok"] }),
      ),
    ).toEqual({ uidHiddenEvents: [], namedHiddenEvents: ["ok"] })
  })

  it("defaults a missing list to [] independently (partial blob)", () => {
    expect(
      parseHiddenEvents(JSON.stringify({ uidHiddenEvents: ["uid-1"] })),
    ).toEqual({ uidHiddenEvents: ["uid-1"], namedHiddenEvents: [] })
    expect(
      parseHiddenEvents(JSON.stringify({ namedHiddenEvents: ["Algorithms"] })),
    ).toEqual({ uidHiddenEvents: [], namedHiddenEvents: ["Algorithms"] })
  })
})

describe("encodeHiddenEvents", () => {
  it("produces a verbatim { uidHiddenEvents, namedHiddenEvents } record", () => {
    const set: HiddenEventsSet = {
      uidHiddenEvents: ["uid-1"],
      namedHiddenEvents: ["Algorithms"],
    }
    const json = encodeHiddenEvents(set)
    // The exact Flutter toMap() shape (importer-fidelity verbatim) — the parsed
    // value has exactly the two keys, both string lists.
    expect(JSON.parse(json)).toEqual({
      uidHiddenEvents: ["uid-1"],
      namedHiddenEvents: ["Algorithms"],
    })
  })

  it("round-trips through parse (encode → parse is identity)", () => {
    const set: HiddenEventsSet = {
      uidHiddenEvents: ["a", "b"],
      namedHiddenEvents: ["Maths", "Physics"],
    }
    expect(parseHiddenEvents(encodeHiddenEvents(set))).toEqual(set)
  })
})
