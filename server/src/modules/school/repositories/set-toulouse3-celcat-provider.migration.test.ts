import { NestExpressApplication } from "@nestjs/platform-express"
import { SetToulouse3CelcatProvider1787851000000 } from "migrations/1787851000000-SetToulouse3CelcatProvider"
import { SchoolModule } from "modules/school/school.module"
import { schoolFactory } from "modules/school/factories/school.factory"
import createTestApp from "test-utils/create-test-app"
import { DataSource, QueryRunner } from "typeorm"

describe("SetToulouse3CelcatProvider1787851000000", () => {
  let app: NestExpressApplication
  let dataSource: DataSource
  let runner: QueryRunner
  const migration = new SetToulouse3CelcatProvider1787851000000()

  beforeAll(async () => {
    app = await createTestApp({ imports: [SchoolModule] })
    dataSource = app.get(DataSource)
  })

  afterAll(async () => {
    await app.close()
  })

  it("changes only guarded Toulouse 3 providers and rolls back safely", async () => {
    const toulouse = await schoolFactory().create({
      code: "univtoulouse3",
      assistant: "generic",
    })
    const other = await schoolFactory().create({
      code: "other-school",
      assistant: "generic",
    })
    runner = dataSource.createQueryRunner()
    await runner.connect()
    const read = async (id: string) =>
      (await runner.query(`SELECT * FROM "school" WHERE "id" = $1`, [id]))[0]
    const set = (assistant: string) =>
      runner.query(`UPDATE "school" SET "assistant" = $1 WHERE "id" = $2`, [
        assistant,
        toulouse.id,
      ])
    const originalToulouse = await read(toulouse.id)
    const originalOther = await read(other.id)

    try {
      for (const prior of ["generic", "univtoulouse3"]) {
        await set(prior)
        const before = await read(toulouse.id)
        await migration.up(runner)
        await migration.up(runner)
        expect(await read(toulouse.id)).toEqual({
          ...before,
          assistant: "celcat",
        })
        expect(await read(other.id)).toEqual(originalOther)
        await migration.down(runner)
        await migration.down(runner)
        expect(await read(toulouse.id)).toEqual({
          ...before,
          assistant: "generic",
        })
      }

      for (const prior of ["celcat", "future-provider"]) {
        await set(prior)
        await migration.up(runner)
        expect((await read(toulouse.id)).assistant).toBe(prior)
      }
      await migration.down(runner)
      expect((await read(toulouse.id)).assistant).toBe("future-provider")
      expect(await read(other.id)).toEqual(originalOther)
    } finally {
      await set(originalToulouse.assistant)
      await runner.release()
    }
  })
})
