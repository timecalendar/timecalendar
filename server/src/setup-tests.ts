/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config({ path: `${__dirname}/../.env` })

import { WTF_DEBUG } from "config/constants"
import { sleep } from "modules/shared/helpers/sleep"
import { clearDatabase } from "modules/shared/utils/clear-database"
import { runMigrations } from "modules/shared/utils/run-migrations"
import { clearNestTestApps, getNestTestApps } from "test-utils/create-nest-app"
import { dataSourceOptionsForTest } from "test-utils/typeorm/typeorm-test-module"
import { DataSource } from "typeorm"
import wtf from "wtfnode"

// Enable wtfDebug to debug the "Jest did not exit one second after the test run has completed." error
const wtfDebug = WTF_DEBUG

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

afterAll(async () => {
  await Promise.all([clearNestTestApps()])

  if (wtfDebug) {
    wtf.dump()
    await sleep(5000).then(() => wtf.dump())
  }
})
