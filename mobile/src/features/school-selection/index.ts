// Feature barrel — the public surface the onboarding screens consume. No import
// cycle: the data/ and store/ sub-barrels import @/api/generated / @/storage,
// never each other or this barrel (mirroring the personal-events data/form two-
// sub-barrel pattern).
export {
  persistOptions,
  type SchoolGroupNode,
  type SchoolGroupsQuery,
  type SchoolListItem,
  type SchoolsQuery,
  shouldDehydrateQuery,
  useSchoolGroups,
  useSchools,
} from "./data"
export {
  clearSelection,
  getSelection,
  hasSelection,
  isOnboardingComplete,
  type SchoolSelection,
  selectGroup,
  selectSchool,
  useSelectedSchool,
} from "./store"
