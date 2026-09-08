import type { ExportGuideSelector } from "@/features/export-guides/data"

import { decideIntranetUrl, type ImportJourneyState } from "./types"

export type ImportJourneyRoute =
  | "/onboarding/school"
  | "/onboarding/programme"
  | "/onboarding/connect"
  | "/onboarding/export-guide/providers"
  | "/onboarding/export-guide/0"
  | "/onboarding/import"
  | "/onboarding/qr-scan"
  | "/onboarding/ical-url"

export interface GateDecision {
  readonly route: ImportJourneyRoute
  readonly selector?: ExportGuideSelector
  readonly connectSkipped?: Readonly<{
    reason: "missing_url" | "unsafe_url"
    providerSlug: string
  }>
}

export function nextRouteAfterInstitution(
  state: ImportJourneyState,
): GateDecision {
  if (state.phase === "empty") return { route: "/onboarding/school" }
  if (state.draft.institution.kind === "unlisted") {
    return { route: "/onboarding/programme" }
  }
  if (state.draft.institution.school.exportGuide.requireProgramme) {
    return { route: "/onboarding/programme" }
  }
  return nextRouteAfterProgramme(state)
}

export function nextRouteAfterProgramme(
  state: ImportJourneyState,
): GateDecision {
  if (state.phase === "empty") return { route: "/onboarding/school" }
  if (state.draft.institution.kind === "unlisted") {
    return { route: "/onboarding/export-guide/providers" }
  }
  const guide = state.draft.institution.school.exportGuide
  if (guide.requireConnect) {
    const intranet = decideIntranetUrl(
      state.draft.institution.school.intranetUrl,
    )
    if (intranet.kind === "safe") return { route: "/onboarding/connect" }
    return {
      route: "/onboarding/export-guide/0",
      selector: { kind: "exact", catalogueVersion: guide.catalogueVersion },
      connectSkipped: {
        reason: intranet.kind === "missing" ? "missing_url" : "unsafe_url",
        providerSlug: guide.providerSlug,
      },
    }
  }
  return {
    route: "/onboarding/export-guide/0",
    selector: { kind: "exact", catalogueVersion: guide.catalogueVersion },
  }
}

export function nextRouteAfterConnect(state: ImportJourneyState): GateDecision {
  if (state.phase === "empty" || state.draft.institution.kind !== "listed") {
    return { route: "/onboarding/school" }
  }
  return {
    route: "/onboarding/export-guide/0",
    selector: {
      kind: "exact",
      catalogueVersion:
        state.draft.institution.school.exportGuide.catalogueVersion,
    },
  }
}

export function earliestLegalRoute(
  state: ImportJourneyState,
): ImportJourneyRoute {
  if (state.phase === "empty") return "/onboarding/school"
  if (state.phase === "selecting-provider") {
    return "/onboarding/export-guide/providers"
  }
  if (state.phase === "guide" || state.phase === "completed") {
    return "/onboarding/export-guide/0"
  }
  if (state.draft.institution.kind === "unlisted") {
    return state.gateProgress === "institution"
      ? "/onboarding/programme"
      : "/onboarding/export-guide/providers"
  }
  const { exportGuide } = state.draft.institution.school
  if (exportGuide.requireProgramme && state.gateProgress === "institution") {
    return "/onboarding/programme"
  }
  if (
    nextRouteAfterProgramme(state).route === "/onboarding/connect" &&
    state.gateProgress !== "connect"
  ) {
    return "/onboarding/connect"
  }
  return "/onboarding/export-guide/0"
}

export type JourneyGate = "programme" | "connect" | "providers"

export type JourneyGateDecision =
  | Readonly<{ legal: true }>
  | Readonly<{ legal: false; recovery: ImportJourneyRoute }>

export function canEnterJourneyGate(
  state: ImportJourneyState,
  gate: JourneyGate,
): boolean {
  if (state.phase === "empty") return false
  if (gate === "programme") {
    return nextRouteAfterInstitution(state).route === "/onboarding/programme"
  }
  if (gate === "connect") {
    return (
      state.gateProgress !== "institution" &&
      nextRouteAfterProgramme(state).route === "/onboarding/connect"
    )
  }
  return (
    state.draft.institution.kind === "unlisted" &&
    state.gateProgress !== "institution"
  )
}

export function gateRecoveryRoute(
  state: ImportJourneyState,
  gate: JourneyGate,
): ImportJourneyRoute | null {
  const decision = journeyGateDecision(state, gate)
  return decision.legal ? null : decision.recovery
}

export function journeyGateDecision(
  state: ImportJourneyState,
  gate: JourneyGate,
): JourneyGateDecision {
  if (canEnterJourneyGate(state, gate)) return { legal: true }
  return { legal: false, recovery: earliestLegalRoute(state) }
}

export function canEnterProtectedRoute(
  state: ImportJourneyState,
  route: "manual" | "qr" | "ical",
): boolean {
  if (state.phase !== "completed") return false
  if (route === "manual") return true
  return state.manualHandoff === route
}

export function recoveryRoute(
  state: ImportJourneyState,
  currentRoute: ImportJourneyRoute,
): ImportJourneyRoute | null {
  const target = earliestLegalRoute(state)
  return target === currentRoute ? null : target
}
