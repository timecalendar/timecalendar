import { NestExpressApplication } from "@nestjs/platform-express"
import request from "lib/supertest"
import { FeatureFlagModule } from "modules/feature-flag/feature-flag.module"
import { featureFlagFactory } from "modules/feature-flag/factories/feature-flag.factory"
import createTestApp from "test-utils/create-test-app"

describe("FeatureFlagController", () => {
  let app: NestExpressApplication

  beforeAll(async () => {
    app = await createTestApp({ imports: [FeatureFlagModule] })
  })

  describe("GET /feature-flags/evaluate", () => {
    it("evaluates a single feature flag that is enabled", async () => {
      await featureFlagFactory()
        .params({ key: "enabled-flag", enabled: true })
        .create()

      const { body } = await request(app)
        .get("/feature-flags/evaluate?keys=enabled-flag")
        .expect(200)

      expect(body).toEqual({
        "enabled-flag": true,
      })
    })

    it("evaluates a single feature flag that is disabled", async () => {
      await featureFlagFactory()
        .params({ key: "disabled-flag", enabled: false })
        .create()

      const { body } = await request(app)
        .get("/feature-flags/evaluate?keys=disabled-flag")
        .expect(200)

      expect(body).toEqual({
        "disabled-flag": false,
      })
    })

    it("evaluates multiple feature flags with mixed states", async () => {
      await featureFlagFactory()
        .params({ key: "flag1", enabled: true })
        .create()
      await featureFlagFactory()
        .params({ key: "flag2", enabled: false })
        .create()

      const { body } = await request(app)
        .get("/feature-flags/evaluate?keys=flag1,flag2,non-existent-flag")
        .expect(200)

      expect(body).toEqual({
        flag1: true,
        flag2: false,
        "non-existent-flag": false,
      })
    })

    it("handles flags with whitespace in query", async () => {
      await featureFlagFactory()
        .params({ key: "whitespace-flag1", enabled: true })
        .create()
      await featureFlagFactory()
        .params({ key: "whitespace-flag2", enabled: false })
        .create()

      const { body } = await request(app)
        .get(
          "/feature-flags/evaluate?keys=whitespace-flag1, whitespace-flag2 , non-existent",
        )
        .expect(200)

      expect(body).toEqual({
        "whitespace-flag1": true,
        "whitespace-flag2": false,
        "non-existent": false,
      })
    })

    it("returns false for non-existent feature flags", async () => {
      const { body } = await request(app)
        .get("/feature-flags/evaluate?keys=non-existent-flag")
        .expect(200)

      expect(body).toEqual({
        "non-existent-flag": false,
      })
    })

    it("requires keys parameter", async () => {
      await request(app).get("/feature-flags/evaluate").expect(400)
    })
  })
})
