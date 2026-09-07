import { readFileSync } from "node:fs"
import { join } from "node:path"

import packageJson from "./package.json"

const FULL_FLAGS = [
  ".",
  "--no-telemetry",
  "--no-score",
  "--no-supply-chain",
  "--verbose",
  "--no-cache",
  "--blocking",
  "none",
]

const CHANGED_FLAGS = [
  ".",
  "--no-telemetry",
  "--no-score",
  "--no-supply-chain",
  "--verbose",
  "--no-cache",
  "--scope",
  "changed",
  "--base",
  "origin/main",
  "--blocking",
  "warning",
]

function commandArguments(command: string | undefined): string[] {
  expect(command).toBeDefined()
  const [binary, ...arguments_] = command!.split(" ")
  expect(binary).toBe("react-doctor")
  return arguments_
}

describe("React Doctor repository contract", () => {
  it("pins the scanner and keeps the full mobile scan advisory", () => {
    expect(packageJson.devDependencies["react-doctor"]).toBe("0.9.13")
    expect(commandArguments(packageJson.scripts["react-doctor"])).toEqual(
      FULL_FLAGS,
    )
  })

  it("blocks new warnings relative to origin/main", () => {
    expect(
      commandArguments(packageJson.scripts["react-doctor:changed"]),
    ).toEqual(CHANGED_FLAGS)
  })

  it("fetches base history and runs the changed-code gate after install", () => {
    const workflow = readFileSync(
      join(__dirname, "../.github/workflows/ci-mobile.yml"),
      "utf8",
    )
    const install = workflow.indexOf("run: npm ci")
    const doctor = workflow.indexOf("run: npm run react-doctor:changed")

    expect(workflow).toContain("fetch-depth: 0")
    expect(workflow).toContain(
      "name: Check changed mobile code with React Doctor",
    )
    expect(workflow).toContain("working-directory: ./mobile")
    expect(install).toBeGreaterThan(-1)
    expect(doctor).toBeGreaterThan(install)
  })
})
