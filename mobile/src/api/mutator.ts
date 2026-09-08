import { isBackendRuntimeReady } from "@/config/backend-runtime"

import { getApiBaseUrl } from "./config"

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

export interface ApiResponse<T> {
  status: number
  headers: Headers
  data: T | undefined
}

export type ApiTransportFailure = "malformed_body" | "oversized_body"

export class ApiTransportError extends Error {
  constructor(readonly failure: ApiTransportFailure) {
    super("API response could not be decoded")
    this.name = "ApiTransportError"
  }
}

// Hard upper bound on any single request. React Native's `fetch` has no timeout,
// so a black-hole network (captive portal, stalled TLS, a radio dropping
// mid-request) would leave the query `pending` forever with no `isError` and no
// recovery. The timeout aborts the request so the failure surfaces as an ordinary
// (recoverable) network error instead of an unresolvable hang.
const DEFAULT_TIMEOUT_MS = 15000
const CONTACT_PATH = "/contact"
const EXPORT_GUIDES_PATH = "/v1/export-guides"
const EXPORT_GUIDES_MAX_BODY_BYTES = 512 * 1024
const inFlightControllers = new Set<AbortController>()

export function cancelInFlightApiRequests(): void {
  for (const controller of inFlightControllers) controller.abort()
  inFlightControllers.clear()
}

const utf8ByteLength = (value: string): number => {
  let bytes = 0
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0
    if (codePoint <= 0x7f) bytes += 1
    else if (codePoint <= 0x7ff) bytes += 2
    else if (codePoint <= 0xffff) bytes += 3
    else bytes += 4
  }
  return bytes
}

const parseBody = async (
  response: Response,
  sensitiveExportGuide: boolean,
): Promise<unknown> => {
  const text = await response.text()
  if (!text) return undefined
  if (
    sensitiveExportGuide &&
    utf8ByteLength(text) > EXPORT_GUIDES_MAX_BODY_BYTES
  ) {
    throw new ApiTransportError("oversized_body")
  }
  try {
    return JSON.parse(text)
  } catch {
    if (sensitiveExportGuide) {
      throw new ApiTransportError("malformed_body")
    }
    return text
  }
}

type InternalApiResponse = ApiResponse<unknown>

const durationBucket = (milliseconds: number): string => {
  if (milliseconds < 250) return "lt_250ms"
  if (milliseconds < 1000) return "lt_1s"
  if (milliseconds < 5000) return "lt_5s"
  return "gte_5s"
}

const request = async (
  url: string,
  options: RequestInit,
): Promise<InternalApiResponse> => {
  if (!isBackendRuntimeReady()) {
    throw new Error("Backend runtime is resetting")
  }
  const fullUrl = `${getApiBaseUrl()}${url}`
  const method = options.method ?? "GET"
  const pathname = new URL(fullUrl).pathname
  const redactPayload = __DEV__ && pathname === CONTACT_PATH
  const sensitiveExportGuide = pathname === EXPORT_GUIDES_PATH
  const startedAt = Date.now()
  let responseStatus: number | undefined

  if (__DEV__ && !sensitiveExportGuide) {
    if (redactPayload) console.log(`[api] → ${method} ${CONTACT_PATH}`)
    else console.log(`[api] → ${method} ${fullUrl}`, options.body ?? "")
  }

  // Compose the caller's cancellation (TanStack Query aborts via `options.signal`
  // on unmount) with the timeout controller so EITHER source aborts the request.
  const controller = new AbortController()
  inFlightControllers.add(controller)
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)
  const callerSignal = options.signal
  const onCallerAbort = () => controller.abort()
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort()
    else callerSignal.addEventListener("abort", onCallerAbort, { once: true })
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
    responseStatus = response.status

    const body = await parseBody(response, sensitiveExportGuide)

    if (__DEV__) {
      if (sensitiveExportGuide) {
        console.log(
          `[api] ← ${method} ${EXPORT_GUIDES_PATH} status=${response.status} duration=${durationBucket(Date.now() - startedAt)} outcome=response`,
        )
      } else if (redactPayload)
        console.log(`[api] ← ${response.status} ${method} ${CONTACT_PATH}`)
      else
        console.log(
          `[api] ← ${response.status} ${method} ${fullUrl}`,
          body ?? "",
        )
    }

    return {
      status: response.status,
      headers: response.headers,
      data: body,
    }
  } catch (error) {
    if (__DEV__ && sensitiveExportGuide) {
      const outcome =
        error instanceof ApiTransportError ? error.failure : "transport_error"
      const status =
        responseStatus === undefined ? "" : ` status=${responseStatus}`
      console.log(
        `[api] ← ${method} ${EXPORT_GUIDES_PATH}${status} duration=${durationBucket(Date.now() - startedAt)} outcome=${outcome}`,
      )
    }
    throw error
  } finally {
    inFlightControllers.delete(controller)
    clearTimeout(timeout)
    callerSignal?.removeEventListener("abort", onCallerAbort)
  }
}

export function customFetchResponse<
  T extends { status: number; headers: Headers; data: unknown },
>(url: string, options: RequestInit): Promise<T>
export function customFetchResponse<T>(
  url: string,
  options: RequestInit,
): Promise<ApiResponse<T>>
export async function customFetchResponse<T>(
  url: string,
  options: RequestInit,
): Promise<ApiResponse<T>> {
  return (await request(url, options)) as ApiResponse<T>
}

export const customFetch = async <T>(
  url: string,
  options: RequestInit,
): Promise<T> => {
  const response = await request(url, options)
  if (response.status < 200 || response.status >= 300) {
    throw new ApiError(response.status, response.data)
  }
  return response.data as T
}
