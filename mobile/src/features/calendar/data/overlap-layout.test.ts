import {
  type Interval,
  layoutOverlaps,
  overlapIdentityKey,
} from "./overlap-layout"

function at(id: string, start: number, end: number, source = "synced") {
  return {
    identity: { source, uid: id },
    startsAt: new Date(start * 60_000),
    endsAt: new Date(end * 60_000),
  }
}

function placed(items: readonly ReturnType<typeof at>[]) {
  return [...layoutOverlaps(items).values()].map(
    ({ item, column, columns, startX, endX }) => ({
      id: `${item.identity.source}:${item.identity.uid}`,
      column,
      columns,
      startX,
      endX,
    }),
  )
}

function permutations<T>(values: readonly T[]): T[][] {
  if (values.length === 0) return [[]]
  return values.flatMap((value, index) =>
    permutations(values.filter((_, candidate) => candidate !== index)).map(
      (rest) => [value, ...rest],
    ),
  )
}

describe("layoutOverlaps", () => {
  it("returns an empty identity map without mutating input", () => {
    const input: Interval[] = []
    expect(layoutOverlaps(input)).toEqual(new Map())
    expect(input).toEqual([])
  })

  it.each([
    ["point", at("point", 10, 10)],
    ["reversed", at("reversed", 11, 10)],
    [
      "invalid start",
      { ...at("invalid-start", 10, 11), startsAt: new Date(NaN) },
    ],
    ["invalid end", { ...at("invalid-end", 10, 11), endsAt: new Date(NaN) }],
  ])("rejects a %s interval", (_label, interval) => {
    expect(() => layoutOverlaps([interval])).toThrow(
      "finite positive intervals",
    )
  })

  it("rejects duplicate stable identities before placement", () => {
    expect(() => layoutOverlaps([at("same", 1, 2), at("same", 3, 4)])).toThrow(
      "identities must be unique",
    )
  })

  it("uses collision-free source/UID keys", () => {
    expect(overlapIdentityKey({ source: "a", uid: "bc" })).not.toBe(
      overlapIdentityKey({ source: "ab", uid: "c" }),
    )
  })

  it("keeps adjacent intervals in separate full-width clusters", () => {
    expect(placed([at("b", 60, 120), at("a", 0, 60)])).toEqual([
      { id: "synced:a", column: 0, columns: 1, startX: 0, endX: 1 },
      { id: "synced:b", column: 0, columns: 1, startX: 0, endX: 1 },
    ])
  })

  it("finalizes transitive clusters at minimum concurrency and reuses the lowest free column", () => {
    expect(
      placed([
        at("long", 0, 100),
        at("first", 10, 30),
        at("nested", 20, 80),
        at("reuse", 30, 90),
      ]),
    ).toEqual([
      { id: "synced:long", column: 0, columns: 3, startX: 0, endX: 1 / 3 },
      {
        id: "synced:first",
        column: 1,
        columns: 3,
        startX: 1 / 3,
        endX: 2 / 3,
      },
      {
        id: "synced:nested",
        column: 2,
        columns: 3,
        startX: 2 / 3,
        endX: 1,
      },
      {
        id: "synced:reuse",
        column: 1,
        columns: 3,
        startX: 1 / 3,
        endX: 2 / 3,
      },
    ])
  })

  it("orders identical bounds by ordinal source and UID for every permutation", () => {
    const intervals = [
      at("z", 0, 60),
      at("b", 0, 60),
      at("a", 0, 60),
      at("p", 0, 60, "personal"),
    ]
    const expected = placed(intervals)
    for (const input of permutations(intervals))
      expect(placed(input)).toEqual(expected)
    expect(expected.map(({ id }) => id)).toEqual([
      "personal:p",
      "synced:a",
      "synced:b",
      "synced:z",
    ])
  })

  it("preserves deterministic non-covering invariants for seeded generated sets", () => {
    let state = 0x561
    const random = () => {
      state = (state * 1_664_525 + 1_013_904_223) >>> 0
      return state / 2 ** 32
    }
    for (let sample = 0; sample < 100; sample += 1) {
      const intervals = Array.from(
        { length: 2 + Math.floor(random() * 12) },
        (_, index) => {
          const start = Math.floor(random() * 300)
          return at(
            `sample-${sample}-${index}`,
            start,
            start + 1 + Math.floor(random() * 90),
          )
        },
      )
      const output = [...layoutOverlaps(intervals).values()]
      expect(placed([...intervals].reverse())).toEqual(placed(intervals))
      expect(output).toHaveLength(intervals.length)
      for (const current of output) {
        expect(current.endX - current.startX).toBeCloseTo(1 / current.columns)
        for (const other of output) {
          if (current === other) continue
          const timeOverlap =
            current.item.startsAt < other.item.endsAt &&
            other.item.startsAt < current.item.endsAt
          if (timeOverlap) expect(current.column).not.toBe(other.column)
        }
      }
    }
  })
})
