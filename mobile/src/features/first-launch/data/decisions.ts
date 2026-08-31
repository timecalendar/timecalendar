import type {
  FirstIcalReminderState,
  OnboardingResolution,
} from "@/features/first-launch/store"

export type InitialRouteDecision = "pending" | "onboarding" | "tabs"

export interface InitialRouteDecisionInput {
  calendarsLoaded: boolean
  calendarCount: number
  onboardingResolution: OnboardingResolution
}

export function decideInitialRoute({
  calendarsLoaded,
  calendarCount,
  onboardingResolution,
}: InitialRouteDecisionInput): InitialRouteDecision {
  if (!calendarsLoaded) return "pending"
  if (calendarCount > 0 || onboardingResolution !== undefined) return "tabs"
  return "onboarding"
}

export function onboardingResolutionToSeed(
  calendarCount: number,
  resolution: OnboardingResolution,
): "calendarImported" | undefined {
  return calendarCount > 0 && resolution === undefined
    ? "calendarImported"
    : undefined
}

export interface FirstIcalReminderDecisionInput {
  calendarsLoaded: boolean
  calendarCount: number
  onboardingResolution: OnboardingResolution
  reminderState: FirstIcalReminderState
}

export function shouldShowFirstIcalReminder({
  calendarsLoaded,
  calendarCount,
  onboardingResolution,
  reminderState,
}: FirstIcalReminderDecisionInput): boolean {
  return (
    calendarsLoaded &&
    onboardingResolution !== undefined &&
    calendarCount === 0 &&
    reminderState === "pending"
  )
}
