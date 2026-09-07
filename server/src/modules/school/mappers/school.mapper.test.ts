import { SchoolMapper } from "modules/school/mappers/school.mapper"
import { School } from "modules/school/models/school.entity"
import { getSchoolAssistant } from "modules/school/models/school-assistant.model"

const school = (
  assistant: string,
  fallbackAssistant: string | null = null,
): School => ({
  id: "123e4567-e89b-12d3-a456-426614174000",
  code: "example",
  name: "Example University",
  siteUrl: "https://example.edu",
  imageUrl: "/logo.png",
  imageUrlDark: null,
  intranetUrl: "https://intranet.example.edu",
  visible: true,
  assistant,
  fallbackAssistant,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
})

describe("SchoolMapper export-guide compatibility", () => {
  const mapper = new SchoolMapper()
  const known = [
    "ade",
    "celcat",
    "epitech",
    "generic",
    "groups",
    "hplanning",
    "select",
    "univorleans",
    "univtoulouse3",
    "upsud",
    "nantes",
  ]

  it.each(known)("preserves the complete legacy %s assistant value", (slug) => {
    const input = school(slug, "select")
    const mapped = mapper.toSchoolForList(input, "catalogue-v1")
    const { exportGuide, ...legacy } = mapped
    expect(JSON.stringify(legacy.assistant)).toBe(
      JSON.stringify(getSchoolAssistant(slug)),
    )
    expect(JSON.stringify(legacy.fallbackAssistant)).toBe(
      JSON.stringify(getSchoolAssistant("select")),
    )
    expect(exportGuide).toEqual({
      providerSlug: slug,
      requireProgramme: getSchoolAssistant(slug)?.requireCalendarName,
      requireConnect: getSchoolAssistant(slug)?.requireIntranetAccess,
      catalogueVersion: "catalogue-v1",
    })
  })

  it("preserves an unknown provider on the new wire object and uses Generic legacy bytes", () => {
    const mapped = mapper.toSchoolForList(
      school("future-provider"),
      "catalogue-v2",
    )
    expect(mapped.assistant).toEqual(getSchoolAssistant("generic"))
    expect(mapped.fallbackAssistant).toBeUndefined()
    expect(mapped.exportGuide).toEqual({
      providerSlug: "future-provider",
      requireProgramme: true,
      requireConnect: true,
      catalogueVersion: "catalogue-v2",
    })
  })

  it("keeps fallback changes irrelevant to the neutral reference", () => {
    const withoutFallback = mapper.toSchoolForList(school("ade"), "v1")
    const withFallback = mapper.toSchoolForList(school("ade", "groups"), "v1")
    expect(withFallback.exportGuide).toEqual(withoutFallback.exportGuide)
    expect(withFallback.fallbackAssistant).toEqual(getSchoolAssistant("groups"))
  })

  it("rejects an invalid raw slug instead of fabricating a reference", () => {
    expect(() => mapper.toSchoolForList(school("Not Valid"), "v1")).toThrow(
      "Invalid export-guide provider slug",
    )
  })

  it("lets released-style consumers ignore the additive property", () => {
    const mapped = mapper.toSchoolForList(school("ade"), "v1")
    const releasedConsumer = ({ name, assistant }: typeof mapped) => ({
      name,
      assistant,
    })
    expect(releasedConsumer(mapped)).toEqual({
      name: "Example University",
      assistant: getSchoolAssistant("ade"),
    })
  })

  it("keeps the complete Flutter-shaped JSON byte-compatible before the additive field", () => {
    const input = school("ade", "select")
    const { exportGuide, ...legacy } = mapper.toSchoolForList(input, "v1")
    expect(exportGuide.catalogueVersion).toBe("v1")
    const expected = {
      id: input.id,
      code: input.code,
      name: input.name,
      siteUrl: input.siteUrl,
      imageUrl: expect.stringContaining(input.imageUrl),
      imageUrlDark: null,
      intranetUrl: input.intranetUrl,
      visible: input.visible,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      assistant: getSchoolAssistant("ade"),
      fallbackAssistant: getSchoolAssistant("select"),
    }
    expect(legacy).toEqual(expected)
    expect(Object.keys(legacy)).toEqual(Object.keys(expected))
  })
})
