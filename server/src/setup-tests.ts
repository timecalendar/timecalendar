/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config({ path: `${__dirname}/../.env` })

import { SharedDatabaseModule } from "@lyrolab/nest-shared/database"
import { WTF_DEBUG } from "config/constants"
import { sleep } from "modules/shared/helpers/sleep"
import { clearNestTestApps } from "test-utils/create-nest-app"
// Importing this module evaluates `SharedDatabaseModule.forTest({ entities })`,
// which registers the entity list on the module's static state so the
// `beforeAll(setupTestDatabase)` below can build the worker schema before any
// test compiles a module.
import "test-utils/typeorm/typeorm-test-module"
import wtf from "wtfnode"

// Enable wtfDebug to debug the "Jest did not exit one second after the test run has completed." error
const wtfDebug = WTF_DEBUG

/** Modules mock */
jest.mock("config/firebase.ts", () => ({}))
// todo: export esiee as provider
jest.mock("modules/storage/firestore", () => ({
  appFirestore: { get: () => Promise.resolve({}) },
}))

jest.setTimeout(60000)

// Each Jest worker owns an isolated `${db}_test_${JEST_WORKER_ID}` database,
// created and schema-synced once here. This is what lets the suite run in
// parallel (no shared test DB) — the bespoke serial runner is gone.
beforeAll(() => SharedDatabaseModule.setupTestDatabase())

// Truncate every table between tests on the worker's DataSource.
beforeEach(() => SharedDatabaseModule.clearTestDatabase())

afterAll(async () => {
  await clearNestTestApps()
  await SharedDatabaseModule.closeTestConnection()

  if (wtfDebug) {
    wtf.dump()
    await sleep(5000).then(() => wtf.dump())
  }
})
