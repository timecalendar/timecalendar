const assert = require("node:assert/strict")
const { test } = require("node:test")
const {
  createRuntime,
  fixture,
  handlers,
  find,
  mix,
  paintedGeometry,
} = require("./calendar-worklet-runtime.cjs")

function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`)
}
function tileProps(tile, settledPixelsPerHour) {
  return {
    tile,
    settledPixelsPerHour,
    handlers,
    t: () => "View details",
    pageKey: "day:1",
    dateKey: "2026-06-15",
  }
}
function assertLiveTile(runtime, tree, tile, scale) {
  const painted = paintedGeometry(runtime.snapshot(tree))
  const slices = painted.filter((node) => node.color === "red")
  assert.equal(slices.length, 3)
  const expectedTop =
    Math.round((tile.startMinute / 60) * scale * 3) / 3 -
    (tile.shape === "point" ? 2 : 0)
  const height =
    tile.shape === "point"
      ? 4
      : Math.max(((tile.endMinute - tile.startMinute) / 60) * scale, 1 / 3)
  close(slices[0].top, expectedTop)
  close(slices[2].top + slices[2].height, expectedTop + height)
  const clip = painted.find(
    (node) => node.color === undefined && node.height !== undefined,
  )
  close(clip.height, height)
  for (const text of painted.filter((node) => node.type === "Text"))
    close(text.textScale, 1)
  return slices
}

for (const tile of [
  fixture(),
  fixture("interval", 600, 602),
  fixture("interval", 600, 601),
  fixture("point", 600, 600),
]) {
  test(`compiled worklets subscribe and track every live surface: ${tile.shape} ${tile.endMinute - tile.startMinute}m`, () => {
    const runtime = createRuntime()
    const tree = runtime.render(
      runtime.page.TimedCalendarTile,
      tileProps(tile, 60),
    )
    assert.equal(runtime.styles.length, 5)
    assert.equal(
      runtime.listeners.size,
      5,
      "anchor, middle, bottom, clip and inverse text each need a mapper input",
    )
    const capHeight = assertLiveTile(runtime, tree, tile, 60)[0].height
    // No component render between writes: two pinches in opposite directions,
    // then cancellation back to its baseline and another pinch.
    for (const scale of [65, 80, 90, 75, 50, 40, 50, 60, 120, 60]) {
      runtime.pixelsPerHour.set(scale)
      close(assertLiveTile(runtime, tree, tile, scale)[0].height, capHeight)
    }
    for (const style of runtime.styles) assert.equal(style.runs, 11)
  })
}

for (const [before, after] of [
  [60, 80],
  [80, 60],
  [60, 120],
  [120, 40],
  [40, 90],
]) {
  test(`both native settlement orders preserve all visible geometry: ${before} -> ${after}`, () => {
    const runtime = createRuntime(before)
    const cases = [
      [runtime.page.TimedCalendarTile, tileProps(fixture(), before)],
      [
        runtime.page.TimedCalendarTile,
        tileProps(fixture("interval", 600, 601), before),
      ],
      [
        runtime.page.TimedCalendarTile,
        tileProps(fixture("point", 600, 600), before),
      ],
      [
        runtime.canvas.GridLine,
        { minute: 600, color: "gray", settledPixelsPerHour: before },
      ],
      [
        runtime.canvas.GridLine,
        { minute: 660, color: "gray", settledPixelsPerHour: before },
      ],
      [
        runtime.canvas.HourLabel,
        { hour: 10, label: "10:00", settledPixelsPerHour: before },
      ],
      [
        runtime.page.NowIndicator,
        {
          testID: "now",
          minuteOfDay: 600,
          color: "blue",
          accessibilityLabel: "Now",
          settledPixelsPerHour: before,
        },
      ],
    ]
    for (const [Component, props] of cases) {
      runtime.pixelsPerHour.set(before)
      const tree = runtime.render(Component, props)
      runtime.pixelsPerHour.set(after)
      const held = runtime.snapshot(tree)
      const settled = runtime.snapshot(
        runtime.render(Component, { ...props, settledPixelsPerHour: after }),
      )
      // Paint has two independently delivered inputs. Enumerate both one-frame
      // mixed states instead of trusting final rendered styles or an onLayout.
      const geometry = (value) =>
        paintedGeometry(value).filter(
          (node) =>
            node.type !== "Text" || Component === runtime.canvas.HourLabel,
        )
      for (const frame of [mix(settled, held), mix(held, settled), settled]) {
        assert.deepEqual(geometry(frame), geometry(held), Component.name)
      }
    }
  })
}

for (const platform of ["ios", "android"]) {
  test(`settled native targets and focus observers follow consecutive zooms on ${platform}`, () => {
    const runtime = createRuntime(60, platform)
    for (const tile of [
      fixture(),
      fixture("interval", 0, 1),
      fixture("interval", 1439, 1440),
      fixture("point", 600, 600),
    ]) {
      for (const scale of [60, 80, 120, 40, 60]) {
        runtime.pixelsPerHour.set(scale)
        const tree = runtime.snapshot(
          runtime.render(
            runtime.page.TimedCalendarTile,
            tileProps(tile, scale),
          ),
        )
        const target = find(
          tree,
          (node) => node.props?.testID === "owned-calendar-event-fixture",
        )
        const button = find(target, (node) => node.type === "Pressable")
        const observer = find(target, (node) => node.type === "FocusObserver")
        const height =
          tile.shape === "point"
            ? 4
            : ((tile.endMinute - tile.startMinute) / 60) * scale
        const top =
          Math.round((tile.startMinute / 60) * scale * 3) / 3 -
          (tile.shape === "point" ? 2 : 0)
        const targetHeight = Math.max(height, platform === "ios" ? 44 : 48)
        close(target.layout.height, targetHeight)
        close(
          target.layout.top,
          Math.max(
            0,
            Math.min(
              top + height / 2 - targetHeight / 2,
              24 * scale - targetHeight,
            ),
          ),
        )
        assert.deepEqual(target.animated, {})
        assert.equal(button.props.accessibilityLabel, "Fixture")
        assert.equal(observer.props.identity, tile.key)
        assert.equal(button.layout.flex, 1)
        assert.equal(observer.layout.flex, 1)
      }
    }
  })
}
