import { NestExpressApplication } from "@nestjs/platform-express"
import request from "lib/supertest"
import { schoolFactory } from "modules/school/factories/school.factory"
import { schoolProfileFactory } from "modules/school/factories/school-profile.factory"
import { SchoolModule } from "modules/school/school.module"
import createTestApp from "test-utils/create-test-app"

describe("SchoolController", () => {
  let app: NestExpressApplication

  beforeAll(async () => {
    app = await createTestApp({ imports: [SchoolModule] })
  })

  describe("GET /schools", () => {
    it("returns schools", async () => {
      await schoolFactory().create()
      const { body } = await request(app).get("/schools").expect(200)
      expect(body).toBeDefined()
      expect(body.schools.length).toBe(1)
      expect(body.schools[0].name).toBe("My Gaming Academia")
    })
  })

  describe("GET /schools/:schoolId", () => {
    it("returns a school", async () => {
      const school = await schoolFactory().create()
      const { body } = await request(app)
        .get(`/schools/${school.id}`)
        .expect(200)
      expect(body).toBeDefined()
      expect(body.name).toBe("My Gaming Academia")
    })

    it("returns 400 for invalid UUID", async () => {
      await request(app).get("/schools/invalid-uuid").expect(400)
    })

    it("returns 404 for non-existent school", async () => {
      await request(app)
        .get("/schools/123e4567-e89b-12d3-a456-426614174000")
        .expect(404)
    })
  })

  describe("POST /schools/search", () => {
    it("returns no schools when no match", async () => {
      await schoolFactory().create({ seoUrl: "different-url" })
      const { body } = await request(app)
        .post("/schools/search")
        .send({ seoUrl: "test-url" })
        .expect(201)
      expect(body).toBeDefined()
      expect(body.length).toBe(0)
    })

    it("returns a school matching seoUrl", async () => {
      await schoolFactory().create({ seoUrl: "test-url" })
      const { body } = await request(app)
        .post("/schools/search")
        .send({ seoUrl: "test-url" })
        .expect(201)
      expect(body).toBeDefined()
      expect(body.length).toBe(1)
      expect(body[0].name).toBe("My Gaming Academia")
      expect(body[0].seoUrl).toBe("test-url")
      expect(body[0].profile).toBeUndefined() // No profile associated
    })

    it("does not return hidden schools", async () => {
      await schoolFactory().create({ seoUrl: "test-url", visible: false })
      const { body } = await request(app)
        .post("/schools/search")
        .send({ seoUrl: "test-url" })
        .expect(201)
      expect(body).toBeDefined()
      expect(body.length).toBe(0)
    })

    it("returns multiple schools with same seoUrl", async () => {
      await schoolFactory().create({ seoUrl: "test-url", name: "School A" })
      await schoolFactory().create({ seoUrl: "test-url", name: "School B" })
      await schoolFactory().create({
        seoUrl: "different-url",
        name: "School C",
      })
      const { body } = await request(app)
        .post("/schools/search")
        .send({ seoUrl: "test-url" })
        .expect(201)
      expect(body).toBeDefined()
      expect(body.length).toBe(2)
      expect(body.map((s: any) => s.name).sort()).toEqual([
        "School A",
        "School B",
      ])
    })

    it("returns 400 for missing seoUrl", async () => {
      await request(app).post("/schools/search").send({}).expect(400)
    })

    it("returns 400 for empty seoUrl", async () => {
      await request(app)
        .post("/schools/search")
        .send({ seoUrl: "" })
        .expect(400)
    })

    it("returns 400 for non-string seoUrl", async () => {
      await request(app)
        .post("/schools/search")
        .send({ seoUrl: 123 })
        .expect(400)
    })

    it("transforms school data correctly", async () => {
      await schoolFactory().create({
        seoUrl: "test-url",
        name: "Test School",
        imageUrl: "test-image.jpg",
        assistant: "groups",
        fallbackAssistant: "select",
      })
      const { body } = await request(app)
        .post("/schools/search")
        .send({ seoUrl: "test-url" })
        .expect(201)
      expect(body).toBeDefined()
      expect(body.length).toBe(1)
      expect(body[0]).toMatchObject({
        name: "Test School",
        seoUrl: "test-url",
        assistant: expect.objectContaining({ slug: "groups" }),
        fallbackAssistant: expect.objectContaining({ slug: "select" }),
      })
      expect(body[0].imageUrl).toContain("test-image.jpg")
    })

    it("returns school with profile when profile exists", async () => {
      const school = await schoolFactory().create({
        seoUrl: "test-url",
        name: "Test School",
      })
      await schoolProfileFactory().associations({ school }).create()
      const { body } = await request(app)
        .post("/schools/search")
        .send({ seoUrl: "test-url" })
        .expect(201)
      expect(body).toBeDefined()
      expect(body.length).toBe(1)
      expect(body[0].profile).toBeDefined()
      expect(body[0].profile.campuses).toHaveLength(2)
      expect(body[0].profile.formations).toContain("Informatique")
    })
  })
})
