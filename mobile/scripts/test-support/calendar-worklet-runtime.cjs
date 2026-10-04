const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const babel = require("@babel/core")

const mobileRoot = path.dirname(require.resolve("../../package.json"))
const rendererRoot =
  process.env.CALENDAR_WORKLET_SOURCE_ROOT ??
  path.join(mobileRoot, "src/features/calendar/renderer")
const compiled = new Map()

function compile(file, extraExports = [], expo = true) {
  const key = `${file}:${extraExports}:${expo}`
  if (!compiled.has(key)) {
    const source =
      fs.readFileSync(file, "utf8") +
      (extraExports.length ? `\nexport { ${extraExports.join(",")} };` : "")
    compiled.set(
      key,
      babel.transformSync(source, {
        filename: file,
        cwd: mobileRoot,
        envName: "development",
        babelrc: false,
        configFile: expo ? path.join(mobileRoot, "babel.config.js") : false,
        presets: expo ? [] : [require.resolve("@babel/preset-typescript")],
        plugins: [require.resolve("@babel/plugin-transform-modules-commonjs")],
        caller: {
          name: "metro",
          platform: "ios",
          isDev: true,
          engine: "hermes",
          supportsStaticESM: true,
          supportsReactCompiler: true,
        },
      }).code,
    )
  }
  return compiled.get(key)
}

function evaluate(code, imports) {
  const module = { exports: {} }
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (name) => {
      if (name.startsWith("@babel/runtime/helpers/")) return require(name)
      assert.ok(name in imports, `Unexpected dependency: ${name}`)
      return imports[name]
    },
    // The real mapper tests plain-object prototypes; use the same realm for
    // inputs and the registry instead of accidentally filtering every object.
    Object,
    Math,
    Map,
    Set,
    Symbol,
    global: { Error },
    queueMicrotask,
    requestAnimationFrame: queueMicrotask,
  })
  return module.exports
}

const mapperFile = path.join(
  mobileRoot,
  "node_modules/react-native-reanimated/src/mappers.ts",
)
const { createMapperRegistry } = evaluate(
  compile(mapperFile, ["createMapperRegistry"], false),
  {
    "react-native-worklets": {},
    "./common": { IS_JEST: true },
    "./isSharedValue": {
      isSharedValue: (value) => value?._isReanimatedSharedValue === true,
    },
  },
)
const timeGrid = evaluate(
  compile(path.join(mobileRoot, "src/features/calendar/data/time-grid.ts")),
  { "./day-key": {} },
)

function createRuntime(initialScale = 60, platform = "ios", pixelRatio = 3) {
  const registry = createMapperRegistry()
  const listeners = new Map()
  let scale = initialScale
  const pixelsPerHour = {
    _isReanimatedSharedValue: true,
    get: () => scale,
    set: (next) => {
      scale = next
      for (const listener of listeners.values()) listener()
    },
    addListener: (id, listener) => listeners.set(id, listener),
    removeListener: (id) => listeners.delete(id),
  }
  let styles = []
  let active = []
  let mapperId = 0
  const animatedStyles = new WeakSet()
  const reanimated = {
    __esModule: true,
    default: { View: "Animated.View", ScrollView: "Animated.ScrollView" },
    useAnimatedStyle: (updater) => {
      assert.ok(
        updater.__closure,
        "Expo must compile the real callback into a worklet",
      )
      const style = {}
      const entry = { updater, style, runs: 0 }
      animatedStyles.add(style)
      styles.push(entry)
      const id = ++mapperId
      active.push(id)
      // Matches useAnimatedStyle's native input selection, then lets the
      // installed mapper registry discover and subscribe to shared values.
      registry.start(
        id,
        () => {
          entry.runs++
          Object.assign(style, updater())
        },
        Object.values(updater.__closure),
      )
      return style
    },
  }
  const jsx = (type, props) => ({ type, props: props ?? {} })
  const imports = {
    react: { useEffect: () => {} },
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "react/compiler-runtime": {
      c: (size) => Array(size).fill(Symbol.for("react.memo_cache_sentinel")),
    },
    "react-native": {
      View: "View",
      Pressable: "Pressable",
      Platform: { OS: platform },
      PixelRatio: { get: () => pixelRatio },
      StyleSheet: {
        create: (value) => value,
        hairlineWidth: 1 / pixelRatio,
        absoluteFill: {
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
      },
    },
    "react-native-gesture-handler": { GestureDetector: "GestureDetector" },
    "react-native-reanimated": reanimated,
    "@/components/themed-text": { ThemedText: "Text" },
    "@/features/calendar/data": { ...timeGrid, PAGE_WINDOW_RADIUS: 260 },
    "@/features/event-checklists": { ChecklistProgressIndicator: "Checklist" },
    "@/theme": { useTheme: () => ({ separator: "gray", primary: "blue" }) },
    "./calendar-focus-observer": { __esModule: true, default: "FocusObserver" },
    "./owned-calendar-paging-log": {
      pagingLog: { mount: () => {}, render: () => {} },
    },
  }
  imports["./owned-calendar-geometry"] = evaluate(
    compile(path.join(rendererRoot, "owned-calendar-geometry.ts")),
    imports,
  )
  const page = evaluate(
    compile(path.join(rendererRoot, "owned-calendar-page.tsx"), [
      "TimedCalendarTile",
      "LiveTileVisual",
      "NowIndicator",
    ]),
    imports,
  )
  const canvas = evaluate(
    compile(path.join(rendererRoot, "owned-calendar-canvas.tsx"), [
      "HourLabel",
      "GridLine",
    ]),
    imports,
  )

  function expand(element) {
    if (element == null || typeof element !== "object") return element
    if (Array.isArray(element)) return element.map(expand)
    if (typeof element.type === "function")
      return expand(element.type(element.props))
    return {
      ...element,
      props: { ...element.props, children: expand(element.props.children) },
    }
  }
  function snapshot(element) {
    if (element == null || typeof element !== "object") return element
    if (Array.isArray(element)) return element.map(snapshot)
    const layout = {},
      animated = {}
    const flatten = (style) => {
      if (Array.isArray(style)) style.forEach(flatten)
      else if (style)
        Object.assign(animatedStyles.has(style) ? animated : layout, style)
    }
    flatten(element.props.style)
    return {
      ...element,
      layout: structuredClone(layout),
      animated: structuredClone(animated),
      props: { ...element.props, children: snapshot(element.props.children) },
    }
  }
  function render(Component, props) {
    active.forEach((id) => registry.stop(id))
    active = []
    styles = []
    return expand(Component({ ...props, pixelsPerHour }))
  }
  return {
    page,
    canvas,
    pixelsPerHour,
    render,
    snapshot,
    listeners,
    get styles() {
      return styles
    },
  }
}

const fixture = (shape = "interval", startMinute = 600, endMinute = 660) => ({
  shape,
  startMinute,
  endMinute,
  startX: 0,
  endX: 1,
  key: "fixture",
  identity: { uid: "fixture" },
  accessibilityOrder: 0,
  accessibilityLabel: "Fixture",
  title: "Fixture",
  location: "Room",
  appearance: {
    surface: "red",
    foreground: "black",
    accent: "blue",
    outline: "gray",
    increasedContrast: false,
  },
})
const handlers = { registerTarget() {}, onEventPress() {}, onEventFocused() {} }

function children(node) {
  return [node?.props?.children]
    .flat(Infinity)
    .filter((child) => child && typeof child === "object")
}
function nodes(tree) {
  return [tree]
    .flat(Infinity)
    .filter(Boolean)
    .flatMap((node) => [node, ...children(node).flatMap(nodes)])
}
function find(tree, predicate) {
  const node = nodes(tree).find(predicate)
  assert.ok(node, "Expected rendered node")
  return node
}
function mix(layout, animation) {
  if (layout == null || typeof layout !== "object") return layout
  if (Array.isArray(layout))
    return layout.map((node, index) => mix(node, animation[index]))
  if (animation == null || typeof animation !== "object") return layout
  assert.equal(layout.type, animation.type)
  return {
    ...layout,
    animated: animation.animated,
    props: {
      ...layout.props,
      children: mix(layout.props.children, animation.props.children),
    },
  }
}
function paintedGeometry(tree) {
  const result = []
  function visit(node, parentY = 0, parentScale = 1) {
    if (!node || typeof node !== "object") return
    if (Array.isArray(node)) {
      node.forEach((child) => visit(child, parentY, parentScale))
      return
    }
    const style = { ...node.layout, ...node.animated }
    const transforms = style.transform ?? []
    const translate = transforms.reduce(
      (value, item) => value + (item.translateY ?? 0),
      0,
    )
    const scale = transforms.reduce(
      (value, item) => value * (item.scaleY ?? 1),
      1,
    )
    const originAdjustment =
      style.transformOrigin === "top"
        ? 0
        : ((style.height ?? 0) / 2) * (1 - scale)
    const top =
      parentY + ((style.top ?? 0) + translate + originAdjustment) * parentScale
    const totalScale = scale * parentScale
    if (
      style.backgroundColor ||
      style.overflow === "hidden" ||
      node.type === "Text"
    ) {
      result.push({
        type: node.type,
        color: style.backgroundColor,
        top,
        height:
          style.height === undefined ? undefined : style.height * totalScale,
        textScale: node.type === "Text" ? totalScale : undefined,
      })
    }
    children(node).forEach((child) => visit(child, top, totalScale))
  }
  visit(tree)
  return result
}

module.exports = {
  createRuntime,
  fixture,
  handlers,
  find,
  mix,
  paintedGeometry,
}
