import {
  getString,
  setString,
  STORAGE_KEYS,
  useParsedStoredString,
} from "@/storage"

export type OnboardingResolution = "skipped" | "calendarImported" | undefined

export function parseOnboardingResolution(
  value: string | undefined,
): OnboardingResolution {
  return value === "skipped" || value === "calendarImported" ? value : undefined
}

export function getOnboardingResolution(): OnboardingResolution {
  return parseOnboardingResolution(getString(STORAGE_KEYS.onboardingResolution))
}

export function setOnboardingResolution(
  resolution: Exclude<OnboardingResolution, undefined>,
): void {
  setString(STORAGE_KEYS.onboardingResolution, resolution)
}

export function useOnboardingResolution(): OnboardingResolution {
  return useParsedStoredString(
    STORAGE_KEYS.onboardingResolution,
    parseOnboardingResolution,
  )
}
