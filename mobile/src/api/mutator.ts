import { API_BASE_URL } from "./config"

export class ApiError<TBody = unknown> extends Error {
  constructor(
    readonly status: number,
    readonly body: TBody,
  ) {
    super(`API request failed with status ${status}`)
    this.name = "ApiError"
  }
}

// Orval uses this to type the `error` of every generated hook.
export type ErrorType<TBody> = ApiError<TBody>

// Hard upper bound on any single request. React Native's `fetch` has no timeout,
// so a black-hole network (captive portal, stalled TLS, a radio dropping
// mid-request) would leave the query `pending` forever with no `isError` and no
// recovery. The timeout aborts the request so the failure surfaces as an ordinary
// (recoverable) network error instead of an unresolvable hang.
const DEFAULT_TIMEOUT_MS = 15000
const CONTACT_PATH = "/contact"

const parseBody = async (response: Response): Promise<unknown> => {
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export const customFetch = async <T>(
  url: string,
  options: RequestInit,
): Promise<T> => {
  const fullUrl = `${API_BASE_URL}${url}`
  const method = options.method ?? "GET"
  const redactPayload = __DEV__ && new URL(fullUrl).pathname === CONTACT_PATH

  if (__DEV__) {
    if (redactPayload) console.log(`[api] → ${method} ${CONTACT_PATH}`)
    else console.log(`[api] → ${method} ${fullUrl}`, options.body ?? "")
  }

  // Compose the caller's cancellation (TanStack Query aborts via `options.signal`
  // on unmount) with the timeout controller so EITHER source aborts the request.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)
  const callerSignal = options.signal
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort()
    else
      callerSignal.addEventListener("abort", () => controller.abort(), {
        once: true,
      })
  }

  try {
    const response = await fetch(fullUrl, {
      ...options,
      // Overrides the spread `options.signal`, which RN's `fetch` otherwise
      // ignored — the composed controller carries both timeout + caller aborts.
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    })

    const body = await parseBody(response)

    if (__DEV__) {
      if (redactPayload)
        console.log(`[api] ← ${response.status} ${method} ${CONTACT_PATH}`)
      else
        console.log(
          `[api] ← ${response.status} ${method} ${fullUrl}`,
          body ?? "",
        )
    }

    if (!response.ok) {
      throw new ApiError(response.status, body)
    }
    return body as T
  } finally {
    clearTimeout(timeout)
  }
}
