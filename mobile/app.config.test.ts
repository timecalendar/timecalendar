import type { ConfigContext, ExpoConfig } from "expo/config"

import configure from "./app.config"
import easConfig from "./eas.json"

type ConfigEnvironment = {
  APP_VARIANT?: string | undefined
  BACKEND_ENVIRONMENT_CAPABILITY?: string | undefined
  EAS_PROJECT_ID?: string | undefined
  OTA_CHANNEL?: string | undefined
}

const originalEnvironment = process.env

const resolveConfig = (environment: ConfigEnvironment): ExpoConfig => {
  process.env = { ...originalEnvironment, ...environment }

  for (const key of [
    "APP_VARIANT",
    "BACKEND_ENVIRONMENT_CAPABILITY",
    "EAS_PROJECT_ID",
    "OTA_CHANNEL",
  ] as const) {
    if (environment[key] === undefined) delete process.env[key]
  }

  return configure({ config: {} } as ConfigContext)
}

const containsKey = (value: unknown, target: string): boolean => {
  if (Array.isArray(value)) {
    return value.some((entry) => containsKey(entry, target))
  }
  if (value === null || typeof value !== "object") return false

  return Object.entries(value).some(
    ([key, entry]) => key === target || containsKey(entry, target),
  )
}

afterEach(() => {
  process.env = originalEnvironment
})

describe("Expo distribution configuration", () => {
  it("keeps development on its dev identity with automatic OTA disabled", () => {
    const config = resolveConfig({
      APP_VARIANT: "development",
      BACKEND_ENVIRONMENT_CAPABILITY: "development",
    })

    expect(config.ios).toMatchObject({
      bundleIdentifier: "fr.samuelprak.timecalendar.dev",
      googleServicesFile: "./firebase/GoogleService-Info.dev.plist",
      supportsTablet: true,
      requireFullScreen: true,
      infoPlist: {
        NSAppTransportSecurity: { NSAllowsArbitraryLoads: true },
      },
    })
    expect(config.orientation).toBe("portrait")
    expect(config.android).toMatchObject({
      package: "fr.samuelprak.timecalendar.dev",
      googleServicesFile: "./firebase/google-services.dev.json",
    })
    expect(config.updates).toEqual({ enabled: false })
    expect(config.runtimeVersion).toEqual({ policy: "fingerprint" })
    expect(config.extra?.backendEnvironmentCapability).toBe("development")
  })

  it.each(["preview", "production"] as const)(
    "resolves the signed xprem contract for %s",
    (channel) => {
      const config = resolveConfig({
        OTA_CHANNEL: channel,
        BACKEND_ENVIRONMENT_CAPABILITY: channel,
      })

      expect(config.ios).toMatchObject({
        bundleIdentifier: "fr.samuelprak.timecalendar",
        googleServicesFile: "./firebase/GoogleService-Info.plist",
        supportsTablet: true,
        requireFullScreen: true,
      })
      expect(config.orientation).toBe("portrait")
      expect(config.ios?.infoPlist).not.toHaveProperty("NSAppTransportSecurity")
      expect(config.android).toMatchObject({
        package: "fr.samuelprak.timecalendar",
        googleServicesFile: "./firebase/google-services.json",
      })
      expect(config.updates).toEqual({
        enabled: true,
        url: "https://ota.timecalendar.app/manifest",
        fallbackToCacheTimeout: 0,
        codeSigningCertificate: "./codesigning/certs/certificate.pem",
        codeSigningMetadata: {
          keyid: "main",
          alg: "rsa-v1_5-sha256",
        },
        requestHeaders: {
          "expo-channel-name": channel,
          "expo-app-id": "e89170b9-5b32-44f0-8f78-33eadb60ec28",
          "xprem-branch": "",
        },
      })
      expect(config.runtimeVersion).toEqual({ policy: "fingerprint" })
      expect(config.extra?.eas?.projectId).toBe(
        "3b427ef6-1aae-4175-8217-ea447ee6df6b",
      )
      expect(config.extra?.backendEnvironmentCapability).toBe(channel)
    },
  )

  it("keeps EAS project linkage independent from xprem delivery", () => {
    const config = resolveConfig({
      EAS_PROJECT_ID: "11111111-2222-3333-4444-555555555555",
      OTA_CHANNEL: "production",
      BACKEND_ENVIRONMENT_CAPABILITY: "preview",
    })

    expect(config.extra?.eas?.projectId).toBe(
      "11111111-2222-3333-4444-555555555555",
    )
    expect(config.updates?.url).toBe("https://ota.timecalendar.app/manifest")
    expect(config.updates?.requestHeaders).toEqual({
      "expo-channel-name": "production",
      "expo-app-id": "e89170b9-5b32-44f0-8f78-33eadb60ec28",
      "xprem-branch": "",
    })
    expect(config.extra?.backendEnvironmentCapability).toBe("preview")
  })

  it.each([undefined, "beta"])(
    "rejects an invalid release OTA channel (%s)",
    (channel) => {
      expect(() => resolveConfig({ OTA_CHANNEL: channel })).toThrow(
        "OTA_CHANNEL must be one of preview, production for release builds",
      )
    },
  )

  it("keeps lane-specific eas.json profile guarantees with no second channel authority", () => {
    expect(containsKey(easConfig, "channel")).toBe(false)
    expect(easConfig.build.development).toEqual({
      developmentClient: true,
      distribution: "internal",
      env: {
        APP_VARIANT: "development",
        BACKEND_ENVIRONMENT_CAPABILITY: "development",
      },
      ios: { simulator: true },
      android: { buildType: "apk" },
    })

    for (const channel of ["preview", "production"] as const) {
      expect(easConfig.build[channel]).toEqual({
        distribution: "store",
        autoIncrement: true,
        env: {
          OTA_CHANNEL: channel,
          BACKEND_ENVIRONMENT_CAPABILITY: channel,
        },
        android: { buildType: "app-bundle" },
      })
    }

    expect(easConfig.submit.preview).toEqual({
      ios: {
        ascAppId: "1479613630",
      },
      android: {
        serviceAccountKeyPath: "../ci/keys/eas-android-sa-key.json",
        track: "internal",
      },
    })
    expect(easConfig.submit.preview.ios.ascAppId).not.toBe("$EXPO_ASC_APP_ID")

    expect(easConfig.submit.production).toEqual({
      ios: {
        ascAppId: "1479613630",
      },
      android: {
        serviceAccountKeyPath: "../ci/keys/eas-android-sa-key.json",
        track: "internal",
      },
    })
    expect(JSON.stringify(easConfig.submit)).not.toContain("$EXPO_")
  })

  it.each([undefined, "", "beta", "PREVIEW"])(
    "fails closed for a missing or malformed backend capability (%s)",
    (backendCapability) => {
      const config = resolveConfig({
        OTA_CHANNEL: "production",
        BACKEND_ENVIRONMENT_CAPABILITY: backendCapability,
      })

      expect(config.extra?.backendEnvironmentCapability).toBe("production")
      expect(config.extra?.appVariant).toBe("production")
      expect(config.updates?.requestHeaders?.["expo-channel-name"]).toBe(
        "production",
      )
    },
  )

  it("keeps backend capability independent from identity, OTA, Firebase, and EAS linkage", () => {
    const config = resolveConfig({
      APP_VARIANT: "development",
      BACKEND_ENVIRONMENT_CAPABILITY: "preview",
      EAS_PROJECT_ID: "custom-project",
    })

    expect(config.extra).toMatchObject({
      appVariant: "development",
      backendEnvironmentCapability: "preview",
      eas: { projectId: "custom-project" },
    })
    expect(config.ios?.bundleIdentifier).toBe("fr.samuelprak.timecalendar.dev")
    expect(config.ios?.googleServicesFile).toBe(
      "./firebase/GoogleService-Info.dev.plist",
    )
    expect(config.updates).toEqual({ enabled: false })
  })
})
