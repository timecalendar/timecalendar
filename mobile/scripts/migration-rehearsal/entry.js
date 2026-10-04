if (!__DEV__) throw new Error("Migration rehearsal is debug-only")

const { createRehearsalTransport } = require("./transport.cjs")
const transport = createRehearsalTransport(globalThis.fetch.bind(globalThis))
globalThis.fetch = transport.fetch

globalThis.__migrationRehearsal = {
  setMode: (...args) => transport.setMode(...args),
  setReportEndpoint: (endpoint) => transport.setReportEndpoint(endpoint),
  status: () => transport.status(),
  snapshot: (...args) => require("./readback.cjs").snapshot(...args),
  deliverReports: () =>
    require("@/features/legacy-migration/data/runtime").deliverMigrationReports(),
}

require("expo-router/entry")
