import { readFile } from "fs/promises"
import { join } from "path"
import { NestExpressApplication } from "@nestjs/platform-express"
import {
  ExportGuideAssetReader,
  FileExportGuideAssetReader,
} from "modules/export-guide/assets/export-guide-asset-reader"
import { createInitialExportGuideCatalogue } from "modules/export-guide/data/initial-export-guide-catalogue"
import { ExportGuideCatalogueStore } from "modules/export-guide/stores/export-guide-catalogue.store"
import { ExportGuidePublicationService } from "modules/export-guide/services/export-guide-publication.service"
import { schoolFactory } from "modules/school/factories/school.factory"
import { SchoolModule } from "modules/school/school.module"
import { SchoolService } from "modules/school/services/school.service"
import createTestApp from "test-utils/create-test-app"

const fixtureRoot = join(__dirname, "../assets/__fixtures__")
const origin = "https://assets.example.com"

describe("ExportGuidePublicationService integration", () => {
  let app: NestExpressApplication
  let publication: ExportGuidePublicationService
  let catalogues: ExportGuideCatalogueStore
  let schools: SchoolService

  beforeAll(async () => {
    app = await createTestApp(
      { imports: [SchoolModule] },
      {
        overrides: [
          { provide: "EXPORT_GUIDE_ASSET_ORIGIN", useValue: origin },
          {
            provide: ExportGuideAssetReader,
            useValue: new FileExportGuideAssetReader(fixtureRoot, {
              "/static.png": "image/png",
            }),
          },
        ],
      },
    )
    publication = app.get(ExportGuidePublicationService)
    catalogues = app.get(ExportGuideCatalogueStore)
    schools = app.get(SchoolService)
  })

  const candidate = async (version: string) => {
    const size = (await readFile(join(fixtureRoot, "static.png"))).length
    const replaceImages = (catalogue: any) => {
      catalogue.catalogueVersion = version
      for (const provider of catalogue.providers)
        for (const page of provider.pages)
          if (page.image)
            page.image = {
              url: `${origin}/static.png`,
              mimeType: "image/png",
              byteSize: size,
              width: 2,
              height: 2,
              altText: "Actual fixture image",
              caption: "Actual fixture caption",
            }
      return catalogue
    }
    return {
      fr: replaceImages(
        JSON.parse(JSON.stringify(createInitialExportGuideCatalogue("fr"))),
      ),
      en: replaceImages(
        JSON.parse(JSON.stringify(createInitialExportGuideCatalogue("en"))),
      ),
    }
  }

  it("validates real Postgres rows and asset bytes before atomic visibility", async () => {
    await schoolFactory().create({ name: "Known provider", assistant: "ade" })
    await schoolFactory().create({ assistant: "future-provider" })
    const before = catalogues.capture()
    const { fr, en } = await candidate("integration-v2")
    await publication.publish(fr, en)
    const after = catalogues.capture()
    expect(before.activeVersion).not.toBe(after.activeVersion)
    expect(after.activeVersion).toBe("integration-v2")
    const result = await schools.findSchools()
    expect(
      new Set(
        result.schools.map((school) => school.exportGuide.catalogueVersion),
      ),
    ).toEqual(new Set(["integration-v2"]))
    const unknown = result.schools.find(
      (school) => school.exportGuide.providerSlug === "future-provider",
    )
    expect(unknown?.assistant.slug).toBe("generic")
    expect(unknown?.exportGuide).toMatchObject({
      providerSlug: "future-provider",
      requireProgramme: true,
      requireConnect: true,
    })
    const known = result.schools.find(({ name }) => name === "Known provider")
    expect(known?.assistant.slug).toBe("ade")
    expect(known?.exportGuide.providerSlug).toBe("ade")
  })

  it("never mixes catalogue versions during concurrent pointer replacement", async () => {
    await schoolFactory().create({ name: "Concurrent A", assistant: "ade" })
    await schoolFactory().create({
      name: "Concurrent B",
      assistant: "future-provider",
    })
    const { fr, en } = await candidate("concurrent-v3")
    const [result] = await Promise.all([
      schools.findSchools(),
      publication.publish(fr, en),
    ])
    expect(
      new Set(
        result.schools.map(({ exportGuide }) => exportGuide.catalogueVersion),
      ).size,
    ).toBe(1)
    expect(catalogues.capture().activeVersion).toBe("concurrent-v3")
  })

  it("keeps the previous snapshot visible when an asset is missing", async () => {
    const before = catalogues.capture()
    const { fr, en } = await candidate("missing-assets")
    fr.providers[0].pages[0].image.url = `${origin}/missing.png`
    en.providers[0].pages[0].image.url = `${origin}/missing.png`
    await expect(publication.publish(fr, en)).rejects.toThrow()
    expect(catalogues.capture()).toBe(before)
    expect(catalogues.find("missing-assets")).toBeUndefined()
  })

  it.each(["stage", "commitStaged"] as const)(
    "keeps the previous snapshot visible when %s fails",
    async (method) => {
      const before = catalogues.capture()
      const version = `failed-${method}`
      const { fr, en } = await candidate(version)
      const spy = jest.spyOn(catalogues, method).mockImplementationOnce(() => {
        throw new Error("injected storage failure")
      })
      await expect(publication.publish(fr, en)).rejects.toThrow(
        "injected storage failure",
      )
      expect(catalogues.capture()).toBe(before)
      expect(catalogues.find(version)).toBeUndefined()
      spy.mockRestore()
    },
  )

  it("rolls back without rewriting retained representations", async () => {
    const retained = [...catalogues.capture().retained.keys()][0]
    const object = catalogues.find(retained)
    publication.rollback(retained)
    expect(catalogues.capture().active).toBe(object)
  })
})
