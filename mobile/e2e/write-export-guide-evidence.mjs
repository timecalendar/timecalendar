import { writeFileSync } from "node:fs"

const required = (name) => {
  const value = process.env[name]
  if (!value) throw new Error(`missing evidence field: ${name}`)
  return value
}

const output = process.argv[2]
if (!output)
  throw new Error("usage: write-export-guide-evidence.mjs <output.json>")

const document = {
  schemaVersion: 1,
  targetSha: required("TARGET_SHA"),
  workflowRun: required("WORKFLOW_RUN"),
  recordedAtUtc: new Date().toISOString(),
  suite: "export-guide",
  platform: required("PLATFORM"),
  appIdentity: required("APP_IDENTITY"),
  runtimeVariant: "development-release-config+production-identity-guard",
  buildConfiguration: "Release",
  serverSha: required("TARGET_SHA"),
  fixtureVersion: required("FIXTURE_VERSION"),
  runnerImage: required("RUNNER_IMAGE"),
  deviceModel: required("DEVICE_MODEL"),
  osRuntime: required("OS_RUNTIME"),
  toolchain: required("TOOLCHAIN"),
  axes: {
    "export-guide-real-server": required("EXPORT_GUIDE_RESULT"),
    "production-protected-routes": required("PRODUCTION_GUARD_RESULT"),
    "production-no-network": required("NO_NETWORK_RESULT"),
  },
}

writeFileSync(output, `${JSON.stringify(document, null, 2)}\n`)
const lines = [
  "# Export-guide release proof",
  "",
  `- Target SHA: \`${document.targetSha}\``,
  `- Workflow run: ${document.workflowRun}`,
  `- Platform: ${document.platform}`,
  `- Build: ${document.appIdentity} / ${document.runtimeVariant} / Release`,
  `- Fixture: ${document.fixtureVersion}`,
  `- Runner/device: ${document.runnerImage} / ${document.deviceModel} / ${document.osRuntime}`,
  `- Toolchain: ${document.toolchain}`,
  `- Recorded UTC: ${document.recordedAtUtc}`,
  "",
  "| Axis | Result |",
  "| --- | --- |",
  ...Object.entries(document.axes).map(
    ([axis, result]) => `| ${axis} | ${result} |`,
  ),
  "",
]
writeFileSync(output.replace(/\.json$/, ".md"), lines.join("\n"))
