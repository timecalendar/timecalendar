// The form-state shape and the validation-result type for the personal-events
// create/edit form (B2 / TIM-133). Logic layer (90% coverage glob) — the
// presentational screen holds a value of this shape in local state and only
// calls validateEventForm / buildEventFromForm over it (design D2).

// Every field is populated in the editing state (strings default "", never
// undefined), so the controlled inputs always have a defined value. The
// optional domain fields (location/description) become undefined only at
// build time, when a trimmed empty string is dropped (build.ts).
export interface EventFormValues {
  title: string
  startsAt: Date
  endsAt: Date
  color: string
  location: string
  description: string
}

// Validation carries localizable error KEYS (not rendered sentences), so the
// validator stays pure + i18n-agnostic; the screen maps key → t(). A field with
// no error is absent.
export interface EventFormErrors {
  title?: string
  range?: string
}

export interface EventFormValidation {
  valid: boolean
  errors: EventFormErrors
}
