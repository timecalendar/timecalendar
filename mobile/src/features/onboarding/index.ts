// Feature barrel — the public surface of the onboarding flow: the framing/brand
// UI (ADR 015), the institution → programme → Connect → manual-import journey
// screens, and the ephemeral import draft (ADR 047) the calendar-sources QR and
// iCal screens read to build their create payload.
//
// No cycle: the draft/ sublayer imports the calendar-sources `data/` SUB-barrel
// only (for CalendarImportFields), never `@/features/calendar-sources` — that
// top-level barrel re-exports ui/, whose screens import this one.
export {
  type CalendarImportDraft,
  canEnterProtectedRoute,
  decideIntranetUrl,
  earliestLegalRoute,
  type GateDecision,
  ImportDraftProvider,
  type ImportDraftValue,
  type ImportInstitution,
  type ImportJourneyAction,
  importJourneyReducer,
  type ImportJourneyRoute,
  type ImportJourneyState,
  initialImportJourneyState,
  isImportNameWithinLimit,
  NAME_MAX_LENGTH,
  normalizeImportName,
  safeIntranetUrl,
  toCreateFields,
  useImportCreateFields,
  useImportDraft,
  useProtectedImportRoute,
} from "./draft"
export {
  ConnectScreen,
  InstitutionNameScreen,
  ManualImportScreen,
  ProgrammeScreen,
  WelcomeScreen,
} from "./ui"
