const React = require("react")
const { ctx } = require("expo-router/_ctx")
const { ExpoRoot } = require("expo-router/build/ExpoRoot")
const { Head } = require("expo-router/build/head")
require("expo-router/build/fast-refresh")

function App() {
  React.useEffect(() => {
    console.info("[migration-rehearsal]", '{"phase":"root_mounted"}')
  }, [])
  // The raw development bundle URL is transport metadata, not an application route.
  return React.createElement(
    Head.Provider,
    null,
    React.createElement(ExpoRoot, { context: ctx, location: "/" }),
  )
}

module.exports = { App }
