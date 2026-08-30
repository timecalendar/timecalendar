import { act, renderHook } from "@testing-library/react-native"
import type { ReactNode } from "react"

import type { SchoolListItem } from "@/features/school-selection/data"

import { ImportDraftProvider, useImportDraft } from "./context"
import { toCreateFields, useImportCreateFields } from "./create-fields"

// The derivation table (design D3) and the draft's own lifecycle, at the 90%
// logic gate. The load-bearing assertions are about key ABSENCE: the server
// validates schoolId/schoolName with a mutually-exclusive @ValidateIf pair, so
// `schoolName: undefined` alongside a schoolId is a rejected body, not a
// harmless extra.

const school: SchoolListItem = {
  id: "univeiffel",
  name: "Université Gustave Eiffel",
  code: "UPEM",
  imageUrl: "b.png",
  imageUrlDark: null,
  intranetUrl: "https://intranet.univ-eiffel.fr/",
}

function wrapper({ children }: { children: ReactNode }) {
  return <ImportDraftProvider>{children}</ImportDraftProvider>
}

describe("toCreateFields", () => {
  it("derives schoolId with NO schoolName key from a listed draft", () => {
    const fields = toCreateFields({
      institution: { kind: "listed", school },
      calendarName: "L3 Informatique",
    })

    expect(fields).toEqual({ name: "L3 Informatique", schoolId: "univeiffel" })
    expect(Object.keys(fields)).not.toContain("schoolName")
  })

  it("derives schoolName with NO schoolId key from an unlisted draft", () => {
    const fields = toCreateFields({
      institution: { kind: "unlisted", schoolName: "  École du Coin  " },
      calendarName: "  Master Réseaux  ",
    })

    expect(fields).toEqual({
      name: "Master Réseaux",
      schoolName: "École du Coin",
    })
    expect(Object.keys(fields)).not.toContain("schoolId")
  })

  it("derives the direct-route contract from no draft", () => {
    const fields = toCreateFields(null)

    expect(fields).toEqual({ name: "", schoolName: "" })
    expect(Object.keys(fields)).not.toContain("schoolId")
  })

  it("emits an empty name for a skipped programme, keeping the institution", () => {
    expect(
      toCreateFields({
        institution: { kind: "listed", school },
        calendarName: "",
      }),
    ).toEqual({ name: "", schoolId: "univeiffel" })
  })
})

describe("useImportCreateFields", () => {
  it("is total outside the provider — the QR/URL direct-route contract", async () => {
    const { result } = await renderHook(() => useImportCreateFields())

    expect(result.current).toEqual({ name: "", schoolName: "" })
  })

  it("tracks the draft written by the journey", async () => {
    const { result } = await renderHook(
      () => ({ draft: useImportDraft(), fields: useImportCreateFields() }),
      { wrapper },
    )

    await act(() => {
      result.current.draft.setListedInstitution(school)
    })
    await act(() => {
      result.current.draft.setCalendarName("  L3 Informatique  ")
    })

    expect(result.current.fields).toEqual({
      name: "L3 Informatique",
      schoolId: "univeiffel",
    })
  })
})

describe("useImportDraft", () => {
  it("returns no draft and no-op setters outside the provider, never throwing", async () => {
    const { result } = await renderHook(() => useImportDraft())

    expect(result.current.draft).toBeNull()
    await expect(
      act(() => {
        result.current.setListedInstitution(school)
        result.current.setUnlistedInstitution("École du Coin")
        result.current.setCalendarName("L3")
        result.current.clearDraft()
      }),
    ).resolves.not.toThrow()
    expect(result.current.draft).toBeNull()
  })

  it("normalizes the unlisted institution name into the draft", async () => {
    const { result } = await renderHook(() => useImportDraft(), { wrapper })

    await act(() => {
      result.current.setUnlistedInstitution("  École du Coin  ")
    })

    expect(result.current.draft).toEqual({
      institution: { kind: "unlisted", schoolName: "École du Coin" },
      calendarName: "",
    })
  })

  it("resets the programme name when the institution changes", async () => {
    const { result } = await renderHook(() => useImportDraft(), { wrapper })

    await act(() => {
      result.current.setListedInstitution(school)
    })
    await act(() => {
      result.current.setCalendarName("L3 Informatique")
    })
    // Picking a different institution must not keep a name typed for the first
    // one — that would silently mislabel the import.
    await act(() => {
      result.current.setUnlistedInstitution("École du Coin")
    })

    expect(result.current.draft?.calendarName).toBe("")
  })

  it("ignores a programme name written with no institution chosen", async () => {
    const { result } = await renderHook(() => useImportDraft(), { wrapper })

    await act(() => {
      result.current.setCalendarName("L3 Informatique")
    })

    expect(result.current.draft).toBeNull()
  })

  it("clearDraft empties the draft after a successful import", async () => {
    const { result } = await renderHook(() => useImportDraft(), { wrapper })

    await act(() => {
      result.current.setListedInstitution(school)
    })
    expect(result.current.draft).not.toBeNull()

    await act(() => {
      result.current.clearDraft()
    })
    expect(result.current.draft).toBeNull()
  })
})
