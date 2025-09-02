import { toast } from "react-toastify"
import { getApiErrorMessage } from "./error-message"

export const toastApiError = (error: unknown) => {
  const errorObj = error as Record<string, unknown>
  if (errorObj?.message === "canceled") return
  toast.error(getApiErrorMessage(error))
}
