import { SharedDatabaseModule } from "@lyrolab/nest-shared/database"
import { NestExpressApplication } from "@nestjs/platform-express"
import {
  createE2eExportGuideCatalogue,
  E2E_EXPORT_GUIDE_ASSET_ORIGIN,
  E2E_EXPORT_GUIDE_VERSION,
} from "modules/export-guide/data/initial-export-guide-catalogue"
import { EXPORT_GUIDE_SCHEMA_VERSION } from "modules/export-guide/models/export-guide.model"
import { ExportGuideCatalogueValidator } from "modules/export-guide/validation/export-guide-catalogue.validator"
import { FeatureFlagModule } from "modules/feature-flag/feature-flag.module"
import { FeatureFlag } from "modules/feature-flag/models/entities/feature-flag.entity"
import { School } from "modules/school/models/school.entity"
import { SchoolModule } from "modules/school/school.module"
import createTestApp from "test-utils/create-test-app"
import { DataSource } from "typeorm"
import {
  E2E_EXPORT_GUIDE_FLAG,
  E2E_EXPORT_GUIDE_SCHOOLS,
  seedE2eExportGuide,
} from "./seed-e2e-export-guide"

describe("E2E export-guide seed", () => {
  let app: NestExpressApplication
  let dataSource: DataSource

  beforeAll(async () => {
    app = await createTestApp({ imports: [SchoolModule, FeatureFlagModule] })
    dataSource = SharedDatabaseModule.getTestDataSource()
  })

  afterAll(async () => app.close())

  it("writes the complete idempotent test-only school and flag world", async () => {
    await expect(seedE2eExportGuide(dataSource, "test")).resolves.toBe(true)
    await expect(seedE2eExportGuide(dataSource, "test")).resolves.toBe(true)

    const schools = await dataSource.getRepository(School).find({
      where: E2E_EXPORT_GUIDE_SCHOOLS.map(({ code }) => ({ code })),
      order: { code: "ASC" },
    })
    expect(schools).toHaveLength(E2E_EXPORT_GUIDE_SCHOOLS.length)
    expect(
      E2E_EXPORT_GUIDE_SCHOOLS.find(({ code }) => code === "e2e-export-unsafe")
        ?.intranetUrl,
    ).toMatch(/^ftp:/)
    expect(
      schools.map(({ code, assistant, intranetUrl }) => ({
        code,
        assistant,
        intranetUrl,
      })),
    ).toEqual(
      [...E2E_EXPORT_GUIDE_SCHOOLS]
        .sort((left, right) => left.code.localeCompare(right.code))
        .map(({ code, assistant, intranetUrl }) => ({
          code,
          assistant,
          intranetUrl,
        })),
    )
    await expect(
      dataSource.getRepository(FeatureFlag).findOneByOrFail({
        key: E2E_EXPORT_GUIDE_FLAG,
      }),
    ).resolves.toMatchObject({ enabled: true })
  })

  it("does not create proof rows outside NODE_ENV=test", async () => {
    await dataSource
      .getRepository(School)
      .delete(E2E_EXPORT_GUIDE_SCHOOLS.map(({ code }) => ({ code })))
    await dataSource
      .getRepository(FeatureFlag)
      .delete({ key: E2E_EXPORT_GUIDE_FLAG })

    await expect(seedE2eExportGuide(dataSource, "development")).resolves.toBe(
      false,
    )
    await expect(
      dataSource.getRepository(School).count({
        where: E2E_EXPORT_GUIDE_SCHOOLS.map(({ code }) => ({ code })),
      }),
    ).resolves.toBe(0)
    await expect(
      dataSource.getRepository(FeatureFlag).countBy({
        key: E2E_EXPORT_GUIDE_FLAG,
      }),
    ).resolves.toBe(0)
  })

  it("builds deterministic validated bilingual catalogues with one broken image", () => {
    const validator = new ExportGuideCatalogueValidator()
    const fr = createE2eExportGuideCatalogue("fr")
    const en = createE2eExportGuideCatalogue("en")

    expect(() => validator.validatePair(fr, en)).not.toThrow()
    for (const catalogue of [fr, en]) {
      expect(catalogue).toMatchObject({
        schemaVersion: EXPORT_GUIDE_SCHEMA_VERSION,
        catalogueVersion: E2E_EXPORT_GUIDE_VERSION,
      })
      expect(catalogue.providers.map(({ slug }) => slug)).toEqual([
        "ade",
        "hplanning",
        "celcat",
        "generic",
      ])
      const images = catalogue.providers
        .flatMap(({ pages }) => pages)
        .flatMap(({ image }) => (image ? [image] : []))
      expect(images.length).toBeGreaterThan(0)
      expect(
        images.every(
          ({ url }) => new URL(url).origin === E2E_EXPORT_GUIDE_ASSET_ORIGIN,
        ),
      ).toBe(true)
      expect(
        catalogue.providers
          .flatMap(({ pages }) => pages)
          .filter(({ image }) => image?.url.includes("controlled-broken.png")),
      ).toHaveLength(1)
    }
  })
})
