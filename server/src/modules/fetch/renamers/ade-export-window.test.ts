import {
  ADE_EXPORT_WINDOW_MONTHS_FUTURE,
  ADE_EXPORT_WINDOW_MONTHS_PAST,
  getAdeExportWindow,
} from "modules/fetch/renamers/ade-export-window"

describe("getAdeExportWindow", () => {
  it("uses named symmetric 12-month bounds", () => {
    expect(ADE_EXPORT_WINDOW_MONTHS_PAST).toBe(12)
    expect(ADE_EXPORT_WINDOW_MONTHS_FUTURE).toBe(12)
    expect(getAdeExportWindow(new Date("2026-08-25T23:59:59.999Z"))).toEqual({
      firstDate: "2025-08-25",
      lastDate: "2027-08-25",
    })
  })

  it("uses the UTC date across a year boundary", () => {
    expect(getAdeExportWindow(new Date("2026-01-01T00:00:00.000Z"))).toEqual({
      firstDate: "2025-01-01",
      lastDate: "2027-01-01",
    })
  })

  it("clamps leap day to the end of February", () => {
    expect(getAdeExportWindow(new Date("2028-02-29T12:00:00.000Z"))).toEqual({
      firstDate: "2027-02-28",
      lastDate: "2029-02-28",
    })
  })
})
