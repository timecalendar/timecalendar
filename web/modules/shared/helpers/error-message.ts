export type ApiErrorMessageMap = { [apiError: string]: string }

const errors: { [apiError: string]: string } = {}

export const getApiErrorMessage = (
  error: any,
  defaultError?: string | ApiErrorMessageMap,
) => {
  let message: any =
    error.response?.data?.message ??
    error.response?.data?.error?.message ??
    error.response?.data?.error ??
    error.message ??
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
