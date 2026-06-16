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

  if (__DEV__) {
    console.log(`[api] → ${method} ${fullUrl}`, options.body ?? "")
  }

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  })

  const body = await parseBody(response)

  if (__DEV__) {
    console.log(`[api] ← ${response.status} ${method} ${fullUrl}`, body ?? "")
  }

  if (!response.ok) {
    throw new ApiError(response.status, body)
  }
  return body as T
}
