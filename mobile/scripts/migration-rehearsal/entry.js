if (!__DEV__) throw new Error("Migration rehearsal is debug-only")
require("@expo/metro-runtime")

const { createRehearsalTransport } = require("./transport.cjs")
const transport = createRehearsalTransport(globalThis.fetch.bind(globalThis))
globalThis.fetch = transport.fetch
const startup = []
const mark = (phase, checks = {}) => {
  const event = { phase, ...checks }
  startup.push(event)
  console.info("[migration-rehearsal]", JSON.stringify(event))
}
mark("transport_installed")

globalThis.__migrationRehearsal = {
  setMode: (...args) => transport.setMode(...args),
  setReportEndpoint: (endpoint) => transport.setReportEndpoint(endpoint),
  status: () => ({ ...transport.status(), startup: [...startup] }),
  snapshot: (...args) => require("./readback.cjs").snapshot(...args),
  deliverReports: () =>
    require("@/features/legacy-migration/data/runtime").deliverMigrationReports(),
}

try {
  const { applicationId } = require("expo-application")
  const Constants = require("expo-constants").default
  mark("identity_checked", {
    productionIdentity: applicationId === "fr.samuelprak.timecalendar",
    productionCapability:
      (Constants.expoConfig?.extra?.backendEnvironmentCapability ??
        "production") === "production",
  })
  const { App } = require("./root")
  mark("router_required")
  const {
    renderRootComponent,
  } = require("expo-router/build/renderRootComponent")
  renderRootComponent(App)
  mark("root_registered")
  setTimeout(() => mark("timer_alive"), 1000)
} catch {
  mark("root_registration_failed")
  throw new Error("Synthetic rehearsal root registration failed")
}
