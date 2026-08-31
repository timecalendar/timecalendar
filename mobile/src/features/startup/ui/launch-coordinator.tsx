import { usePathname, useRouter } from "expo-router"
import { useEffect, useRef } from "react"

import { useSyncCalendars } from "@/features/calendar"
import {
  beginLaunchNavigation,
  commitLaunch,
  failLaunch,
  type LaunchDestination,
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
  const notifyExplicitPath = useRef<((path: LaunchDestination) => void) | null>(
    null,
  )
  const handledAttempt = useRef<number | null>(null)
  useEffect(() => {
    pathRef.current = pathname
    notifyExplicitPath.current?.(pathname)
  }, [pathname])

  useEffect(() => {
    if (launch.kind !== "resolving") return
    if (handledAttempt.current === launch.attempt) return
    handledAttempt.current = launch.attempt
    let active = true
    const initialPath = pathRef.current
    let onExplicitPath: ((path: LaunchDestination) => void) | null = null
    const explicitPathDidChange = new Promise<LaunchDestination>((resolve) => {
      onExplicitPath = (path) => {
        if (path === initialPath) return
        if (notifyExplicitPath.current === onExplicitPath) {
          notifyExplicitPath.current = null
        }
        resolve(path)
      }
      notifyExplicitPath.current = onExplicitPath
    })
    const releaseExplicitPathListener = () => {
      if (notifyExplicitPath.current === onExplicitPath) {
        notifyExplicitPath.current = null
      }
    }

    void (async () => {
      try {
        const resolvedTarget = await resolveLaunchPrerequisites(
          initialPath,
          sync,
          () => pathRef.current,
          explicitPathDidChange,
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
      } finally {
        releaseExplicitPathListener()
      }
    })()

    return () => {
      active = false
      releaseExplicitPathListener()
    }
  }, [launch, router, sync])

  useEffect(() => {
    if (launch.kind === "navigating" && pathname === launch.target) {
      commitLaunch(launch.target)
    }
  }, [launch, pathname])

  return null
}
