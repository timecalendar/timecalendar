import * as path from "path"
import { program } from "commander"
import glob from "glob-promise"
import ormconfig from "ormconfig"
import { Connection, createConnection, getRepository } from "typeorm"
import {
  Builder,
  fixturesIterator,
  Loader,
  Parser,
  Resolver,
} from "typeorm-fixtures-cli/dist"
import { runMigrations } from "modules/shared/utils/run-migrations"

program.option("--drop")
program.parse()

const loadFixtures = async (connection: Connection, fixturesPath: string) => {
  try {
    const loader = new Loader()
    loader.load(path.resolve(fixturesPath))

    const resolver = new Resolver()
    const fixtures = resolver.resolve(loader.fixtureConfigs)
    const builder = new Builder(connection, new Parser())

    for (const fixture of fixturesIterator(fixtures)) {
      const entity = await builder.build(fixture)
      await getRepository(entity.constructor.name).save(entity)
    }
  } catch (err) {
    throw err
  } finally {
    if (connection) {
      await connection.close()
    }
  }
}

const main = async () => {
  const options = program.opts<{ drop: boolean }>()

  const connection = await createConnection(ormconfig)

  if (options.drop) {
    await connection.dropDatabase()
    await connection.runMigrations()
  }

  const files = await glob("./**/fixtures/*.yml")
  for (const file of files) {
    loadFixtures(connection, file)
  }
}

main()
