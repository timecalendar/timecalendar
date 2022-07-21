/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config({ path: `${__dirname}/../.env` })

import MockDate from "mockdate"
import { dataSourceOptionsForTest } from "test-utils/typeorm-test-module"
import { DataSource } from "typeorm"
import { runMigrations } from "modules/shared/utils/run-migrations"
import { clearNestTestApps, getNestTestApps } from "test-utils/create-nest-app"
import { clearDatabase } from "modules/shared/utils/clear-database"

/** Modules mock */
jest.mock("axios")
jest.mock("config/firebase.ts", () => ({}))
// todo: export esiee as provider
jest.mock("modules/storage/firestore", () => ({
  appFirestore: { get: () => Promise.resolve({}) },
}))

jest.setTimeout(60000)

beforeAll(() => runMigrations(dataSourceOptionsForTest))

beforeEach(async () =>
  Promise.all(
    getNestTestApps()
      .map((app) => app.get(DataSource))
      .filter((dataSource) => dataSource)
      .map(clearDatabase),
  ),
)

beforeEach(() => MockDate.reset())

afterAll(async () => {
  await Promise.all([clearNestTestApps()])
})
