import { isValidEmail, normalizeEmail } from "@/features/feedback/form"
import { getString, setString } from "@/storage"

export const LAST_EMAIL_KEY = "feedback.lastEmail"

export function parseRememberedEmail(raw: unknown): string {
  if (typeof raw !== "string") return ""
  const email = normalizeEmail(raw)
  return isValidEmail(email) ? email : ""
}

export function getRememberedEmail(): string {
  return parseRememberedEmail(getString(LAST_EMAIL_KEY))
}

export function setRememberedEmail(email: string): void {
  const parsed = parseRememberedEmail(email)
  if (parsed) setString(LAST_EMAIL_KEY, parsed)
}
