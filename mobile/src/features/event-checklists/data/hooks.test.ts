import { act, renderHook } from "@testing-library/react-native"

import { recordError } from "@/firebase"

import { useChecklist, useChecklistActions } from "./hooks"
import { newId } from "./id"
import { add, remove, reorder, setChecked, setContent } from "./repository"
import { type ChecklistItem, checklistItemToRow } from "./types"

// useChecklistActions wraps the repository writes with the order computation + the
// observability + failure-state handling (ADR 024 / decisions 6/7). The repository
// + the uid wrapper are mocked so a throwing write is controllable and the Drizzle
// query shapes are out of scope here (proven in repository.test.ts). useChecklist
// (the reactive read) is proven by the restart-sim + the component test; here we
// prove the action logic: 1-based order on add, recordError-on-throw, the
// remove-then-renumber path, and the move-up/down swap.

// useChecklist reads through @/db's useLiveQuery; mock the seam so a controllable
// live result drives the reactive read (the global setup-db mock is just {}).
let mockLiveData: unknown[] = []
jest.mock("@/db", () => {
  const builder: Record<string, unknown> = {
    from: () => builder,
    where: () => builder,
    orderBy: () => builder,
  }
  return {
    db: { select: () => builder },
    checklistItems: {
      eventUid: "checklistItems.eventUid",
      order: "checklistItems.order",
    },
    eq: jest.fn((col, val) => ({ op: "eq", col, val })),
    asc: jest.fn((col) => ({ op: "asc", col })),
    useLiveQuery: () => ({ data: mockLiveData }),
  }
})

jest.mock("@/firebase", () => ({ recordError: jest.fn() }))
jest.mock("./id", () => ({ newId: jest.fn() }))
jest.mock("./repository", () => ({
  add: jest.fn(() => Promise.resolve()),
  setContent: jest.fn(() => Promise.resolve()),
  setChecked: jest.fn(() => Promise.resolve()),
  reorder: jest.fn(() => Promise.resolve()),
  remove: jest.fn(() => Promise.resolve()),
}))

const mockRecordError = recordError as jest.Mock
const mockNewId = newId as jest.Mock
const mockAdd = add as jest.Mock
const mockSetContent = setContent as jest.Mock
const mockSetChecked = setChecked as jest.Mock
const mockReorder = reorder as jest.Mock
const mockRemove = remove as jest.Mock

function makeItem(overrides: Partial<ChecklistItem> = {}): ChecklistItem {
  return {
    uuid: "u-1",
    eventUid: "ev-1",
    content: "",
    isChecked: false,
    order: 1,
    createdAt: undefined,
    updatedAt: undefined,
    deletedAt: undefined,
    ...overrides,
  }
}

beforeEach(() => {
  ;[
    mockRecordError,
    mockNewId,
    mockAdd,
    mockSetContent,
    mockSetChecked,
    mockReorder,
    mockRemove,
  ].forEach((m) => m.mockReset())
  mockNewId.mockReturnValue("new-uuid")
  ;[mockAdd, mockSetContent, mockSetChecked, mockReorder, mockRemove].forEach(
    (m) => m.mockResolvedValue(undefined),
  )
})

describe("useChecklist", () => {
  it("maps live rows to the domain type, in order", async () => {
    mockLiveData = [
      checklistItemToRow(makeItem({ uuid: "u-1", content: "A", order: 1 })),
      checklistItemToRow(makeItem({ uuid: "u-2", content: "B", order: 2 })),
    ]
    const { result } = await renderHook(() => useChecklist("ev-1"))
    expect(result.current.map((i) => i.content)).toEqual(["A", "B"])
    expect(result.current[0]?.uuid).toBe("u-1")
  })

  it("reads an empty list as empty (total/infallible)", async () => {
    mockLiveData = []
    const { result } = await renderHook(() => useChecklist("ev-1"))
    expect(result.current).toEqual([])
  })
})

describe("useChecklistActions", () => {
  it("add inserts a blank item with the next 1-based order and returns its uuid", async () => {
    const items = [
      makeItem({ uuid: "u-1", order: 1 }),
      makeItem({ uuid: "u-2", order: 2 }),
    ]
    const { result } = await renderHook(() =>
      useChecklistActions("ev-1", items),
    )

    let returned: string | undefined
    await act(async () => {
      returned = await result.current.add()
    })

    expect(returned).toBe("new-uuid")
    const inserted = mockAdd.mock.calls[0]?.[0] as ChecklistItem
    expect(inserted).toMatchObject({
      uuid: "new-uuid",
      eventUid: "ev-1",
      content: "",
      isChecked: false,
      order: 3, // length(2) + 1
    })
    expect(inserted.createdAt).toBeInstanceOf(Date)
    expect(inserted.updatedAt).toBeInstanceOf(Date)
    expect(result.current.failed).toBe(false)
    expect(mockRecordError).not.toHaveBeenCalled()
  })

  it("add on an empty list uses order 1", async () => {
    const { result } = await renderHook(() => useChecklistActions("ev-1", []))
    await act(async () => {
      await result.current.add()
    })
    expect((mockAdd.mock.calls[0]?.[0] as ChecklistItem).order).toBe(1)
  })

  it("setContent and setChecked delegate to the repository", async () => {
    const { result } = await renderHook(() =>
      useChecklistActions("ev-1", [makeItem()]),
    )
    await act(async () => result.current.setContent("u-1", "Lab coat"))
    await act(async () => result.current.setChecked("u-1", true))
    expect(mockSetContent).toHaveBeenCalledWith("u-1", "Lab coat")
    expect(mockSetChecked).toHaveBeenCalledWith("u-1", true)
  })

  it("records a write failure and flips the failure flag", async () => {
    mockAdd.mockRejectedValueOnce(new Error("DB write failed"))
    const { result } = await renderHook(() => useChecklistActions("ev-1", []))
    await act(async () => {
      await result.current.add()
    })
    expect(mockRecordError).toHaveBeenCalledWith(
      expect.any(Error),
      "event-checklists/add",
    )
    expect(result.current.failed).toBe(true)
  })

  it("wraps a non-Error throw before recording it", async () => {
    mockSetChecked.mockImplementationOnce(() => {
      throw "string failure"
    })
    const { result } = await renderHook(() =>
      useChecklistActions("ev-1", [makeItem()]),
    )
    await act(async () => result.current.setChecked("u-1", true))
    expect(mockRecordError).toHaveBeenCalledWith(
      expect.any(Error),
      "event-checklists/setChecked",
    )
    expect(result.current.failed).toBe(true)
  })

  it("remove hard-deletes then re-numbers the remainder", async () => {
    const items = [
      makeItem({ uuid: "u-1", order: 1 }),
      makeItem({ uuid: "u-2", order: 2 }),
      makeItem({ uuid: "u-3", order: 3 }),
    ]
    const { result } = await renderHook(() =>
      useChecklistActions("ev-1", items),
    )
    await act(async () => result.current.remove("u-2"))

    expect(mockRemove).toHaveBeenCalledWith("u-2")
    const renumbered = mockReorder.mock.calls[0]?.[0] as ChecklistItem[]
    expect(renumbered.map((i) => i.uuid)).toEqual(["u-1", "u-3"])
  })

  it("moveUp swaps with the previous item and reorders", async () => {
    const items = [
      makeItem({ uuid: "u-1", order: 1 }),
      makeItem({ uuid: "u-2", order: 2 }),
    ]
    const { result } = await renderHook(() =>
      useChecklistActions("ev-1", items),
    )
    await act(async () => result.current.moveUp("u-2"))
    const reordered = mockReorder.mock.calls[0]?.[0] as ChecklistItem[]
    expect(reordered.map((i) => i.uuid)).toEqual(["u-2", "u-1"])
  })

  it("moveDown swaps with the next item and reorders", async () => {
    const items = [
      makeItem({ uuid: "u-1", order: 1 }),
      makeItem({ uuid: "u-2", order: 2 }),
    ]
    const { result } = await renderHook(() =>
      useChecklistActions("ev-1", items),
    )
    await act(async () => result.current.moveDown("u-1"))
    const reordered = mockReorder.mock.calls[0]?.[0] as ChecklistItem[]
    expect(reordered.map((i) => i.uuid)).toEqual(["u-2", "u-1"])
  })

  it("moveUp at the top is a no-op (no reorder write)", async () => {
    const items = [makeItem({ uuid: "u-1", order: 1 })]
    const { result } = await renderHook(() =>
      useChecklistActions("ev-1", items),
    )
    await act(async () => result.current.moveUp("u-1"))
    expect(mockReorder).not.toHaveBeenCalled()
  })

  it("moveDown at the bottom is a no-op (no reorder write)", async () => {
    const items = [makeItem({ uuid: "u-1", order: 1 })]
    const { result } = await renderHook(() =>
      useChecklistActions("ev-1", items),
    )
    await act(async () => result.current.moveDown("u-1"))
    expect(mockReorder).not.toHaveBeenCalled()
  })
})
