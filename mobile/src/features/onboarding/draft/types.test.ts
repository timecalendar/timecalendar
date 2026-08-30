import {
  isImportNameWithinLimit,
  NAME_MAX_LENGTH,
  normalizeImportName,
  safeIntranetUrl,
} from "./types"

// The journey's pure normalizers (90% logic gate). The boundary cases here are
// the ones the screens rely on but cannot demonstrate on their own: the 100/101
// split measured on the TRIMMED value, and the URL scheme filter.

describe("normalizeImportName", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeImportName("  L3 Informatique  ")).toBe("L3 Informatique")
    expect(normalizeImportName("\n\tL3\t\n")).toBe("L3")
  })

  it("collapses a whitespace-only value to the empty string", () => {
    expect(normalizeImportName("   ")).toBe("")
    expect(normalizeImportName("")).toBe("")
  })

  it("preserves accents, non-Latin scripts and emoji verbatim", () => {
    expect(normalizeImportName(" Licence Économie ")).toBe("Licence Économie")
    expect(normalizeImportName(" 情報工学 ")).toBe("情報工学")
    expect(normalizeImportName(" L3 Info 🎓 ")).toBe("L3 Info 🎓")
  })

  it("leaves interior whitespace alone", () => {
    expect(normalizeImportName(" L3  Informatique ")).toBe("L3  Informatique")
  })
})

describe("isImportNameWithinLimit", () => {
  it("accepts exactly the maximum and rejects one over, measured after trimming", () => {
    const at = "x".repeat(NAME_MAX_LENGTH)
    expect(isImportNameWithinLimit(at)).toBe(true)
    // Padding must not push a legal value over the limit — the server measures
    // the trimmed value too.
    expect(isImportNameWithinLimit(`   ${at}   `)).toBe(true)
    expect(isImportNameWithinLimit("x".repeat(NAME_MAX_LENGTH + 1))).toBe(false)
  })

  it("accepts the empty string (Skip's value)", () => {
    expect(isImportNameWithinLimit("")).toBe(true)
  })
})

describe("safeIntranetUrl", () => {
  it.each(["https://intranet.univ-eiffel.fr/", "http://ent.example.org/edt"])(
    "returns %s unchanged",
    (url) => {
      expect(safeIntranetUrl(url)).toBe(url)
    },
  )

  it("trims before parsing and returns the trimmed value", () => {
    expect(safeIntranetUrl("  https://ent.example.org  ")).toBe(
      "https://ent.example.org",
    )
  })

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["empty", ""],
    ["whitespace", "   "],
  ])("rejects an absent value (%s)", (_label, value) => {
    expect(safeIntranetUrl(value)).toBeNull()
  })

  it.each([
    // The security assertion: a server-owned string reaches a browser opener.
    "javascript:alert(1)",
    "file:///etc/passwd",
    "data:text/html,<script>alert(1)</script>",
    "intent://scan#Intent;scheme=zxing;end",
  ])("rejects the non-HTTP(S) scheme %s", (url) => {
    expect(safeIntranetUrl(url)).toBeNull()
  })

  it("rejects a bare hostname with no scheme to trust", () => {
    expect(safeIntranetUrl("univ-eiffel.fr")).toBeNull()
    expect(safeIntranetUrl("not a url at all")).toBeNull()
  })
})
