// Touches come from a virtual HID multi-touch screen created through
// /system/bin/hid (uhid). SELinux denies the shell writes to the real
// touchscreen's evdev node on Android 15, `adb shell input` has no second
// pointer, and monkey's injected drags do not move React Native scroll views.
// One hid process plays a whole scenario with millisecond delays, so a chained
// swipe's next touch lands while the previous page is still settling.

export const FRAME_MS = 8
const REGISTER_SETTLE_MS = 1500
const RELEASE_SETTLE_MS = 500
const CONTACTS = 2

const le16 = (value) => [value & 0xff, (value >> 8) & 0xff]

const fingerDescriptor = (width, height) => [
  0x09,
  0x22,
  0xa1,
  0x02,
  0x09,
  0x42,
  0x15,
  0x00,
  0x25,
  0x01,
  0x75,
  0x01,
  0x95,
  0x01,
  0x81,
  0x02,
  0x75,
  0x07,
  0x95,
  0x01,
  0x81,
  0x03,
  0x09,
  0x51,
  0x25,
  0x0f,
  0x75,
  0x08,
  0x95,
  0x01,
  0x81,
  0x02,
  0x05,
  0x01,
  0x09,
  0x30,
  0x15,
  0x00,
  0x26,
  ...le16(width - 1),
  0x75,
  0x10,
  0x95,
  0x01,
  0x81,
  0x02,
  0x09,
  0x31,
  0x26,
  ...le16(height - 1),
  0x81,
  0x02,
  0x05,
  0x0d,
  0xc0,
]

const touchscreenDescriptor = (width, height) => [
  0x05,
  0x0d,
  0x09,
  0x04,
  0xa1,
  0x01,
  0x85,
  0x01,
  ...Array.from({ length: CONTACTS }, () =>
    fingerDescriptor(width, height),
  ).flat(),
  0x09,
  0x54,
  0x15,
  0x00,
  0x25,
  CONTACTS,
  0x75,
  0x08,
  0x95,
  0x01,
  0x81,
  0x02,
  0xc0,
]

// A lifting contact is reported once with its tip switch off; a report with a
// contact count of zero is dropped by hid-multitouch and leaves the finger down.
const report = (pointers) => [
  1,
  ...Array.from({ length: CONTACTS }, (_, slot) => {
    const pointer = pointers.find((candidate) => candidate.slot === slot)
    if (!pointer) return [0, slot, 0, 0, 0, 0]
    return [
      pointer.lifted ? 0 : 1,
      slot,
      ...le16(Math.round(pointer.x)),
      ...le16(Math.round(pointer.y)),
    ]
  }).flat(),
  pointers.length,
]

const easeOut = (t) => 1 - (1 - t) ** 2

// All pointers go down together, follow their paths for durationMs, and lift
// together one frame later.
const stroke = (startMs, durationMs, paths, ease = (t) => t) => {
  const frames = []
  const steps = Math.max(2, Math.round(durationMs / FRAME_MS))
  const at = (t) => paths.map((path, slot) => ({ slot, ...path(ease(t)) }))
  for (let step = 0; step <= steps; step += 1) {
    frames.push({
      atMs: startMs + (step * durationMs) / steps,
      pointers: at(step / steps),
    })
  }
  frames.push({
    atMs: startMs + durationMs + FRAME_MS,
    pointers: at(1).map((pointer) => ({ ...pointer, lifted: true })),
  })
  return frames
}

const line = (from, to) => (t) => ({
  x: from.x + (to.x - from.x) * t,
  y: from.y + (to.y - from.y) * t,
})

const horizontalStroke = (screen, direction, angleDegrees = 0) => {
  const y = screen.height * 0.6
  const halfRise =
    (Math.tan((angleDegrees * Math.PI) / 180) * screen.width * 0.7) / 2
  const right = { x: screen.width * 0.9, y: y + halfRise }
  const left = { x: screen.width * 0.2, y: y - halfRise }
  return direction === "forward" ? line(right, left) : line(left, right)
}

// `directions` lists each swipe's direction; an angle tilts every swipe upward
// along its travel, as a thumb does.
export const swipeChain = (
  screen,
  { directions, strokeMs, gapMs, angleDegrees = 0 },
) =>
  directions
    .map((direction, index) =>
      stroke(
        index * (strokeMs + gapMs),
        strokeMs,
        [horizontalStroke(screen, direction, angleDegrees)],
        easeOut,
      ),
    )
    .flat()

export const verticalScroll = (screen, { count, strokeMs, gapMs }) => {
  const x = screen.width * 0.6
  const low = { x, y: screen.height * 0.8 }
  const high = { x, y: screen.height * 0.35 }
  return Array.from({ length: count }, (_, index) => {
    const [from, to] = index % 2 === 0 ? [low, high] : [high, low]
    return stroke(
      index * (strokeMs + gapMs),
      strokeMs,
      [line(from, to)],
      easeOut,
    )
  }).flat()
}

// Spreads two fingers vertically around the timeline centre, then closes them,
// in one continuous touch so the whole gesture is a single pinch.
export const pinch = (screen, { durationMs, minGap, maxGap }) => {
  const centre = { x: screen.width * 0.6, y: screen.height * 0.55 }
  const gapAt = (t) =>
    minGap + (maxGap - minGap) * (t < 0.5 ? t * 2 : (1 - t) * 2)
  const finger = (sign) => (t) => ({
    x: centre.x + sign * 40,
    y: centre.y + (sign * gapAt(t)) / 2,
  })
  return stroke(0, durationMs, [finger(-1), finger(1)])
}

export const toHidScript = (frames, screen) => {
  const events = [
    {
      id: 1,
      command: "register",
      name: "perf-harness-touch",
      vid: 0x18d1,
      pid: 0x4ee7,
      bus: "usb",
      descriptor: touchscreenDescriptor(screen.width, screen.height),
    },
    { id: 1, command: "delay", duration: REGISTER_SETTLE_MS },
  ]
  let previousMs = 0
  for (const frame of frames) {
    const waitMs = Math.round(frame.atMs - previousMs)
    if (waitMs > 0) events.push({ id: 1, command: "delay", duration: waitMs })
    previousMs += waitMs
    events.push({ id: 1, command: "report", report: report(frame.pointers) })
  }
  events.push({ id: 1, command: "delay", duration: RELEASE_SETTLE_MS })
  return `${events.map((event) => JSON.stringify(event)).join("\n")}\n`
}

export const plannedDurationMs = (frames) =>
  Math.round(frames.at(-1)?.atMs ?? 0)

export const HID_OVERHEAD_MS = REGISTER_SETTLE_MS + RELEASE_SETTLE_MS
