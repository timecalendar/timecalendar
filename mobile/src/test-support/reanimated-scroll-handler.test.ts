import { renderHook } from "@testing-library/react-native"
import { useAnimatedScrollHandler } from "react-native-reanimated"

type Payload = Parameters<
  ReturnType<typeof useAnimatedScrollHandler> & ((event: object) => void)
>[0]

async function scrollHandlerWith(
  handlers: Parameters<typeof useAnimatedScrollHandler>[0],
) {
  const { result } = await renderHook(() => useAnimatedScrollHandler(handlers))
  return result.current as unknown as (event: Payload) => void
}

describe("Reanimated scroll-handler mock", () => {
  const handlers = {
    onScroll: jest.fn(),
    onBeginDrag: jest.fn(),
    onEndDrag: jest.fn(),
    onMomentumBegin: jest.fn(),
    onMomentumEnd: jest.fn(),
  }

  beforeEach(() => jest.clearAllMocks())

  it.each([
    ["onScroll", "onScroll"],
    ["onScrollBeginDrag", "onBeginDrag"],
    ["onScrollEndDrag", "onEndDrag"],
    ["onMomentumScrollBegin", "onMomentumBegin"],
    ["onMomentumScrollEnd", "onMomentumEnd"],
  ] as const)("routes %s to the %s handler only", async (eventName, key) => {
    const handle = await scrollHandlerWith(handlers)

    handle({ nativeEvent: { eventName: `42${eventName}`, contentOffset: 1 } })

    for (const [name, handler] of Object.entries(handlers)) {
      expect(handler).toHaveBeenCalledTimes(name === key ? 1 : 0)
    }
    expect(handlers[key]).toHaveBeenCalledWith(
      { eventName: `42${eventName}`, contentOffset: 1 },
      {},
    )
  })

  it("routes an unnamed payload to onScroll and a bare function as onScroll", async () => {
    const onScroll = jest.fn()

    ;(await scrollHandlerWith(handlers))({ nativeEvent: { contentOffset: 2 } })
    ;(await scrollHandlerWith(onScroll))({ contentOffset: 3 } as Payload)

    expect(handlers.onScroll).toHaveBeenCalledWith({ contentOffset: 2 }, {})
    expect(onScroll).toHaveBeenCalledWith({ contentOffset: 3 }, {})
  })

  it("shares one context across a handler's events", async () => {
    const handle = await scrollHandlerWith({
      onBeginDrag: (_event, context) => {
        "worklet"
        context.began = true
      },
      onEndDrag: handlers.onEndDrag,
    })

    handle({ nativeEvent: { eventName: "onScrollBeginDrag" } })
    handle({ nativeEvent: { eventName: "onScrollEndDrag" } })

    expect(handlers.onEndDrag).toHaveBeenCalledWith(
      { eventName: "onScrollEndDrag" },
      { began: true },
    )
  })

  it("ignores an event without a handler and rejects an unknown event name", async () => {
    const handle = await scrollHandlerWith({ onScroll: handlers.onScroll })

    handle({ nativeEvent: { eventName: "onMomentumScrollEnd" } })

    expect(handlers.onScroll).not.toHaveBeenCalled()
    expect(() => handle({ nativeEvent: { eventName: "onZoom" } })).toThrow(
      "Unknown scroll event name: onZoom",
    )
  })
})
