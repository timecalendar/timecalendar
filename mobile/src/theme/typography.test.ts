import type { TypeStep, TypeVariant } from "@/theme/typography"

type Ramp = Record<TypeVariant, TypeStep>

const dense: Pick<Ramp, "caption" | "captionSmall"> = {
  caption: { style: { fontSize: 12, lineHeight: 14, fontWeight: 600 } },
  captionSmall: { style: { fontSize: 11, lineHeight: 13, fontWeight: 400 } },
}

const expectedIos: Ramp = {
  largeTitle: {
    style: { fontSize: 34, lineHeight: 41, fontWeight: 700 },
    dynamicTypeRamp: "largeTitle",
  },
  title: {
    style: { fontSize: 28, lineHeight: 34, fontWeight: 700 },
    dynamicTypeRamp: "title1",
  },
  title2: {
    style: { fontSize: 22, lineHeight: 28, fontWeight: 700 },
    dynamicTypeRamp: "title2",
  },
  sectionTitle: {
    style: { fontSize: 20, lineHeight: 25, fontWeight: 600 },
    dynamicTypeRamp: "title3",
  },
  headline: {
    style: { fontSize: 17, lineHeight: 22, fontWeight: 600 },
    dynamicTypeRamp: "headline",
  },
  body: {
    style: { fontSize: 17, lineHeight: 22, fontWeight: 400 },
    dynamicTypeRamp: "body",
  },
  callout: {
    style: { fontSize: 16, lineHeight: 21, fontWeight: 400 },
    dynamicTypeRamp: "callout",
  },
  label: {
    style: { fontSize: 15, lineHeight: 20, fontWeight: 600 },
    dynamicTypeRamp: "subheadline",
  },
  footnote: {
    style: { fontSize: 13, lineHeight: 18, fontWeight: 400 },
    dynamicTypeRamp: "footnote",
  },
  ...dense,
}

const expectedAndroid: Ramp = {
  largeTitle: {
    style: { fontSize: 32, lineHeight: 40, fontWeight: 400, letterSpacing: 0 },
  },
  title: {
    style: { fontSize: 28, lineHeight: 36, fontWeight: 400, letterSpacing: 0 },
  },
  title2: {
    style: { fontSize: 24, lineHeight: 32, fontWeight: 400, letterSpacing: 0 },
  },
  sectionTitle: {
    style: { fontSize: 22, lineHeight: 28, fontWeight: 400, letterSpacing: 0 },
  },
  headline: {
    style: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: 500,
      letterSpacing: 0.15,
    },
  },
  body: {
    style: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: 400,
      letterSpacing: 0.5,
    },
  },
  callout: {
    style: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: 400,
      letterSpacing: 0.25,
    },
  },
  label: {
    style: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: 500,
      letterSpacing: 0.1,
    },
  },
  footnote: {
    style: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: 400,
      letterSpacing: 0.4,
    },
  },
  ...dense,
}

function loadRamp(os: "ios" | "android"): Ramp {
  let ramp: Ramp | undefined
  jest.isolateModules(() => {
    jest.doMock("react-native/Libraries/Utilities/Platform", () =>
      jest.requireActual(`react-native/Libraries/Utilities/Platform.${os}`),
    )
    try {
      ramp =
        jest.requireActual<typeof import("@/theme/typography")>(
          "@/theme/typography",
        ).TypeRamp
    } finally {
      jest.dontMock("react-native/Libraries/Utilities/Platform")
    }
  })
  if (!ramp) throw new Error(`TypeRamp did not load for ${os}`)
  return ramp
}

describe("TypeRamp", () => {
  const ios = loadRamp("ios")
  const android = loadRamp("android")

  it("resolves the HIG ramp with Dynamic Type ramps on iOS", () => {
    expect(ios).toEqual(expectedIos)
  })

  it("resolves the Material 3 ramp with tracking on Android", () => {
    expect(android).toEqual(expectedAndroid)
  })

  it.each([
    ["ios", ios],
    ["android", android],
  ] as const)("keeps lineHeight >= fontSize on %s", (_os, ramp) => {
    for (const { style } of Object.values(ramp)) {
      expect(style.lineHeight).toBeGreaterThanOrEqual(style.fontSize ?? 0)
    }
  })

  it("names no Dynamic Type ramp on Android", () => {
    for (const step of Object.values(android)) {
      expect(step.dynamicTypeRamp).toBeUndefined()
    }
  })

  it("applies no manual tracking on iOS", () => {
    for (const { style } of Object.values(ios)) {
      expect(style.letterSpacing).toBeUndefined()
    }
  })

  it("keeps the dense calendar steps identical across platforms", () => {
    expect(android.caption).toEqual(ios.caption)
    expect(android.captionSmall).toEqual(ios.captionSmall)
  })

  it("leaves Platform un-mocked for the rest of the file", () => {
    jest.isolateModules(() => {
      const { Platform } =
        jest.requireActual<typeof import("react-native")>("react-native")
      expect(Platform.OS).toBe("ios")
    })
  })
})
