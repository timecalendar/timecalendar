import { toastApiError } from "modules/shared/helpers/toast"
import { useState } from "react"

const useLoading = <T extends unknown[]>(
  action: (...args: T) => Promise<unknown>,
) => {
  const [loading, setLoading] = useState(false)

  const fn = async (...args: T) => {
    if (loading) return
    setLoading(true)

    try {
      await action(...args)
    } catch (err) {
      toastApiError(err)
    } finally {
      setLoading(false)
    }
  }

  return [loading, fn] as const
}

export default useLoading
