const { readFileSync, readdirSync } = jest.requireActual("node:fs") as {
  readFileSync(path: string, encoding: "utf8"): string
  readdirSync(
    path: string,
    options: { recursive: true; encoding: "utf8" },
  ): string[]
}
const { resolve } = jest.requireActual("node:path") as {
  resolve(...paths: string[]): string
}

const SMALL_BOLD = /\btype=\{?\s*["']smallBold["']/
const PRIMARY = /\bthemeColor=\{?\s*["']primary["']/

function smallBoldPrimaryElements(source: string): string[] {
  return [...source.matchAll(/<[A-Z][\w.]*(?:=>|[^>])*>/g)]
    .map(([element]) => element)
    .filter((element) => SMALL_BOLD.test(element) && PRIMARY.test(element))
}

function sourceFiles(): string[] {
  const root = resolve(process.cwd(), "src")
  return readdirSync(root, { recursive: true, encoding: "utf8" })
    .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file))
    .map((file) => resolve(root, file))
}

describe("brand-colored small text", () => {
  it("detects the forbidden pairing in any prop order or layout", () => {
    expect(
      smallBoldPrimaryElements(`
        <ThemedText
          themeColor="primary"
          onPress={() => skip()}
          type="smallBold"
        >Skip</ThemedText>
        <ThemedText type="smallBold" themeColor="actionText">Back</ThemedText>
        <ThemedText themeColor="primary">T</ThemedText>
      `),
    ).toHaveLength(1)
  })

  it("never renders smallBold text in the primary tone", () => {
    const files = sourceFiles()
    expect(files.length).toBeGreaterThan(100)
    const offenders = files.flatMap((file) =>
      smallBoldPrimaryElements(readFileSync(file, "utf8")).map(
        (element) => `${file}: ${element}`,
      ),
    )
    expect(offenders).toEqual([])
  })
})
