import { getString, remove, setString } from "@/storage"

import {
  getHiddenEvents,
  hideByName,
  hideByUid,
  unhideName,
  unhideUid,
} from "./store"
import { HIDDEN_EVENTS_KEYS } from "./types"

// Round-trips the hidden set through the REAL @/storage seam (the MMKV in-memory
// mock from setup-storage), so write/read-back is exercised against the genuine
// backend — the irreplaceable-data write rigor of the user_calendars /
// calendar_events ships. Asserts: each mutator (append / dedup no-op / remove /
// remove-absent no-op), the verbatim importer-fidelity blob shape, totality.

beforeEach(() => remove(HIDDEN_EVENTS_KEYS.set))

describe("hidden-events store", () => {
  it("reads the empty set when nothing is hidden", () => {
    expect(getHiddenEvents()).toEqual({
      uidHiddenEvents: [],
      namedHiddenEvents: [],
    })
  })

  it("hides by uid (write-then-read-back)", () => {
    hideByUid("uid-1")
    expect(getHiddenEvents()).toEqual({
      uidHiddenEvents: ["uid-1"],
      namedHiddenEvents: [],
    })
  })

  it("hides by name (write-then-read-back)", () => {
    hideByName("Algorithms")
    expect(getHiddenEvents()).toEqual({
      uidHiddenEvents: [],
      namedHiddenEvents: ["Algorithms"],
    })
  })

  it("hiding the same uid twice is a no-op (deduped)", () => {
    hideByUid("uid-1")
    hideByUid("uid-1")
    expect(getHiddenEvents().uidHiddenEvents).toEqual(["uid-1"])
  })

  it("hiding the same name twice is a no-op (deduped)", () => {
    hideByName("Algorithms")
    hideByName("Algorithms")
    expect(getHiddenEvents().namedHiddenEvents).toEqual(["Algorithms"])
  })

  it("un-hides by uid", () => {
    hideByUid("uid-1")
    hideByUid("uid-2")
    unhideUid("uid-1")
    expect(getHiddenEvents().uidHiddenEvents).toEqual(["uid-2"])
  })

  it("un-hides by name", () => {
    hideByName("Algorithms")
    hideByName("Physics")
    unhideName("Algorithms")
    expect(getHiddenEvents().namedHiddenEvents).toEqual(["Physics"])
  })

  it("un-hiding an absent value is a no-op", () => {
    hideByUid("uid-1")
    unhideUid("not-hidden")
    unhideName("not-hidden")
    expect(getHiddenEvents()).toEqual({
      uidHiddenEvents: ["uid-1"],
      namedHiddenEvents: [],
    })
  })

  it("persists the verbatim { uidHiddenEvents, namedHiddenEvents } blob (importer fidelity)", () => {
    hideByUid("uid-1")
    hideByName("Algorithms")
    const raw = getString(HIDDEN_EVENTS_KEYS.set)
    expect(raw).toBeDefined()
    // The stored value is the exact Flutter toMap() shape — an importer can write
    // the recovered record as this key's value with no transformation.
    expect(JSON.parse(raw as string)).toEqual({
      uidHiddenEvents: ["uid-1"],
      namedHiddenEvents: ["Algorithms"],
    })
  })

  it("reads back the empty set from a corrupt blob (total, never throws)", () => {
    setString(HIDDEN_EVENTS_KEYS.set, "{not json")
    expect(getHiddenEvents()).toEqual({
      uidHiddenEvents: [],
      namedHiddenEvents: [],
    })
  })
})
