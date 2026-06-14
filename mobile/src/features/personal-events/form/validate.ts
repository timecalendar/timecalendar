import type { EventFormValidation, EventFormValues } from "./types"

// Pure form validation (design D2) — no t(), no @/db, no side effects. Returns
// localizable error KEYS the screen maps to t(); a missing key means the field
// is valid. Title required (non-empty after trim); end strictly after start.
export function validateEventForm(
  values: EventFormValues,
): EventFormValidation {
  const errors: EventFormValidation["errors"] = {}

  if (values.title.trim().length === 0) {
    errors.title = "personalEvents.form.error.titleRequired"
  }

  if (values.endsAt.getTime() <= values.startsAt.getTime()) {
    errors.range = "personalEvents.form.error.endBeforeStart"
  }

  return { valid: Object.keys(errors).length === 0, errors }
}
