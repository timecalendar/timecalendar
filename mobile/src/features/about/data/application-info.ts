import { nativeApplicationVersion, nativeBuildVersion } from "expo-application"

export interface NativeApplicationMetadata {
  version: string | null
  build: string | null
}

export type ApplicationInfo =
  | { kind: "versionAndBuild"; version: string; build: string }
  | { kind: "versionOnly"; version: string }
  | { kind: "buildOnly"; build: string }
  | { kind: "unavailable" }

function normalize(value: string | null): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

export function deriveApplicationInfo({
  version: rawVersion,
  build: rawBuild,
}: NativeApplicationMetadata): ApplicationInfo {
  const version = normalize(rawVersion)
  const build = normalize(rawBuild)

  if (version && build) return { kind: "versionAndBuild", version, build }
  if (version) return { kind: "versionOnly", version }
  if (build) return { kind: "buildOnly", build }
  return { kind: "unavailable" }
}

export function readApplicationInfo(): ApplicationInfo {
  return deriveApplicationInfo({
    version: nativeApplicationVersion,
    build: nativeBuildVersion,
  })
}
