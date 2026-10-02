// Fails when the React Compiler skips any function in the given sources. The
// production build runs the compiler with `panicThreshold: 'NONE'`, so a
// bail-out never breaks the build: the component silently ships unmemoized.
// This runs the same compiler (resolved through babel-preset-expo, with its
// options) with a logger and turns every bail-out into a failure.
import fs from "node:fs"
import { createRequire } from "node:module"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const mobileRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)
const require = createRequire(path.join(mobileRoot, "package.json"))
const babel = require("@babel/core")
const reactCompiler = createRequire(require.resolve("babel-preset-expo"))(
  "babel-plugin-react-compiler",
)

const DEFAULT_TARGETS = ["src/features/calendar/renderer"]
const FAILURES = new Set(["CompileError", "CompileSkip", "PipelineError"])

function sourceFiles(target) {
  const absolute = path.resolve(mobileRoot, target)
  if (fs.statSync(absolute).isFile()) return [absolute]
  return fs
    .readdirSync(absolute, { recursive: true, encoding: "utf8" })
    .filter(
      (entry) => /\.tsx?$/.test(entry) && !/\.(test|d)\.tsx?$/.test(entry),
    )
    .sort()
    .map((entry) => path.join(absolute, entry))
}

function describe(event) {
  const detail = event.detail?.options ?? event.detail ?? {}
  const reason = detail.reason ?? event.reason ?? JSON.stringify(event.detail)
  const line =
    (detail.loc ?? detail.details?.[0]?.loc ?? event.fnLoc)?.start?.line ?? "?"
  return `${event.kind} at line ${line}: ${detail.category ?? ""} ${reason}`.trim()
}

export function compileReport(file) {
  const events = []
  babel.transformFileSync(file, {
    babelrc: false,
    configFile: false,
    presets: [
      [
        require.resolve("@babel/preset-typescript"),
        { isTSX: true, allExtensions: true },
      ],
    ],
    plugins: [
      [
        reactCompiler,
        {
          target: "19",
          panicThreshold: "none",
          logger: { logEvent: (_filename, event) => events.push(event) },
        },
      ],
    ],
  })
  return {
    compiled: events
      .filter((event) => event.kind === "CompileSuccess")
      .map((event) => event.fnName ?? `line ${event.fnLoc?.start?.line}`),
    failures: events.filter((event) => FAILURES.has(event.kind)).map(describe),
  }
}

export function checkReactCompiler(targets) {
  let compiled = 0
  const failures = []
  for (const file of targets.flatMap(sourceFiles)) {
    const report = compileReport(file)
    compiled += report.compiled.length
    const name = path.relative(mobileRoot, file)
    for (const failure of report.failures) failures.push(`${name}: ${failure}`)
  }
  return { compiled, failures }
}

function selfTest() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "react-compiler-"))
  try {
    const bailout = path.join(directory, "bailout.tsx")
    fs.writeFileSync(
      bailout,
      `import { useRef } from "react"
export function ReadsRefDuringRender() {
  const ref = useRef(0)
  return <>{ref.current}</>
}
`,
    )
    const compiles = path.join(directory, "compiles.tsx")
    fs.writeFileSync(
      compiles,
      `export function Compiles({ label }: { label: string }) {
  return <>{label.toUpperCase()}</>
}
`,
    )
    const failing = checkReactCompiler([bailout])
    if (failing.failures.length === 0)
      throw new Error("self-test: a ref read during render was not reported")
    const passing = checkReactCompiler([compiles])
    if (passing.failures.length > 0 || passing.compiled !== 1)
      throw new Error("self-test: a compilable component was not compiled")
    console.log("react-compiler check self-test passed")
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  if (args.includes("--self-test")) {
    selfTest()
  } else {
    const targets = args.length > 0 ? args : DEFAULT_TARGETS
    const { compiled, failures } = checkReactCompiler(targets)
    if (failures.length > 0 || compiled === 0) {
      for (const failure of failures) console.error(failure)
      if (compiled === 0) console.error("No function was compiled.")
      console.error(`React Compiler bailed out in ${targets.join(", ")}.`)
      process.exit(1)
    }
    console.log(
      `React Compiler compiled ${compiled} functions in ${targets.join(", ")} with no bail-out.`,
    )
  }
}
