import { formatUnreadBadge } from "./unread-badge"

describe("formatUnreadBadge", () => {
  it.each([
    [-1, null],
    [0, null],
    [1, "1"],
    [42, "42"],
    [99, "99"],
    [100, "99+"],
    [5_000, "99+"],
  ])("maps %s to %s", (count, expected) => {
    expect(formatUnreadBadge(count)).toBe(expected)
  })
})
