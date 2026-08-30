// Feature barrel — the public surface of the onboarding flow: the framing/brand
// UI (ADR 015), the institution → programme → Connect → manual-import journey
// screens, and the ephemeral import draft (ADR 045) the calendar-sources QR and
// iCal screens read to build their create payload.
//
// No cycle: the draft/ sublayer imports the calendar-sources `data/` SUB-barrel
// only (for CalendarImportFields), never `@/features/calendar-sources` — that
// top-level barrel re-exports ui/, whose screens import this one.
export {
  type CalendarImportDraft,
  ImportDraftProvider,
  type ImportDraftValue,
  type ImportInstitution,
  isImportNameWithinLimit,
  NAME_MAX_LENGTH,
  normalizeImportName,
  safeIntranetUrl,
  toCreateFields,
  useImportCreateFields,
  useImportDraft,
} from "./draft"
export {
  ConnectScreen,
  InstitutionNameScreen,
  ManualImportScreen,
  ProgrammeScreen,
  WelcomeScreen,
} from "./ui"
