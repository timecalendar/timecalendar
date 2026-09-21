import { readFileSync } from "node:fs"

const expectedSha = process.argv[2]
const files = process.argv.slice(3)
const safeAxisIds = [
  "export-guide-real-server",
  "production-protected-routes",
  "production-no-network",
]

if (!expectedSha || files.length !== 2) {
  throw new Error(
    "usage: check-export-guide-evidence.mjs <sha> <android.json> <ios.json>",
  )
}

const failures = []
const documents = files.map((file) => {
  try {
    return JSON.parse(readFileSync(file, "utf8"))
  } catch {
    failures.push("evidence-malformed")
    return null
  }
})

for (const platform of ["android", "ios"]) {
  const document = documents.find(
    (candidate) => candidate?.platform === platform,
  )
  if (!document) {
    failures.push(`${platform}:platform-result`)
    continue
  }
  if (document.schemaVersion !== 1) failures.push(`${platform}:schema-version`)
  if (
    document.targetSha !== expectedSha ||
    document.serverSha !== expectedSha
  ) {
    failures.push(`${platform}:target-sha`)
  }
  if (document.suite !== "export-guide") failures.push(`${platform}:suite`)
  for (const axis of safeAxisIds) {
    if (document.axes?.[axis] !== "passed") failures.push(`${platform}:${axis}`)
  }
  for (const field of [
    "workflowRun",
    "recordedAtUtc",
    "appIdentity",
    "runtimeVariant",
    "buildConfiguration",
    "fixtureVersion",
    "runnerImage",
    "deviceModel",
    "osRuntime",
    "toolchain",
  ]) {
    if (typeof document[field] !== "string" || document[field].length === 0) {
      failures.push(`${platform}:provenance-${field}`)
    }
  }
}

if (failures.length > 0) {
  console.error([...new Set(failures)].sort().join("\n"))
  process.exit(1)
}
console.log(`export-guide evidence complete for ${expectedSha}`)
