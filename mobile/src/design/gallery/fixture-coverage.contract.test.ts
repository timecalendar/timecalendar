const { existsSync, readdirSync } = jest.requireActual("node:fs") as {
  existsSync(path: string): boolean
  readdirSync(
    path: string,
    options: { withFileTypes: true },
  ): { name: string; isDirectory(): boolean; isFile(): boolean }[]
}
const { relative, resolve } = jest.requireActual("node:path") as {
  relative(from: string, to: string): string
  resolve(...paths: string[]): string
}

const designRoot = resolve(process.cwd(), "src/design")

// Gallery plumbing, not design primitives: it renders fixtures, it has none.
const galleryInfrastructure = ["gallery/story-content.tsx"]

function componentModules(directory = designRoot): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) return componentModules(path)
    const isModule =
      entry.isFile() &&
      entry.name.endsWith(".tsx") &&
      !entry.name.endsWith(".test.tsx") &&
      !entry.name.endsWith(".gallery.tsx")
    return isModule ? [relative(designRoot, path)] : []
  })
}

const sibling = (module: string, suffix: string) =>
  resolve(designRoot, module.replace(/\.tsx$/, suffix))

it("names only gallery infrastructure that exists", () => {
  expect(
    galleryInfrastructure.filter(
      (module) => !existsSync(resolve(designRoot, module)),
    ),
  ).toEqual([])
})

it("ships every design primitive with a fixture and a test (L10)", () => {
  const missing = componentModules()
    .filter((module) => !galleryInfrastructure.includes(module))
    .flatMap((module) =>
      [".gallery.tsx", ".test.tsx"]
        .filter((suffix) => !existsSync(sibling(module, suffix)))
        .map((suffix) => `${module} has no sibling *${suffix}`),
    )
  expect(missing).toEqual([])
})
