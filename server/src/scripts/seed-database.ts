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
  try {
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
  } finally {
    if (dataSource) {
      await dataSource.destroy()
    }
  }
}

const main = async () => {
  const options = program.opts<Options>()

  const dataSource = await new DataSource({
    ...dataSourceOptions,
    logging: true,
  }).initialize()

  if (options.drop) {
    await dataSource.dropDatabase()
    await dataSource.runMigrations()
  }

  const files = await glob("./**/fixtures/*.yml")
  loadFixtures(dataSource, files)
}

main()
