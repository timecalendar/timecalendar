import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"

const root = mkdtempSync(join(tmpdir(), "export-guide-evidence-"))
const checker = new URL("./check-export-guide-evidence.mjs", import.meta.url)
  .pathname
const sha = "a".repeat(40)
const make = (platform, change = {}) => ({
  schemaVersion: 1,
  targetSha: sha,
  serverSha: sha,
  workflowRun: "run-1",
  recordedAtUtc: "2026-09-08T00:00:00.000Z",
  suite: "export-guide",
  platform,
  appIdentity: "production-and-development",
  runtimeVariant: "development-release-config+production-identity-guard",
  buildConfiguration: "Release",
  fixtureVersion: "2026-09-08.t4",
  runnerImage: "runner",
  deviceModel: "device",
  osRuntime: "runtime",
  toolchain: "toolchain",
  axes: {
    "export-guide-real-server": "passed",
    "production-protected-routes": "passed",
    "production-no-network": "passed",
  },
  ...change,
})
const write = (name, value) => {
  const file = join(root, name)
  writeFileSync(file, `${JSON.stringify(value)}\n`)
  return file
}
const run = (android, ios, expected = sha) =>
  spawnSync(process.execPath, [checker, expected, android, ios], {
    encoding: "utf8",
  })

const android = write("android.json", make("android"))
const ios = write("ios.json", make("ios"))
assert.equal(run(android, ios).status, 0)

for (const [name, mutation, diagnostic] of [
  ["different-sha", { targetSha: "b".repeat(40) }, "target-sha"],
  ["missing-axis", { axes: {} }, "export-guide-real-server"],
  [
    "skipped",
    {
      axes: { ...make("android").axes, "export-guide-real-server": "skipped" },
    },
    "export-guide-real-server",
  ],
  [
    "cancelled",
    {
      axes: {
        ...make("android").axes,
        "production-protected-routes": "cancelled",
      },
    },
    "production-protected-routes",
  ],
  [
    "failed",
    { axes: { ...make("android").axes, "production-no-network": "failed" } },
    "production-no-network",
  ],
  ["incomplete", { fixtureVersion: "" }, "provenance-fixtureVersion"],
]) {
  const result = run(write(`${name}.json`, make("android", mutation)), ios)
  assert.notEqual(result.status, 0, name)
  assert.match(result.stderr, new RegExp(diagnostic), name)
}
const malformed = join(root, "malformed.json")
writeFileSync(malformed, "not json")
assert.match(run(malformed, ios).stderr, /evidence-malformed/)
assert.match(run(android, android).stderr, /ios:platform-result/)
console.log("[check-export-guide-evidence] PASS")
