import { INestApplication } from "@nestjs/common"
import { Test } from "@nestjs/testing"
import request from "supertest"
import { LivenessController } from "./liveness.controller"

describe("LivenessController", () => {
  let app: INestApplication

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [LivenessController],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it("serves process liveness without injected dependencies", async () => {
    expect(LivenessController.length).toBe(0)

    await request(app.getHttpServer())
      .get("/health/live")
      .expect(200)
      .expect({ status: "ok" })
  })
})
