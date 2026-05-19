import * as path from "path"
import { program } from "commander"
import { dataSourceOptions } from "data-source"
import glob from "glob-promise"
import { DataSource } from "typeorm"
import {
  Builder,
  fixturesIterator,
  Loader,
  Parser,
  Resolver,
} from "typeorm-fixtures-cli/dist"
import { seedE2eCalendar } from "./seed-e2e-calendar"

interface Options {
  drop?: boolean
  test?: boolean
}

program.option("--drop")
program.parse()

const loadFixtures = async (
  dataSource: DataSource,
  fixturesPaths: string[],
) => {
  const loader = new Loader()
  fixturesPaths.forEach((fixturesPath) =>
    loader.load(path.resolve(fixturesPath)),
  )

  const resolver = new Resolver()
  const fixtures = resolver.resolve(loader.fixtureConfigs)
  const builder = new Builder(dataSource, new Parser(), false)

  for (const fixture of fixturesIterator(fixtures)) {
    const entity = await builder.build(fixture)
    await dataSource.getRepository(entity.constructor.name).save(entity)
  }
}

const main = async () => {
  const options = program.opts<Options>()

  const dataSource = await new DataSource({
    ...dataSourceOptions,
    logging: true,
  }).initialize()

  try {
    if (options.drop) {
      await dataSource.dropDatabase()
      await dataSource.runMigrations()
    }

    const files = await glob("./**/fixtures/*.yml")
    await loadFixtures(dataSource, files)

    // The E2E smoke calendar is seeded here, not via a YAML fixture: its events
    // must be dated relative to the seed run and typeorm-fixtures-cli does not
    // evaluate `<( )>` expressions inside a JSON column. See seed-e2e-calendar.ts.
    // It is scoped to the `test` environment (the E2E harness runs `db:init`
    // with `NODE_ENV=test`) so a normal dev `db:init` leaves the dev DB clean.
    if (process.env.NODE_ENV === "test") {
      await seedE2eCalendar(dataSource)
    }
  } finally {
    await dataSource.destroy()
  }
}

main()
