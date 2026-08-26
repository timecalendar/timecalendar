export type FeedbackFormErrorKey =
  | "feedback.error.emailRequired"
  | "feedback.error.emailInvalid"
  | "feedback.error.messageRequired"

export interface FeedbackFormValues {
  email: string
  message: string
}

export interface ValidFeedbackForm {
  email: string
  message: string
}

export interface FeedbackFormErrors {
  email?: FeedbackFormErrorKey
  message?: FeedbackFormErrorKey
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmail(value: string): string {
  return value.trim()
}

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(normalizeEmail(value))
}

export function validateFeedbackForm(
  values: FeedbackFormValues,
):
  | { valid: true; values: ValidFeedbackForm }
  | { valid: false; errors: FeedbackFormErrors } {
  const email = normalizeEmail(values.email)
  const errors: FeedbackFormErrors = {}

  if (email.length === 0) errors.email = "feedback.error.emailRequired"
  else if (!isValidEmail(email)) errors.email = "feedback.error.emailInvalid"
  if (values.message.trim().length === 0)
    errors.message = "feedback.error.messageRequired"

  return Object.keys(errors).length > 0
    ? { valid: false, errors }
    : { valid: true, values: { email, message: values.message } }
}
