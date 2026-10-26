import type * as TypeScript from "typescript"

const { existsSync, readdirSync, readFileSync, statSync } = jest.requireActual(
  "node:fs",
) as typeof import("node:fs")
const { dirname, relative, resolve } = jest.requireActual(
  "node:path",
) as typeof import("node:path")
const ts = jest.requireActual("typescript") as typeof TypeScript

// The static value-import graph of src/ (ADR 068). Tests are not importers;
// type-only imports never reach the bundle, so they are not edges.

const root = process.cwd()
const srcRoot = resolve(root, "src")
const sourcePattern = /\.tsx?$/
const testPattern = /\.test\.tsx?$/
const candidateSuffixes = [
  "",
  ".ts",
  ".tsx",
  "/index.ts",
  "/index.tsx",
] as const
const platformSuffixes = [
  ".ios.ts",
  ".android.ts",
  ".ios.tsx",
  ".android.tsx",
] as const

const toId = (path: string) => relative(root, path)

function sourceFiles(directory = srcRoot): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    const isNode =
      sourcePattern.test(entry.name) &&
      !testPattern.test(entry.name) &&
      !entry.name.endsWith(".d.ts")
    return isNode ? [path] : []
  })
}

function isFile(path: string) {
  return existsSync(path) && statSync(path).isFile()
}

function resolveSpecifier(from: string, specifier: string): string[] | null {
  const base = specifier.startsWith("@/assets/")
    ? resolve(root, specifier.slice(2))
    : specifier.startsWith("@/")
      ? resolve(srcRoot, specifier.slice(2))
      : resolve(dirname(from), specifier)
  for (const suffix of candidateSuffixes) {
    const path = base + suffix
    if (isFile(path) && sourcePattern.test(path)) return [path]
  }
  const platformFiles = platformSuffixes
    .map((suffix) => base + suffix)
    .filter(isFile)
  if (platformFiles.length > 0) return platformFiles
  if (isFile(base) || isFile(`${base}.js`)) return []
  return null
}

const allTypeOnly = (elements: readonly { isTypeOnly: boolean }[]) =>
  elements.length > 0 && elements.every((element) => element.isTypeOnly)

function isTypeOnlyImport(node: TypeScript.ImportDeclaration) {
  const clause = node.importClause
  if (!clause) return false
  if (clause.isTypeOnly) return true
  if (clause.name) return false
  const bindings = clause.namedBindings
  return (
    bindings !== undefined &&
    ts.isNamedImports(bindings) &&
    allTypeOnly(bindings.elements)
  )
}

function isTypeOnlyExport(node: TypeScript.ExportDeclaration) {
  if (node.isTypeOnly) return true
  const clause = node.exportClause
  return (
    clause !== undefined &&
    ts.isNamedExports(clause) &&
    allTypeOnly(clause.elements)
  )
}

function valueSpecifiers(path: string): string[] {
  const source = ts.createSourceFile(
    path,
    readFileSync(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const specifiers: string[] = []
  const visit = (node: TypeScript.Node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      !isTypeOnlyImport(node)
    ) {
      specifiers.push(node.moduleSpecifier.text)
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier !== undefined &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      !isTypeOnlyExport(node)
    ) {
      specifiers.push(node.moduleSpecifier.text)
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === "require"))
    ) {
      const [argument] = node.arguments
      if (argument !== undefined && ts.isStringLiteral(argument)) {
        specifiers.push(argument.text)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return specifiers.filter(
    (specifier) => specifier.startsWith("@/") || specifier.startsWith("."),
  )
}

type Graph = Map<string, string[]>

function buildGraph() {
  const graph: Graph = new Map()
  const unresolved: string[] = []
  for (const path of sourceFiles()) {
    const targets = valueSpecifiers(path).flatMap((specifier) => {
      const resolved = resolveSpecifier(path, specifier)
      if (resolved === null) {
        unresolved.push(`${toId(path)} → ${specifier}`)
        return []
      }
      return resolved.map(toId)
    })
    graph.set(toId(path), [...new Set(targets)])
  }
  return { graph, unresolved }
}

const { graph, unresolved } = buildGraph()

const isGalleryNode = (id: string) =>
  id.startsWith("src/design/gallery/") || id.endsWith(".gallery.tsx")

const mayReachGallery = (id: string) =>
  isGalleryNode(id) ||
  id.startsWith("src/features/developer/ui/") ||
  id === "src/app/developer.tsx" ||
  id.startsWith("src/app/developer/")

function pathToGallery(from: string): string[] | null {
  const previous = new Map<string, string | null>([[from, null]])
  const queue = [from]
  while (queue.length > 0) {
    const current = queue.shift()!
    if (current !== from && isGalleryNode(current)) {
      const path = [current]
      let step = previous.get(current)
      while (step != null) {
        path.unshift(step)
        step = previous.get(step)
      }
      return path
    }
    for (const next of graph.get(current) ?? []) {
      if (!previous.has(next)) {
        previous.set(next, current)
        queue.push(next)
      }
    }
  }
  return null
}

function stronglyConnectedComponents(): string[][] {
  const index = new Map<string, number>()
  const lowLink = new Map<string, number>()
  const onStack = new Set<string>()
  const stack: string[] = []
  const components: string[][] = []
  let counter = 0

  const connect = (node: string) => {
    index.set(node, counter)
    lowLink.set(node, counter)
    counter += 1
    stack.push(node)
    onStack.add(node)
    for (const next of graph.get(node) ?? []) {
      if (!index.has(next)) {
        connect(next)
        lowLink.set(node, Math.min(lowLink.get(node)!, lowLink.get(next)!))
      } else if (onStack.has(next)) {
        lowLink.set(node, Math.min(lowLink.get(node)!, index.get(next)!))
      }
    }
    if (lowLink.get(node) === index.get(node)) {
      const component: string[] = []
      let member: string
      do {
        member = stack.pop()!
        onStack.delete(member)
        component.push(member)
      } while (member !== node)
      components.push(component)
    }
  }

  for (const node of graph.keys()) if (!index.has(node)) connect(node)
  return components
}

describe("design import graph", () => {
  it("resolves every in-repo specifier", () => {
    expect(unresolved).toEqual([])
  })

  it("sees the edges it must see", () => {
    expect(
      graph.get("src/features/developer/ui/gallery-index-screen.tsx"),
    ).toContain("src/design/gallery/index.ts")
    expect(graph.get("src/design/gallery/registry.ts")).toContain(
      "src/design/button/button.gallery.tsx",
    )
    expect(pathToGallery("src/app/developer/gallery.tsx")).not.toBeNull()
  })

  it("keeps the @/design barrel off every gallery module", () => {
    expect(pathToGallery("src/design/index.ts")).toBeNull()
  })

  it("lets only the developer UI, its routes, fixtures and the gallery reach a gallery module", () => {
    const leaks = [...graph.keys()]
      .filter((id) => !mayReachGallery(id))
      .map((id) => pathToGallery(id))
      .filter((path): path is string[] => path !== null)
      .map((path) => path.join(" → "))
    expect(leaks).toEqual([])
  })

  it("keeps Settings free of the gallery", () => {
    expect(
      pathToGallery("src/features/settings/ui/settings-screen.tsx"),
    ).toBeNull()
  })

  it("closes no require cycle through src/design/", () => {
    const cycles = stronglyConnectedComponents()
      .filter(
        (component) =>
          (component.length > 1 ||
            component.some((id) => graph.get(id)?.includes(id))) &&
          component.some((id) => id.startsWith("src/design/")),
      )
      .map((component) => component.sort().join(" ⇄ "))
    expect(cycles).toEqual([])
  })
})
