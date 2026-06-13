// react-native-mmkv v4's createMMKV() auto-mocks under Jest (isTest() →
// createMockMMKV, a real in-memory Map), BUT its factory module imports
// react-native-nitro-modules at the top level, whose import chain throws
// off-device — before isTest() ever runs. So stub the Nitro native module
// here (suite-wide, mirroring setup-firebase/setup-db); MMKV's own built-in
// mock then provides the genuine round-trip the storage proof test exercises.
jest.mock("react-native-nitro-modules", () => ({
  NitroModules: {
    createHybridObject: jest.fn(() => ({})),
  },
}))
