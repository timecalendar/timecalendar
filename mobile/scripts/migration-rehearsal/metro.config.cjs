const config = require("../../metro.config.js")
const rewrite = config.server.rewriteRequestUrl

config.maxWorkers = 1
config.server.rewriteRequestUrl = (input) => {
  const resolved = rewrite ? rewrite(input) : input
  const url = new URL(resolved, "http://localhost")
  if (
    /\/(?:node_modules\/expo-router\/entry|\.expo\/\.virtual-metro-entry|index)\.bundle$/.test(
      url.pathname,
    )
  ) {
    if (url.searchParams.get("dev") === "false")
      throw new Error("Rehearsal entry is debug-only")
    url.pathname = "/scripts/migration-rehearsal/entry.bundle"
    url.searchParams.set("transform.routerRoot", "src/app")
    return resolved.startsWith("/")
      ? `${url.pathname}${url.search}`
      : url.toString()
  }
  return resolved
}

module.exports = config
