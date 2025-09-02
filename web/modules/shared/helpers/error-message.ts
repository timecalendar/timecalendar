export type ApiErrorMessageMap = { [apiError: string]: string }

const errors: { [apiError: string]: string } = {}

export const getApiErrorMessage = (
  error: unknown,
  defaultError?: string | ApiErrorMessageMap,
) => {
  const errorObj = error as Record<string, unknown>
  const response = errorObj?.response as Record<string, unknown> | undefined
  const data = response?.data as Record<string, unknown> | undefined
  const errorData = data?.error as Record<string, unknown> | undefined

  let message: string | string[] =
    (data?.message as string | string[]) ??
    (errorData?.message as string | string[]) ??
    (data?.error as string | string[]) ??
    (errorObj?.message as string | string[]) ??
    (typeof error === "string" && error) ??
    (typeof defaultError === "string" && defaultError) ??
    "An error has occurred."
  if (Array.isArray(message)) {
    message = message.join(", ")
  }
  const allErrors = {
    ...errors,
    ...(typeof defaultError === "object" ? defaultError : {}),
  }
  if (message && allErrors[message]) {
    return allErrors[message]
  }
  return message
}
