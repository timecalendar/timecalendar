import type { PropsWithChildren } from "react"
import { useEffect, useState } from "react"

export function BootstrapGate({
  children,
  initialize,
}: PropsWithChildren<{ initialize: () => Promise<unknown> }>) {
  const [state, setState] = useState<"pending" | "ready" | "failed">("pending")
  useEffect(() => {
    let mounted = true
    void initialize().then(
      () => {
        if (mounted) setState("ready")
      },
      () => {
        if (mounted) setState("failed")
      },
    )
    return () => {
      mounted = false
    }
  }, [initialize])
  if (state === "failed") throw new Error("APP_STORAGE_BOOTSTRAP_FAILED")
  return state === "ready" ? <>{children}</> : null
}
