import * as path from "path"
import { EXPORT_GUIDE_FEATURE_FLAG } from "modules/export-guide/services/export-guide.service"
import { Loader } from "typeorm-fixtures-cli/dist"

describe("feature-flag fixtures", () => {
  it("enable the export-guide flag the service evaluates", () => {
    const loader = new Loader()
    loader.load(path.resolve(__dirname, "feature-flag.fixtures.yml"))

    const items = loader.fixtureConfigs
      .filter((config) => config.entity === "FeatureFlag")
      .flatMap((config) => Object.values(config.items))

    expect(items).toContainEqual(
      expect.objectContaining({
        key: EXPORT_GUIDE_FEATURE_FLAG,
        enabled: true,
      }),
    )
  })
})
