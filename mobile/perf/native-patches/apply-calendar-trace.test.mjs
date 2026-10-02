import assert from "node:assert/strict"
import { createRequire } from "node:module"
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, test } from "node:test"

const require = createRequire(import.meta.url)
const {
  applyCalendarTrace,
  assertCalendarTraceAbsent,
  PRISTINE_SHA256,
  TRACED_SHA256,
} = require("./apply-calendar-trace.js")

const sourceRelative =
  "ReactAndroid/src/main/java/com/facebook/react/views/scroll/ReactHorizontalScrollView.java"
const installedSource = join(
  import.meta.dirname,
  "../../node_modules/react-native",
  sourceRelative,
)
const fixtures = []

function fixture(version = "0.85.3") {
  const projectRoot = mkdtempSync(join(tmpdir(), "calendar-native-trace-"))
  fixtures.push(projectRoot)
  const rnRoot = join(projectRoot, "node_modules/react-native")
  const source = join(rnRoot, sourceRelative)
  mkdirSync(dirname(source), { recursive: true })
  writeFileSync(join(rnRoot, "package.json"), JSON.stringify({ version }))
  writeFileSync(source, readFileSync(installedSource))
  return { projectRoot, source }
}

afterEach(() => {
  for (const directory of fixtures.splice(0))
    rmSync(directory, { recursive: true, force: true })
})

test("applies the version-checked patch exactly once and blocks non-perf builds", () => {
  const { projectRoot, source } = fixture()
  assert.doesNotThrow(() => assertCalendarTraceAbsent(projectRoot))
  assert.equal(applyCalendarTrace(projectRoot, "perf"), TRACED_SHA256)
  const patched = readFileSync(source, "utf8")
  assert.match(patched, /CALENDAR_NATIVE_PAGING/)
  assert.match(patched, /owned-calendar-pager/)
  assert.match(patched, /fr\.samuelprak\.timecalendar\.perf/)
  assert.match(patched, /interceptDown eventTime=/)
  assert.ok(
    patched.indexOf("interceptDown eventTime=") <
      patched.indexOf("super.onInterceptTouchEvent(ev)"),
  )
  assert.ok(
    patched.indexOf(
      "cancelPostTouchScrolling();",
      patched.indexOf("interceptDown eventTime="),
    ) < patched.indexOf("super.onInterceptTouchEvent(ev)"),
  )
  assert.match(patched, /pendingRunnable=/)
  assert.match(patched, /mScroller\.getFinalX\(\) == mCalendarTraceTarget/)
  assert.match(patched, /Math\.abs\(candidate - getScrollX\(\)\) <= interval/)
  assert.match(patched, /inputVelocityX == 0/)
  assert.match(patched, /mScroller\.startScroll\(/)
  assert.match(patched, /Math\.min\(96, Math\.round\(96f \* distance/)
  assert.match(patched, /ev\.getPointerCount\(\) > 1/)
  assert.match(
    patched,
    /mCalendarDownContentRange != computeHorizontalScrollRange\(\)/,
  )
  assert.match(patched, /mCalendarDownWidth != getWidth\(\)/)
  assert.match(patched, /reversed = direction != Integer\.signum/)
  assert.match(
    patched,
    /!mCalendarInNativeTouch[\s\S]*?!mCalendarInNativeScroll/,
  )
  const programmaticScroll = patched.slice(
    patched.indexOf("public void scrollTo(int x, int y)"),
    patched.indexOf("super.scrollTo(x, y);"),
  )
  assert.doesNotMatch(programmaticScroll, /x != getScrollX\(\)/)
  assert.match(
    patched,
    /protected void onDetachedFromWindow\(\) \{[\s\S]*?mCalendarCarryTarget = NO_SCROLL_POSITION;/,
  )
  assert.equal(applyCalendarTrace(projectRoot, "perf"), TRACED_SHA256)
  assert.equal(readFileSync(source, "utf8"), patched)
  assert.throws(() => assertCalendarTraceAbsent(projectRoot), /pristine/)
})

test("rejects a non-perf application and unknown native source", () => {
  const { projectRoot, source } = fixture()
  assert.throws(
    () => applyCalendarTrace(projectRoot, "production"),
    /perf variant/,
  )
  assert.equal(
    readFileSync(source, "utf8").includes("CALENDAR_NATIVE_PAGING"),
    false,
  )
  writeFileSync(
    source,
    `${readFileSync(source, "utf8")}\n// unexpected source\n`,
  )
  assert.throws(() => applyCalendarTrace(projectRoot, "perf"), /Unknown RN/)
  assert.throws(() => assertCalendarTraceAbsent(projectRoot), /pristine/)
})

test("rejects another React Native version before patching", () => {
  const { projectRoot } = fixture("0.85.4")
  assert.throws(
    () => applyCalendarTrace(projectRoot, "perf"),
    /requires RN 0\.85\.3/,
  )
  assert.match(PRISTINE_SHA256, /^[0-9a-f]{64}$/)
})
