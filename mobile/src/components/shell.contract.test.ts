const { readdirSync } = jest.requireActual(
  "node:fs",
) as typeof import("node:fs")
const { resolve } = jest.requireActual(
  "node:path",
) as typeof import("node:path")

// src/components/ is the app shell and the native chrome seam; design
// primitives live in src/design/ behind @/design (ADR 068).
const shell = [
  "app-tabs.test.tsx",
  "app-tabs.tsx",
  "chrome",
  "settings-route-structure.test.ts",
  "shell.contract.test.ts",
]

it("holds only the app shell and the chrome seam", () => {
  const entries = readdirSync(resolve(process.cwd(), "src/components"))
  expect(
    entries.filter((entry) => !entry.startsWith(".") && !shell.includes(entry)),
  ).toEqual([])
})
