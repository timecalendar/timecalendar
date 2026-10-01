import { createLruCache } from "./lru-cache"

describe("createLruCache", () => {
  it("builds once per key and evicts the least recently used entry", () => {
    const cache = createLruCache<string, number>(2)
    const build = jest.fn((value: number) => value)
    expect(cache.getOrCreate("a", () => build(1))).toBe(1)
    expect(cache.getOrCreate("a", () => build(9))).toBe(1)
    cache.getOrCreate("b", () => build(2))
    cache.getOrCreate("a", () => build(9))
    cache.getOrCreate("c", () => build(3))
    expect(build).toHaveBeenCalledTimes(3)
    expect(cache.has("a")).toBe(true)
    expect(cache.has("b")).toBe(false)
    expect(cache.has("c")).toBe(true)
    expect(cache.size).toBe(2)
    cache.clear()
    expect(cache.size).toBe(0)
  })

  it("caches undefined values", () => {
    const cache = createLruCache<string, undefined>(1)
    const build = jest.fn(() => undefined)
    cache.getOrCreate("a", build)
    cache.getOrCreate("a", build)
    expect(build).toHaveBeenCalledTimes(1)
  })

  it.each([0, -1, 1.5])("rejects capacity %s", (capacity) => {
    expect(() => createLruCache(capacity)).toThrow(RangeError)
  })
})
