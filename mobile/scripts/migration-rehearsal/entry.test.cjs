const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const test = require("node:test")
const vm = require("node:vm")

const entry = readFileSync(`${__dirname}/entry.js`, "utf8")

function runEntry(dev = true, appId = "fr.samuelprak.timecalendar") {
  const calls = []
  const messages = []
  const timers = []
  const App = () => null
  const transport = require("./transport.cjs").createRehearsalTransport(() =>
    assert.fail("unexpected network request"),
  )
  const modules = {
    "@expo/metro-runtime": {},
    "./transport.cjs": { createRehearsalTransport: () => transport },
    "expo-application": { applicationId: appId },
    "expo-constants": { default: {} },
    "./root": { App },
    "expo-router/build/renderRootComponent": {
      renderRootComponent: (component) => assert.equal(component, App),
    },
  }
  const context = {
    __DEV__: dev,
    fetch: () => assert.fail("unexpected original transport"),
    console: { info: (...args) => messages.push(args) },
    setTimeout: (callback) => timers.push(callback),
    require(name) {
      calls.push(name)
      assert(Object.hasOwn(modules, name), `Unexpected module: ${name}`)
      return modules[name]
    },
  }
  vm.runInNewContext(entry, context)
  timers.forEach((timer) => timer())
  return { context, calls, messages }
}

test("rehearsal startup installs offline transport before registering the real router root", () => {
  const { context, calls, messages } = runEntry()
  const status = context.__migrationRehearsal.status()
  assert.equal(status.mode, "offline")
  assert.equal(calls[0], "@expo/metro-runtime")
  assert(calls.indexOf("./transport.cjs") < calls.indexOf("./root"))
  assert.deepEqual(
    Array.from(status.startup, (event) => event.phase),
    [
      "transport_installed",
      "identity_checked",
      "router_required",
      "root_registered",
      "timer_alive",
    ],
  )
  assert.equal(status.startup[1].productionIdentity, true)
  assert.equal(status.startup[1].productionCapability, true)
  assert.equal(messages.length, 5)
})

test("entry refuses release execution and does not log an unexpected native identity", () => {
  assert.throws(() => runEntry(false), /debug-only/)
  const { context, messages } = runEntry(true, "SYNTHETIC_PRIVATE_ID")
  assert.equal(
    context.__migrationRehearsal.status().startup[1].productionIdentity,
    false,
  )
  assert(!JSON.stringify(messages).includes("SYNTHETIC_PRIVATE_ID"))
})

test("rehearsal root uses shipping route context and provider with explicit application location", () => {
  const ctx = Symbol("shipping route context")
  const ExpoRoot = Symbol("ExpoRoot")
  const Provider = Symbol("Head.Provider")
  const modules = {
    react: {
      createElement: (component, props, child) => ({ component, props, child }),
      useEffect: (effect) => effect(),
    },
    "expo-router/_ctx": { ctx },
    "expo-router/build/ExpoRoot": { ExpoRoot },
    "expo-router/build/head": { Head: { Provider } },
    "expo-router/build/fast-refresh": {},
  }
  const context = {
    module: { exports: {} },
    require: (name) => modules[name],
    console: { info() {} },
  }
  vm.runInNewContext(readFileSync(`${__dirname}/root.js`, "utf8"), context)
  const rendered = context.module.exports.App()
  assert.equal(rendered.component, Provider)
  assert.equal(rendered.child.component, ExpoRoot)
  assert.equal(rendered.child.props.context, ctx)
  assert.equal(rendered.child.props.location, "/")
})
