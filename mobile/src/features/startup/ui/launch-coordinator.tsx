import { usePathname, useRouter } from "expo-router"
import { useEffect, useRef } from "react"

import { useSyncCalendars } from "@/features/calendar"
import {
  beginLaunchNavigation,
  commitLaunch,
  failLaunch,
  recordLaunchFailure,
  resolveLaunchPrerequisites,
  useLaunchState,
} from "@/features/startup/data"

export function LaunchCoordinator() {
  const pathname = usePathname()
  const router = useRouter()
  const { sync } = useSyncCalendars()
  const launch = useLaunchState()
  const pathRef = useRef(pathname)
  const handledAttempt = useRef<number | null>(null)
  useEffect(() => {
    pathRef.current = pathname
  }, [pathname])

  useEffect(() => {
    if (launch.kind !== "resolving") return
    if (handledAttempt.current === launch.attempt) return
    handledAttempt.current = launch.attempt
    let active = true
    const initialPath = pathRef.current

    void (async () => {
      try {
        const resolvedTarget = await resolveLaunchPrerequisites(
          initialPath,
          sync,
          () => pathRef.current,
        )
        if (!active) return

        const currentPath = pathRef.current
        const explicitNavigationArrived = currentPath !== initialPath
        const target = explicitNavigationArrived ? currentPath : resolvedTarget

        beginLaunchNavigation(target)
        if (currentPath === target) {
          commitLaunch(target)
        } else {
          router.replace(target as never)
        }
      } catch (error) {
        if (!active) return
        recordLaunchFailure(error)
        failLaunch(error)
      }
    })()

    return () => {
      active = false
    }
  }, [launch, router, sync])

  useEffect(() => {
    if (launch.kind === "navigating" && pathname === launch.target) {
      commitLaunch(launch.target)
    }
  }, [launch, pathname])

  return null
}
