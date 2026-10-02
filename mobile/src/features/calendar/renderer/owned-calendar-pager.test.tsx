import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { State } from "react-native-gesture-handler"
import {
  fireGestureHandler,
  getByGestureTestId,
} from "react-native-gesture-handler/jest-utils"
import * as Reanimated from "react-native-reanimated"

import {
  buildPagePresentation,
  epochDayKey,
  PAGE_WINDOW_RADIUS,
  type PageIndex,
  pageIndexOfInstant,
  type PagePresentationV1,
  type PageSpace,
  pageStartDay,
} from "@/features/calendar/data"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import i18n from "@/i18n"
import {
  flushUiThread,
  placeCalendarPager,
} from "@/test-support/owned-calendar/pager-driver"

import { pagerPageWidth } from "./owned-calendar-pager"
import { OwnedCalendarShell } from "./owned-calendar-shell"

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn(() => "light"),
}))
jest.mock("@/hooks/use-reduced-motion", () => ({
  useReducedMotion: jest.fn(() => false),
}))

const ZONE = "UTC"
const SPACE: PageSpace = { mode: "week", firstWeekday: 1 }
const ANCHOR = new Date("2026-06-15T00:00:00.000Z")
const ANCHOR_INDEX = pageIndexOfInstant(SPACE, ANCHOR, ZONE)

function presenter() {
  const pages = new Map<PageIndex, PagePresentationV1>()
  return jest.fn((index: PageIndex) => {
    const cached = pages.get(index)
    if (cached !== undefined) return cached
    const page = buildPagePresentation({
      space: SPACE,
      index,
      status: "ready",
      events: [],
      checklist: new Map(),
      environment: {
        locale: "en",
        displayZone: ZONE,
        showWeekends: true,
        scheme: "light",
        increasedContrast: false,
        localizedNoTitle: "(No title)",
        t: i18n.t,
      },
    })
    pages.set(index, page)
    return page
  })
}

const HIDDEN = { includeHiddenElements: true }
const pageId = (index: PageIndex) =>
  `owned-calendar-page-week:${pageStartDay(SPACE, index)}`
const weekStartKey = (index: PageIndex) =>
  epochDayKey(pageStartDay(SPACE, index))

function recordAnimatedReactions() {
  const sites = new Map<
    string,
    {
      prepare: () => unknown
      react: (value: unknown, previous: unknown) => void
      last: unknown
    }
  >()
  const spy = jest
    .spyOn(Reanimated, "useAnimatedReaction")
    .mockImplementation((prepare, react) => {
      const key = react.toString()
      const previous = sites.get(key)
      sites.set(key, {
        prepare,
        react: react as (value: unknown, previous: unknown) => void,
        last: previous === undefined ? prepare() : previous.last,
      })
    })
  return {
    flush: () => {
      for (const site of sites.values()) {
        const value = site.prepare()
        if (value === site.last) continue
        const previous = site.last
        site.last = value
        site.react(value, previous)
      }
    },
    restore: () => spy.mockRestore(),
  }
}

async function renderShell() {
  const onDateCommitted = jest.fn()
  const presentPage = presenter()
  const shell = (anchor: Date) => (
    <OwnedCalendarShell
      heading="Monday, June 15th, 2026"
      mode="week"
      anchor={anchor}
      displayZone={ZONE}
      locale="en"
      firstWeekday={1}
      showWeekends
      currentDate={new Date("2026-08-01T12:00:00.000Z")}
      uses24HourClock
      initialVerticalOffset={0}
      initialPixelsPerHour={60}
      presentPage={presentPage}
      onDateCommitted={onDateCommitted}
      onVerticalOffsetSettled={jest.fn()}
      onZoomSettled={jest.fn()}
    />
  )
  const view = await render(shell(ANCHOR))
  const pager = await placeCalendarPager()
  const showAnchor = async (anchor: Date) => {
    await view.rerender(shell(anchor))
    await flushUiThread()
  }
  return { onDateCommitted, presentPage, pager, showAnchor }
}

describe("owned Calendar windowed pager", () => {
  beforeEach(() => {
    jest.mocked(useReducedMotion).mockReturnValue(false)
  })

  it("mounts the settled page and two neighbours each way, keyed by page", async () => {
    await renderShell()
    for (let offset = -2; offset <= 2; offset += 1) {
      expect(
        screen.getByTestId(pageId(ANCHOR_INDEX + offset), HIDDEN),
      ).toBeTruthy()
    }
    expect(screen.queryByTestId(pageId(ANCHOR_INDEX + 3), HIDDEN)).toBeNull()
    expect(screen.queryByTestId(pageId(ANCHOR_INDEX - 3), HIDDEN)).toBeNull()
  })

  it("keeps the scroll owner and every retained page mounted across crossings", async () => {
    const { pager } = await renderShell()
    const scrollOwner = screen.getByTestId("owned-calendar-pager")
    const retained = [-1, 0, 1, 2].map((offset) =>
      screen.getByTestId(pageId(ANCHOR_INDEX + offset), HIDDEN),
    )

    await pager.swipe(0, 1)

    expect(screen.getByTestId("owned-calendar-pager")).toBe(scrollOwner)
    ;[-1, 0, 1, 2].forEach((offset, position) => {
      expect(screen.getByTestId(pageId(ANCHOR_INDEX + offset), HIDDEN)).toBe(
        retained[position],
      )
    })
    expect(screen.getByTestId(pageId(ANCHOR_INDEX + 3), HIDDEN)).toBeTruthy()
    expect(screen.queryByTestId(pageId(ANCHOR_INDEX - 2), HIDDEN)).toBeNull()
  })

  it("lands three swipes made before React commits on the third page, committing once", async () => {
    const { onDateCommitted, pager } = await renderShell()

    await act(async () => {
      pager.swipeWithoutSettling(0, 0.6, 1)
      pager.swipeWithoutSettling(1, 1.6, 2)
      pager.swipeWithoutSettling(2, 2.6, 3)
      pager.send(3, "onMomentumScrollEnd")
    })

    expect(onDateCommitted).toHaveBeenCalledTimes(1)
    expect(onDateCommitted.mock.calls[0]?.[0]).toEqual(
      new Date(`${weekStartKey(ANCHOR_INDEX + 3)}T00:00:00.000Z`),
    )
    for (let offset = 1; offset <= 5; offset += 1) {
      expect(
        screen.getByTestId(pageId(ANCHOR_INDEX + offset), HIDDEN),
      ).toBeTruthy()
    }
    expect(
      screen.getByTestId(
        `owned-calendar-date-header-slot-week:${pageStartDay(SPACE, ANCHOR_INDEX + 3)}`,
        HIDDEN,
      ).props.importantForAccessibility,
    ).toBe("auto")
  })

  it("commits each settled swipe and ignores a drag released on its own page", async () => {
    const { onDateCommitted, pager } = await renderShell()

    await pager.swipe(0, 1)
    await pager.swipe(1, 1)
    await pager.swipe(1, 0)

    expect(
      onDateCommitted.mock.calls.map(([date]: [Date]) =>
        date.toISOString().slice(0, 10),
      ),
    ).toEqual([weekStartKey(ANCHOR_INDEX + 1), weekStartKey(ANCHOR_INDEX)])
  })

  it("ignores scroll events that describe another content size until it is placed again", async () => {
    const { onDateCommitted, pager } = await renderShell()

    await act(async () => {
      pager.send(1)
      const stale = screen.getByTestId("owned-calendar-pager")
      stale.props.onScroll({
        nativeEvent: {
          contentOffset: { x: pager.origin + 2 * pager.pageWidth, y: 0 },
          layoutMeasurement: { width: pager.pageWidth + 40, height: 1000 },
          contentSize: { width: pager.contentWidth, height: 1000 },
        },
      })
    })

    expect(onDateCommitted).toHaveBeenCalledTimes(1)
    expect(onDateCommitted.mock.calls[0]?.[0].toISOString().slice(0, 10)).toBe(
      weekStartKey(ANCHOR_INDEX + 1),
    )
  })

  it("jumps beside a distant date, then animates one page and commits only the target", async () => {
    const scrollTo = jest.spyOn(Reanimated, "scrollTo")
    const { onDateCommitted, pager, showAnchor } = await renderShell()
    scrollTo.mockClear()

    await showAnchor(new Date("2026-11-02T00:00:00.000Z"))

    const target = ANCHOR_INDEX + 20
    expect(screen.getByTestId(pageId(target), HIDDEN)).toBeTruthy()
    expect(scrollTo.mock.calls.map((call) => call.slice(1))).toEqual([
      [pager.origin + 19 * pager.pageWidth, 0, false],
      [pager.origin + 20 * pager.pageWidth, 0, true],
    ])
    await pager.send(19)
    expect(onDateCommitted).not.toHaveBeenCalled()
    await pager.send(20)
    expect(onDateCommitted).toHaveBeenCalledTimes(1)
    expect(onDateCommitted.mock.calls[0]?.[0].toISOString().slice(0, 10)).toBe(
      "2026-11-02",
    )
    scrollTo.mockRestore()
  })

  it("jumps directly to a distant date when reduced motion changes while open", async () => {
    const scrollTo = jest.spyOn(Reanimated, "scrollTo")
    try {
      const { onDateCommitted, pager, showAnchor } = await renderShell()
      jest.mocked(useReducedMotion).mockReturnValue(true)
      scrollTo.mockClear()

      await showAnchor(new Date("2026-11-02T00:00:00.000Z"))

      expect(scrollTo.mock.calls.map((call) => call.slice(1))).toEqual([
        [pager.origin + 20 * pager.pageWidth, 0, false],
      ])
      await pager.send(20)
      expect(onDateCommitted).toHaveBeenCalledTimes(1)
    } finally {
      scrollTo.mockRestore()
    }
  })

  it("lets a touch interrupt a distant navigation and settle the touched page", async () => {
    const { onDateCommitted, pager, showAnchor } = await renderShell()
    await showAnchor(new Date("2026-11-02T00:00:00.000Z"))

    await pager.send(19, "onScrollBeginDrag")
    await pager.send(18)
    await pager.send(18, "onScrollEndDrag")

    expect(onDateCommitted).toHaveBeenCalledTimes(1)
    expect(onDateCommitted.mock.calls[0]?.[0].toISOString().slice(0, 10)).toBe(
      weekStartKey(ANCHOR_INDEX + 18),
    )
    await pager.send(18, "onScrollBeginDrag")
    await pager.send(18.6)
    await pager.send(18.6, "onScrollEndDrag")
    await pager.send(18.6, "onMomentumScrollBegin")
    await pager.send(19)
    await pager.send(19, "onMomentumScrollEnd")
    expect(onDateCommitted).toHaveBeenCalledTimes(2)
  })

  it("clears a target already at the settled page before the next ordinary swipe", async () => {
    const { onDateCommitted, pager, showAnchor } = await renderShell()
    await showAnchor(new Date("2026-06-22T00:00:00.000Z"))
    await showAnchor(ANCHOR)

    await pager.send(0)
    expect(onDateCommitted).not.toHaveBeenCalled()
    await pager.send(0, "onScrollBeginDrag")
    await pager.send(0.6)
    await pager.send(0.6, "onScrollEndDrag")
    await pager.send(0.6, "onMomentumScrollBegin")
    await pager.send(1)
    await pager.send(1, "onMomentumScrollEnd")

    expect(onDateCommitted).toHaveBeenCalledTimes(1)
    expect(onDateCommitted.mock.calls[0]?.[0].toISOString().slice(0, 10)).toBe(
      weekStartKey(ANCHOR_INDEX + 1),
    )
  })

  it("recovers a stationary touch that interrupts a programmatic page", async () => {
    const reactions = recordAnimatedReactions()
    try {
      const { onDateCommitted, pager, showAnchor } = await renderShell()
      await showAnchor(new Date("2026-11-02T00:00:00.000Z"))
      await pager.send(19)
      expect(onDateCommitted).not.toHaveBeenCalled()

      await act(async () => {
        fireGestureHandler(getByGestureTestId("owned-calendar-native-pager"), [
          { state: State.BEGAN, numberOfPointers: 1 },
          { state: State.END, numberOfPointers: 1 },
        ])
        reactions.flush()
      })
      await flushUiThread()

      expect(onDateCommitted).toHaveBeenCalledTimes(1)
      expect(
        onDateCommitted.mock.calls[0]?.[0].toISOString().slice(0, 10),
      ).toBe(weekStartKey(ANCHOR_INDEX + 19))
    } finally {
      reactions.restore()
    }
  })

  it("lets a pinch cancel a pending navigation and settle its observed page", async () => {
    const reactions = recordAnimatedReactions()
    try {
      const { onDateCommitted, pager, showAnchor } = await renderShell()
      await showAnchor(new Date("2026-11-02T00:00:00.000Z"))
      await pager.send(19)
      const pinch = getByGestureTestId("owned-calendar-pinch") as unknown as {
        handlers: {
          onStart: (event: Record<string, unknown>) => void
          onFinalize: (event: Record<string, unknown>, success: boolean) => void
        }
      }

      await act(async () => {
        pinch.handlers.onStart({ focalY: 200, numberOfPointers: 2 })
        reactions.flush()
        pinch.handlers.onFinalize({ numberOfPointers: 0 }, false)
        reactions.flush()
      })
      await flushUiThread()

      expect(onDateCommitted).toHaveBeenCalledTimes(1)
      expect(onDateCommitted.mock.calls[0]?.[0].toISOString().slice(0, 10)).toBe(
        weekStartKey(ANCHOR_INDEX + 19),
      )
    } finally {
      reactions.restore()
    }
  })

  it("re-bases the content window near its edge without moving the page", async () => {
    const scrollTo = jest.spyOn(Reanimated, "scrollTo")
    const { pager } = await renderShell()
    scrollTo.mockClear()

    await pager.swipe(0, 240)
    await flushUiThread()

    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(scrollTo.mock.calls[0]?.slice(1)).toEqual([pager.origin, 0, false])
    expect(screen.getByTestId(pageId(ANCHOR_INDEX + 240), HIDDEN)).toBeTruthy()
    scrollTo.mockRestore()
  })

  it("settles a fling grabbed and released without moving, which sends no end-drag", async () => {
    const { onDateCommitted, pager } = await renderShell()

    await act(async () => {
      pager.swipeWithoutSettling(0, 0.6, 0.8)
      pager.send(0.8, "onScrollBeginDrag")
      pager.send(0.8, "onMomentumScrollBegin")
      pager.send(1)
      pager.send(1, "onMomentumScrollEnd")
    })

    expect(
      onDateCommitted.mock.calls.map(([date]: [Date]) =>
        date.toISOString().slice(0, 10),
      ),
    ).toEqual([weekStartKey(ANCHOR_INDEX + 1)])
  })

  it("ignores scrolls during a rotation and re-places the settled page at the new width", async () => {
    const scrollTo = jest.spyOn(Reanimated, "scrollTo")
    const { onDateCommitted, pager } = await renderShell()
    await pager.swipe(0, 1)
    scrollTo.mockClear()
    const rotatedWidth = pagerPageWidth(800)
    const rotatedContent = (2 * PAGE_WINDOW_RADIUS + 1) * rotatedWidth

    await act(async () => {
      fireEvent(screen.getByTestId("owned-calendar-canvas"), "layout", {
        nativeEvent: { layout: { x: 0, y: 0, width: 800, height: 400 } },
      })
    })
    await act(async () => {
      screen.getByTestId("owned-calendar-pager").props.onScroll({
        nativeEvent: {
          contentOffset: { x: pager.origin + 84 * pager.pageWidth, y: 0 },
          layoutMeasurement: { width: rotatedWidth, height: 1000 },
          contentSize: { width: pager.contentWidth, height: 1000 },
        },
      })
      fireEvent(
        screen.getByTestId("owned-calendar-pager"),
        "contentSizeChange",
        rotatedContent,
        1000,
      )
    })
    await flushUiThread()

    expect(onDateCommitted).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId(pageId(ANCHOR_INDEX + 84), HIDDEN)).toBeNull()
    expect(scrollTo.mock.calls.map((call) => call.slice(1))).toEqual([
      [(PAGE_WINDOW_RADIUS + 1) * rotatedWidth, 0, false],
    ])
    scrollTo.mockRestore()
  })
})
