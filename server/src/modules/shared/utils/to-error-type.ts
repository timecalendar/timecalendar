/**
 * Derives a *bounded* error discriminator from an unknown error, matching the
 * platform's established error-tagging convention: the exception's name/class.
 *
 * The set of exception classes a code path can throw is finite, so this is safe
 * to use as a metric label (unlike a raw `error.message`, which is unbounded and
 * becomes permanent series sprawl in VictoriaMetrics).
 */
export function toErrorType(error: unknown): string {
  if (error !== null && typeof error === "object") {
    const { name, constructor } = error as {
      name?: unknown
      constructor?: { name?: unknown }
    }
    if (typeof name === "string" && name) return name
    if (typeof constructor?.name === "string" && constructor.name)
      return constructor.name
  }
  return "unknown"
}
