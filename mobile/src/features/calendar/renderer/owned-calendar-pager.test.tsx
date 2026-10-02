import { act, render, screen } from "@testing-library/react-native"
import { Platform } from "react-native"
import * as Reanimated from "react-native-reanimated"

import {
  buildPagePresentation,
  epochDayKey,
  type PageIndex,
  pageIndexOfInstant,
  type PagePresentationV1,
  type PageSpace,
  pageStartDay,
} from "@/features/calendar/data"
import i18n from "@/i18n"
import {
  flushUiThread,
  placeCalendarPager,
} from "@/test-support/owned-calendar/pager-driver"

import { OwnedCalendarShell } from "./owned-calendar-shell"

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn(() => "light"),
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

  it("moves to a date shown from outside without animation, then commits where it lands", async () => {
    const scrollTo = jest.spyOn(Reanimated, "scrollTo")
    const { onDateCommitted, pager, showAnchor } = await renderShell()
    scrollTo.mockClear()

    await showAnchor(new Date("2026-11-02T00:00:00.000Z"))

    const target = ANCHOR_INDEX + 20
    expect(screen.getByTestId(pageId(target), HIDDEN)).toBeTruthy()
    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(scrollTo.mock.calls[0]?.slice(1)).toEqual([
      pager.origin + 20 * pager.pageWidth,
      0,
      false,
    ])
    await act(async () => {
      pager.send(20)
    })
    expect(onDateCommitted).toHaveBeenCalledTimes(1)
    expect(onDateCommitted.mock.calls[0]?.[0].toISOString().slice(0, 10)).toBe(
      "2026-11-02",
    )
    scrollTo.mockRestore()
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

  it("re-aims an Android swipe that interrupts a snap one page past that snap", async () => {
    const os = jest.replaceProperty(Platform, "OS", "android")
    const scrollTo = jest.spyOn(Reanimated, "scrollTo")
    const { onDateCommitted, pager } = await renderShell()
    await act(async () => {
      pager.send(0, "onScrollBeginDrag")
      pager.send(0.6)
      pager.send(0.6, "onScrollEndDrag")
      pager.send(0.7)
    })
    scrollTo.mockClear()

    await act(async () => {
      pager.send(0.7, "onScrollBeginDrag")
      pager.send(0.8)
      pager.send(0.9, "onScrollEndDrag")
    })
    await flushUiThread()

    expect(scrollTo.mock.calls.map((call) => call.slice(1))).toEqual([
      [pager.origin + 0.7 * pager.pageWidth, 0, false],
      [pager.origin + 2 * pager.pageWidth, 0, true],
    ])
    await act(async () => {
      pager.send(1)
      pager.send(2)
    })
    expect(
      onDateCommitted.mock.calls.map(([date]: [Date]) =>
        date.toISOString().slice(0, 10),
      ),
    ).toEqual([weekStartKey(ANCHOR_INDEX + 2)])
    scrollTo.mockRestore()
    os.restore()
  })
})
