import { readLegacyBytes } from "./native-source"

const mockClose = jest.fn()
const mockRead = jest.fn()
const mockOpen = jest.fn()
jest.mock("expo-file-system", () => ({
  File: class {
    open(mode: string) {
      mockOpen(mode)
      return { readBytes: mockRead, close: mockClose }
    }
  },
  FileMode: { ReadOnly: "read-only" },
}))
jest.mock("../../../../modules/legacy-migration-source", () => ({
  getLegacyMigrationSource: jest.fn(),
}))
beforeEach(() => {
  mockClose.mockClear()
  mockOpen.mockClear()
  mockRead.mockReset()
})

it("reads only 64KiB chunks and closes the read-only handle on EOF", async () => {
  mockRead
    .mockReturnValueOnce(new Uint8Array([1, 2]))
    .mockReturnValue(new Uint8Array())
  const chunks = []
  for await (const chunk of readLegacyBytes("synthetic://source"))
    chunks.push(chunk)
  expect(chunks).toEqual([new Uint8Array([1, 2])])
  expect(mockRead).toHaveBeenCalledWith(64 * 1024)
  expect(mockOpen).toHaveBeenCalledWith("read-only")
  expect(mockClose).toHaveBeenCalledTimes(1)
})

it("closes the handle when parsing stops at a bound or an I/O read fails", async () => {
  mockRead.mockReturnValue(new Uint8Array([1]))
  for await (const chunk of readLegacyBytes("synthetic://source")) {
    expect(chunk.length).toBe(1)
    break
  }
  expect(mockClose).toHaveBeenCalledTimes(1)
  mockRead.mockImplementation(() => {
    throw new Error("read failed")
  })
  await expect(readLegacyBytes("synthetic://source").next()).rejects.toThrow(
    "read failed",
  )
  expect(mockClose).toHaveBeenCalledTimes(2)
})
