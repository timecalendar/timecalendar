import { act, render } from "@testing-library/react-native"
import { Platform } from "react-native"
import { getByGestureTestId } from "react-native-gesture-handler/jest-utils"
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
import { placeCalendarPager } from "@/test-support/owned-calendar/pager-driver"

import { OwnedCalendarShell } from "./owned-calendar-shell"

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn(() => "light"),
}))

const ZONE = "UTC"
const SPACE: PageSpace = { mode: "week", firstWeekday: 1 }
const ANCHOR = new Date("2026-06-15T00:00:00.000Z")
const ANCHOR_INDEX = pageIndexOfInstant(SPACE, ANCHOR, ZONE)
const REST_FRAMES = 45

function presenter() {
  const pages = new Map<PageIndex, PagePresentationV1>()
  return (index: PageIndex) => {
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
  }
}

const committedWeeks = (onDateCommitted: jest.Mock) =>
  onDateCommitted.mock.calls.map(([date]: [Date]) =>
    date.toISOString().slice(0, 10),
  )
const weekStartKey = (index: PageIndex) =>
  epochDayKey(pageStartDay(SPACE, index))

async function renderShell(os: "android" | "ios") {
  jest.replaceProperty(Platform, "OS", os)
  const scrollTo = jest.spyOn(Reanimated, "scrollTo")
  const onDateCommitted = jest.fn()
  const view = await render(
    <OwnedCalendarShell
      heading="Monday, June 15th, 2026"
      mode="week"
      anchor={ANCHOR}
      displayZone={ZONE}
      locale="en"
      firstWeekday={1}
      showWeekends
      currentDate={new Date("2026-08-01T12:00:00.000Z")}
      uses24HourClock
      initialVerticalOffset={0}
      initialPixelsPerHour={60}
      presentPage={presenter()}
      onDateCommitted={onDateCommitted}
      onVerticalOffsetSettled={jest.fn()}
      onZoomSettled={jest.fn()}
    />,
  )
  const pager = await placeCalendarPager()
  scrollTo.mockClear()
  return { onDateCommitted, pager, scrollTo, view }
}

// Each animation frame callback runs on its own timer.
const elapseFrames = async (frames: number) => {
  await act(async () => {
    for (let frame = 0; frame < frames; frame += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  })
}

const nativePager = () =>
  getByGestureTestId("owned-calendar-native-pager") as unknown as {
    handlers: {
      onBegin: (event: Record<string, unknown>) => void
      onFinalize: (event: Record<string, unknown>, success: boolean) => void
    }
  }

describe("owned Calendar pager rest check", () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("snaps an Android pager left still between pages to the nearest page and commits it", async () => {
    const { onDateCommitted, pager, scrollTo } = await renderShell("android")

    await act(async () => {
      pager.send(0, "onScrollBeginDrag")
      pager.send(0.4)
      pager.send(0.7)
      pager.send(0.7, "onScrollEndDrag")
    })
    await elapseFrames(REST_FRAMES / 2)
    expect(scrollTo).not.toHaveBeenCalled()

    await elapseFrames(REST_FRAMES + 2)
    expect(scrollTo.mock.calls.map((call) => call.slice(1))).toEqual([
      [pager.origin + pager.pageWidth, 0, true],
    ])

    await act(async () => {
      pager.send(0.9)
      pager.send(1)
    })
    await elapseFrames(REST_FRAMES + 2)
    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(committedWeeks(onDateCommitted)).toEqual([
      weekStartKey(ANCHOR_INDEX + 1),
    ])
  })

  it("settles an aligned Android pager whose drag never ended", async () => {
    const { onDateCommitted, pager, scrollTo } = await renderShell("android")

    await act(async () => {
      pager.send(0, "onScrollBeginDrag")
      pager.send(0.5)
      pager.send(1)
    })
    expect(onDateCommitted).not.toHaveBeenCalled()

    await elapseFrames(REST_FRAMES + 2)
    expect(scrollTo).not.toHaveBeenCalled()
    expect(committedWeeks(onDateCommitted)).toEqual([
      weekStartKey(ANCHOR_INDEX + 1),
    ])
  })

  it("waits for the finger on the pager to lift", async () => {
    const { pager, scrollTo } = await renderShell("android")

    await act(async () => {
      nativePager().handlers.onBegin({})
      pager.send(0, "onScrollBeginDrag")
      pager.send(0.3)
    })
    await elapseFrames(3 * REST_FRAMES)
    expect(scrollTo).not.toHaveBeenCalled()

    await act(async () => {
      nativePager().handlers.onFinalize({}, true)
    })
    await elapseFrames(REST_FRAMES + 2)
    expect(scrollTo.mock.calls.map((call) => call.slice(1))).toEqual([
      [pager.origin, 0, true],
    ])
  })

  it("places and settles after three snaps that do not move the pager", async () => {
    const { pager, scrollTo } = await renderShell("android")

    await act(async () => {
      pager.send(0.6)
    })
    for (let frame = 0; frame < 10; frame += 1)
      await elapseFrames(REST_FRAMES + 2)

    expect(scrollTo).toHaveBeenCalledTimes(3)
    expect(scrollTo.mock.calls.at(-1)?.slice(1)).toEqual([
      pager.origin + pager.pageWidth,
      0,
      false,
    ])
  })

  it("stops checking once the pager unmounts", async () => {
    const { pager, scrollTo, view } = await renderShell("android")

    await act(async () => {
      pager.send(0.6)
    })
    await view.unmount()
    await elapseFrames(3 * REST_FRAMES)

    expect(scrollTo).not.toHaveBeenCalled()
  })

  it("leaves iOS paging to UIScrollView", async () => {
    const { onDateCommitted, pager, scrollTo } = await renderShell("ios")

    await act(async () => {
      pager.send(0, "onScrollBeginDrag")
      pager.send(0.6)
      pager.send(1)
    })
    await elapseFrames(3 * REST_FRAMES)

    expect(scrollTo).not.toHaveBeenCalled()
    expect(onDateCommitted).not.toHaveBeenCalled()
  })
})
