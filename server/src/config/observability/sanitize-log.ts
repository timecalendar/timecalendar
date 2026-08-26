import { classifyUpstreamDomain } from "./upstream-domain"

const MAX_LOG_BODY_LENGTH = 1_024
const MAX_SCALAR_LENGTH = 256
const MAX_DEPTH = 3
const MAX_ITEMS = 10

const ALLOWED_STRUCTURED_KEYS = new Set([
  "action",
  "context",
  "deployment.environment.name",
  "error.type",
  "errorType",
  "job",
  "queue",
  "school",
  "service.instance.id",
  "service.name",
  "span_id",
  "status",
  "trace_id",
])

const sanitizeText = (input: string) =>
  input
    .replace(
      /\b(?:raw\s+response(?:\s+(?:text|body))?|request\s+body|response\s+body)\s*[:=]\s*.*$/gim,
      "[body:redacted]",
    )
    .replace(/[a-z][a-z\d+.-]*:\/\/[^\s"'<>]+/gi, (url) => {
      const trailing = url.match(/[),.;!?]+$/)?.[0] ?? ""
      const value = trailing ? url.slice(0, -trailing.length) : url
      return `[url:${classifyUpstreamDomain(value)}]${trailing}`
    })
    .replace(/\b(?:bearer|basic)\s+[a-z\d._~+/-]+=*/gi, "[credential:redacted]")
    .replace(
      /\b(?:authorization|cookie|set-cookie|token(?:\s+suffix)?|password|secret)\s*[:=]\s*[^\s,;)\]}]+/gi,
      (match) => `${match.split(/[:=]/, 1)[0]}=[redacted]`,
    )
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email:redacted]")
    .replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
      "[id:redacted]",
    )
    .replace(/\b(?:[A-Za-z\d_-]{24,}|\d{10,})\b/g, "[id:redacted]")
    .slice(0, MAX_SCALAR_LENGTH)

const sanitizeContext = (input: string) =>
  /^[A-Za-z0-9_.-]{1,64}$/.test(input) ? input : "unknown"

const errorType = (value: unknown): string | undefined => {
  if (value instanceof Error) return sanitizeText(value.name || "Error")
  if (
    value &&
    typeof value === "object" &&
    "name" in value &&
    typeof value.name === "string"
  ) {
    return sanitizeText(value.name)
  }
  return undefined
}

const sanitizeValue = (value: unknown, depth = 0): unknown => {
  if (depth > MAX_DEPTH) return "[depth-limited]"
  if (value == null || typeof value === "boolean" || typeof value === "number")
    return value
  if (typeof value === "string") return sanitizeText(value)
  if (value instanceof Error) {
    return {
      "error.type": errorType(value),
      message: sanitizeText(value.message),
    }
  }
  if (Array.isArray(value))
    return value
      .slice(0, MAX_ITEMS)
      .map((item) => sanitizeValue(item, depth + 1))
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => ALLOWED_STRUCTURED_KEYS.has(key))
        .slice(0, MAX_ITEMS)
        .map(([key, nested]) => [key, sanitizeValue(nested, depth + 1)]),
    )
  }
  return sanitizeText(String(value))
}

const toBodyPart = (value: unknown) => {
  const sanitized = sanitizeValue(value)
  if (typeof sanitized === "string") return sanitized
  if (sanitized == null) return String(sanitized)
  if (typeof sanitized === "object" && Object.keys(sanitized).length === 0)
    return "[object omitted]"
  return JSON.stringify(sanitized)
}

export type SanitizedLog = {
  body: string
  attributes: Record<string, string>
}

export function sanitizeLog(
  message: unknown,
  optionalParams: unknown[] = [],
): SanitizedLog {
  const context =
    optionalParams.length > 0 &&
    typeof optionalParams[optionalParams.length - 1] === "string"
      ? sanitizeContext(optionalParams[optionalParams.length - 1] as string)
      : undefined
  const details = (
    context ? optionalParams.slice(0, -1) : optionalParams
  ).filter(
    (value) =>
      typeof value !== "string" ||
      (!/^\w*Error:/m.test(value) && !/\n\s+at\s/.test(value)),
  )
  const detectedErrorType = [message, ...details].map(errorType).find(Boolean)
  const body = [message, ...details]
    .filter((value) => value != null)
    .map(toBodyPart)
    .join(" ")
    .slice(0, MAX_LOG_BODY_LENGTH)
  const attributes: Record<string, string> = {}
  if (context) attributes.context = context
  if (detectedErrorType) attributes["error.type"] = detectedErrorType
  return { body, attributes }
}
