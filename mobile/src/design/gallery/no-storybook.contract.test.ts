const { existsSync, readFileSync } = jest.requireActual("node:fs") as {
  existsSync(path: string): boolean
  readFileSync(path: string, encoding: "utf8"): string
}
const { resolve } = jest.requireActual("node:path") as {
  resolve(...paths: string[]): string
}

const FORBIDDEN = [/^storybook$/, /^@storybook\//, /^react-native-web$/]
const FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
] as const

it("declares no Storybook or react-native-web package (ADR 064)", () => {
  const manifest = JSON.parse(
    readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
  ) as Partial<Record<(typeof FIELDS)[number], Record<string, string>>>
  const declared = FIELDS.flatMap((field) => Object.keys(manifest[field] ?? {}))
  expect(
    declared.filter((name) => FORBIDDEN.some((pattern) => pattern.test(name))),
  ).toEqual([])
})

it("carries no Storybook configuration directory (ADR 064)", () => {
  expect(
    [".storybook", ".rnstorybook"].filter((directory) =>
      existsSync(resolve(process.cwd(), directory)),
    ),
  ).toEqual([])
})
