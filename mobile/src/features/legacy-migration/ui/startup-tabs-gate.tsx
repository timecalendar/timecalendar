import { Redirect, usePathname } from "expo-router"
import type { PropsWithChildren } from "react"
import { useEffect, useState } from "react"

import { getStartupTab } from "@/storage/migration-participants"

export function StartupTabsGate({ children }: PropsWithChildren) {
  const pathname = usePathname()
  const [pending, setPending] = useState(
    () => pathname === "/" && getStartupTab() === "calendar",
  )
  useEffect(() => {
    if (pending && pathname !== "/") queueMicrotask(() => setPending(false))
  }, [pathname, pending])
  if (pending && pathname === "/") return <Redirect href="/calendar" />
  return <>{children}</>
}
