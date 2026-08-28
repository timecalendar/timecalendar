import { remove } from "@/storage"

import {
  getSourceHealthSnapshot,
  removeCalendarSourceHealth,
  replaceSourceHealthSnapshot,
} from "./store"
import { SOURCE_HEALTH_KEY } from "./types"

const stale = {
  status: "stale" as const,
  reason: "expired_export_window" as const,
  recoveryAction: "re_add" as const,
  guide: null,
}

afterEach(() => remove(SOURCE_HEALTH_KEY))

describe("calendar source-health store", () => {
  it("replaces and reads the full snapshot through storage", () => {
    replaceSourceHealthSnapshot({ old: stale })
    replaceSourceHealthSnapshot({ current: stale })

    expect(getSourceHealthSnapshot()).toEqual({ current: stale })
  })

  it("removes one calendar without disturbing the others", () => {
    replaceSourceHealthSnapshot({ first: stale, second: stale })

    removeCalendarSourceHealth("first")

    expect(getSourceHealthSnapshot()).toEqual({ second: stale })
  })

  it("does not rewrite when the calendar has no advisory state", () => {
    expect(() => removeCalendarSourceHealth("missing")).not.toThrow()
    expect(getSourceHealthSnapshot()).toEqual({})
  })
})
