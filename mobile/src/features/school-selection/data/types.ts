// The small domain shapes the onboarding screens consume — minimal projections
// of the generated DTOs (only what the screens render). Keep minimal: only what
// the screens render + what the store persists (R-2). The full DTOs live in the
// query cache (and the persister restores them); the screens never need more.

// A school row in the picker — projected from SchoolForList. `code` is carried
// for the accent-insensitive name-or-code search (data/search.ts), matching the
// Flutter `stringIncludes(search, name) || stringIncludes(search, code)`.
// `intranetUrl` is carried for the import journey's Connect step: the row the
// student picked becomes the draft's institution, so Connect renders its link
// from this projection with no second query (TIM-391 / design D2).
export interface SchoolListItem {
  id: string
  name: string
  code: string
  imageUrl: string
  imageUrlDark: string | null
  intranetUrl: string | null
}

// A node in the school-group tree — mirrors the generated SchoolGroupItem
// ({ text, value, children }); a leaf has an empty children array.
export interface SchoolGroupNode {
  text: string
  value: string
  children: SchoolGroupNode[]
}
