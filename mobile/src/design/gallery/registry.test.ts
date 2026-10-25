import { render } from "@testing-library/react-native"
import { createElement, type ReactNode } from "react"
import type { TestInstance } from "test-renderer"

import { galleryEntries } from "@/design"
import { usePlatform } from "@/test-support/platform"

import { galleryModules } from "./registry"
import { isGalleryEntryAvailable } from "./stories"
import { GalleryStoryContent } from "./story-content"

const { readFileSync, readdirSync } = jest.requireActual("node:fs") as {
  readFileSync(path: string, encoding: "utf8"): string
  readdirSync(
    path: string,
    options: { withFileTypes: true },
  ): { name: string; isDirectory(): boolean; isFile(): boolean }[]
}
const { relative, resolve } = jest.requireActual("node:path") as {
  relative(from: string, to: string): string
  resolve(...paths: string[]): string
}

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  Stack: { Screen: (): ReactNode => null },
}))

let mockScheme: "light" | "dark" = "light"
jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => mockScheme,
}))

const srcRoot = resolve(process.cwd(), "src")

function fixtureFilesOnDisk(directory = srcRoot): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) return fixtureFilesOnDisk(path)
    return entry.isFile() && entry.name.endsWith(".gallery.tsx")
      ? [relative(srcRoot, path)]
      : []
  })
}

function registeredFixtureFiles(): string[] {
  const source = readFileSync(resolve(__dirname, "registry.ts"), "utf8")
  return [...source.matchAll(/import \* as \w+ from "@\/([^"]+)"/g)].map(
    ([, path]) => `${path}.tsx`,
  )
}

function duplicates(values: readonly string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) !== index)
}

const ACTIVATION_PROPS = [
  "onClick",
  "onPress",
  "onResponderRelease",
  "onValueChange",
  "onCheckedChange",
  "onSelect",
  "onChange",
] as const

function isInteractive(node: TestInstance): boolean {
  return (
    node.type !== "TextInput" &&
    ACTIVATION_PROPS.some((prop) => typeof node.props[prop] === "function")
  )
}

// Both platforms merge a control's descendants into its one accessibility
// node (SwiftUI Button content, Compose mergeDescendants), so a child's text or
// content description names the control.
function accessibleName(node: TestInstance): string {
  const own = node.props.accessibilityLabel ?? node.props["aria-label"]
  if (typeof own === "string" && own.trim()) return own
  return node.children
    .map((child) => (typeof child === "string" ? child : accessibleName(child)))
    .join(" ")
    .trim()
}

function accessibilityViolations(root: TestInstance): string[] {
  const controls = root.queryAll(isInteractive).flatMap((node) => {
    const problems = [
      ...(node.props.accessibilityRole || node.props.role ? [] : ["role"]),
      ...(accessibleName(node) ? [] : ["label"]),
    ]
    return problems.length
      ? [`${String(node.props.testID)} missing ${problems.join(" and ")}`]
      : []
  })
  const inputs = root
    .queryAll((node) => node.type === "TextInput")
    .filter((node) => !String(node.props.accessibilityLabel ?? "").trim())
    .map((node) => `${String(node.props.testID)} missing label`)
  return [...controls, ...inputs]
}

describe("gallery registry", () => {
  it("registers every fixture file under src/ and nothing else", () => {
    expect(registeredFixtureFiles().sort()).toEqual(fixtureFilesOnDisk().sort())
    expect(galleryModules).toHaveLength(registeredFixtureFiles().length)
  })

  it("keeps meta ids, titles and story ids unique", () => {
    expect(duplicates(galleryModules.map((m) => m.default.id))).toEqual([])
    expect(duplicates(galleryModules.map((m) => m.default.title))).toEqual([])
    expect(duplicates(galleryEntries.map((entry) => entry.id))).toEqual([])
  })

  it("orders every story export exactly once in its meta", () => {
    for (const module of galleryModules) {
      const exports = Object.keys(module).filter((name) => name !== "default")
      expect([...module.default.stories].sort()).toEqual(exports.sort())
      expect(duplicates(module.default.stories)).toEqual([])
    }
  })

  it("gives every story a render function or args", () => {
    const incomplete = galleryEntries
      .filter((entry) => !entry.story.render && !entry.story.args)
      .map((entry) => entry.id)
    expect(incomplete).toEqual([])
  })
})

describe.each(["ios", "android"] as const)("gallery stories on %s", (os) => {
  usePlatform(os)

  describe.each(["light", "dark"] as const)("in %s mode", (scheme) => {
    let consoleError: jest.SpyInstance

    beforeEach(() => {
      mockScheme = scheme
      consoleError = jest.spyOn(console, "error")
    })

    afterEach(() => {
      consoleError.mockRestore()
    })

    it.each(
      galleryEntries
        .filter((entry) => isGalleryEntryAvailable(entry, os))
        .map((entry) => [entry.id, entry] as const),
    )("renders %s with accessible controls", async (id, entry) => {
      const view = await render(createElement(GalleryStoryContent, { entry }))
      expect(consoleError).not.toHaveBeenCalled()
      expect({
        story: id,
        platform: os,
        violations: accessibilityViolations(view.container),
      }).toEqual({ story: id, platform: os, violations: [] })
    })
  })
})
