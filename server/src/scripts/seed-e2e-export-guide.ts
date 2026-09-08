import { FeatureFlag } from "modules/feature-flag/models/entities/feature-flag.entity"
import { EXPORT_GUIDE_FEATURE_FLAG } from "modules/export-guide/services/export-guide.service"
import { School } from "modules/school/models/school.entity"
import { DataSource } from "typeorm"

export const E2E_EXPORT_GUIDE_FLAG = EXPORT_GUIDE_FEATURE_FLAG

export const E2E_EXPORT_GUIDE_SCHOOLS = Object.freeze([
  {
    code: "e2e-export-ade",
    name: "E2E Export ADE Safe",
    assistant: "ade",
    intranetUrl: "https://connect.example.com/export",
  },
  {
    code: "e2e-export-future",
    name: "E2E Export Future Provider",
    assistant: "future-provider",
    intranetUrl: "https://connect.example.com/future",
  },
  {
    code: "e2e-export-missing",
    name: "E2E Export Missing Connect",
    assistant: "celcat",
    intranetUrl: null,
  },
  {
    code: "e2e-export-unsafe",
    name: "E2E Export Unsafe Connect",
    assistant: "hplanning",
    intranetUrl: "http://connect.example.com/export",
  },
] as const)

export const seedE2eExportGuide = async (
  dataSource: DataSource,
  environment = process.env.NODE_ENV,
): Promise<boolean> => {
  if (environment !== "test") return false

  const schools = dataSource.getRepository(School)
  for (const fixture of E2E_EXPORT_GUIDE_SCHOOLS) {
    const existing = await schools.findOneBy({ code: fixture.code })
    await schools.save(
      schools.create({
        ...existing,
        ...fixture,
        siteUrl: "https://example.com",
        imageUrl: "/schools/e2e-export-guide.png",
        imageUrlDark: null,
        visible: true,
        fallbackAssistant: null,
      }),
    )
  }

  const flags = dataSource.getRepository(FeatureFlag)
  const existingFlag = await flags.findOneBy({ key: E2E_EXPORT_GUIDE_FLAG })
  await flags.save(
    flags.create({
      ...existingFlag,
      key: E2E_EXPORT_GUIDE_FLAG,
      name: "Native export guide E2E proof",
      description: "Enabled only in the disposable test seed.",
      enabled: true,
    }),
  )
  return true
}
