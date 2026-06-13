// Mock the SQLite seam's native dependencies for the whole suite: expo-sqlite
// has no JS implementation off-device (like @react-native-firebase's native
// modules), so importing src/db would otherwise throw. Registered globally
// here, mirroring setup-firebase; the migrate proof test asserts the runner
// drives the mocked migrate() with the committed bundle.
jest.mock("expo-sqlite", () => ({
  openDatabaseSync: jest.fn(() => ({})),
}))

jest.mock("drizzle-orm/expo-sqlite", () => ({
  drizzle: jest.fn(() => ({})),
}))

jest.mock("drizzle-orm/expo-sqlite/migrator", () => ({
  migrate: jest.fn(() => Promise.resolve()),
}))
