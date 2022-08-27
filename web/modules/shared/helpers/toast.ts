import { toast } from "react-toastify"
import { getApiErrorMessage } from "./error-message"

export const toastApiError = (error: any) => {
  if (error?.message === "canceled") return
  toast.error(getApiErrorMessage(error))
}
