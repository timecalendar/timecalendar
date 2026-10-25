import { render, screen } from "@testing-library/react-native"
import type { ComponentType, ReactNode } from "react"

import * as developerUi from "./index"

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

jest.mock("expo-router", () => {
  const { Text: MockText } = jest.requireActual("react-native")
  return {
    router: { push: jest.fn() },
    useLocalSearchParams: () => ({ story: "native-settings--rows" }),
    Redirect: ({ href }: { href: string }) => (
      <MockText testID="redirect">{href}</MockText>
    ),
    Stack: { Screen: (): ReactNode => null },
  }
})

jest.mock("@/features/environment", () => ({
  getBackendEnvironmentCapability: () => "production",
  useEnvironmentSelector: () => ({ capability: "production" }),
  EnvironmentSettingsRow: () => null,
  EnvironmentSelectorDialog: () => null,
}))

const appRoot = resolve(process.cwd(), "src/app")

function routeFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) return routeFiles(path)
    return entry.name.endsWith(".tsx") ? [relative(appRoot, path)] : []
  })
}

const developerRoutes = [
  "developer.tsx",
  ...routeFiles(resolve(appRoot, "developer")),
].sort()

const THIN_EXPORT =
  /^export \{ (\w+) as default \} from "@\/features\/developer\/ui"$/

it("discovers the whole /developer subtree", () => {
  expect(developerRoutes).toEqual([
    "developer.tsx",
    "developer/gallery.tsx",
    "developer/gallery/[story].tsx",
  ])
})

it.each(developerRoutes)(
  "%s is a thin developer-ui export that redirects in production",
  async (route) => {
    const source = readFileSync(resolve(appRoot, route), "utf8").trim()
    const screenName = source.match(THIN_EXPORT)?.[1]
    expect({ route, screenName }).toEqual({
      route,
      screenName: expect.any(String),
    })
    const Screen = (developerUi as Record<string, ComponentType | undefined>)[
      screenName ?? ""
    ]
    if (!Screen) throw new Error(`${route} re-exports no developer screen`)

    await render(<Screen />)
    expect({
      route,
      redirect: screen.getByTestId("redirect").props.children,
      content: screen
        .queryAllByTestId(/^(gallery|developer)-/)
        .map((node) => node.props.testID),
    }).toEqual({ route, redirect: "/settings", content: [] })
  },
)
