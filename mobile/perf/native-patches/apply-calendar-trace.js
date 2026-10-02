const { execFileSync } = require("node:child_process")
const { createHash } = require("node:crypto")
const fs = require("node:fs")
const path = require("node:path")

const REACT_NATIVE_VERSION = "0.85.3"
const SOURCE =
  "ReactAndroid/src/main/java/com/facebook/react/views/scroll/ReactHorizontalScrollView.java"
const PRISTINE_SHA256 =
  "6904d1897c2bb9531fb89e867d2e42db4a12dd7a3430da2f6e70336f399998e1"
const TRACED_SHA256 =
  "34c15695f105c912db2092cca6d2ed2452c8436a34e7888dc37c6f421aa723d9"
const PATCH_SHA256 =
  "eba4051f71c04d903d9829349392b20a97d3e18904bad6bfdcfe6fdc5488cfed"
const PATCH = path.join(__dirname, "react-native-0.85.3-calendar-trace.patch")

const digest = (file) =>
  createHash("sha256").update(fs.readFileSync(file)).digest("hex")

function reactNativeSource(projectRoot) {
  const reactNativeRoot = path.join(projectRoot, "node_modules/react-native")
  const version = JSON.parse(
    fs.readFileSync(path.join(reactNativeRoot, "package.json"), "utf8"),
  ).version
  if (version !== REACT_NATIVE_VERSION) {
    throw new Error(
      `Calendar native trace requires RN ${REACT_NATIVE_VERSION}; found ${version}`,
    )
  }
  return { reactNativeRoot, source: path.join(reactNativeRoot, SOURCE) }
}

function applyCalendarTrace(projectRoot, variant) {
  if (variant !== "perf") {
    throw new Error("Calendar native trace is restricted to the perf variant")
  }
  if (digest(PATCH) !== PATCH_SHA256) {
    throw new Error("Calendar native trace patch digest changed")
  }

  const { reactNativeRoot, source } = reactNativeSource(projectRoot)
  const before = digest(source)
  if (before === TRACED_SHA256) return TRACED_SHA256
  if (before !== PRISTINE_SHA256) {
    throw new Error(`Unknown RN horizontal ScrollView source digest: ${before}`)
  }

  execFileSync("git", ["apply", "--check", PATCH], { cwd: reactNativeRoot })
  execFileSync("git", ["apply", PATCH], { cwd: reactNativeRoot })
  const after = digest(source)
  if (after !== TRACED_SHA256) {
    throw new Error(
      `Calendar native trace applied with unexpected digest: ${after}`,
    )
  }
  return after
}

function assertCalendarTraceAbsent(projectRoot) {
  const { source } = reactNativeSource(projectRoot)
  if (digest(source) !== PRISTINE_SHA256) {
    throw new Error(
      "Non-perf build requires pristine RN horizontal ScrollView source",
    )
  }
}

module.exports = {
  applyCalendarTrace,
  assertCalendarTraceAbsent,
  PRISTINE_SHA256,
  TRACED_SHA256,
}
