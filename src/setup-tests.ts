/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config({ path: `${__dirname}/../.env` })

import MockDate from "mockdate"
import { Connection } from "typeorm"
import { runMigrations } from "./modules/shared/utils/run-migrations"
import {
  clearNestTestApps,
  getNestTestApps,
} from "./test-utils/create-nest-app"
import { ormconfigTest } from "./test-utils/typeorm-test-module"

/** Modules mock */
jest.mock("axios")

jest.setTimeout(60000)

beforeAll(() => runMigrations(ormconfigTest, { log: false }))

// Clear database
afterEach(() =>
  Promise.all(
    getNestTestApps()
      .map((app) => app.get(Connection))
      .filter((connection) => connection)
      .map((connection) => {
        Promise.all(
          connection.entityMetadatas.map((entity) => {
            connection.getRepository(entity.name).clear()
          }),
        )
      }),
  ),
)

afterEach(() => MockDate.reset())

afterAll(async () => {
  await Promise.all([clearNestTestApps()])
})
