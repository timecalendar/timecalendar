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
  const mountedRef = useRef(false)
  const pathRef = useRef(pathname)
  const routerRef = useRef(router)
  const syncRef = useRef(sync)
  const notifyExplicitPath = useRef<((path: LaunchDestination) => void) | null>(
    null,
  )
  const handledAttempt = useRef<number | null>(null)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])
  useEffect(() => {
    pathRef.current = pathname
    notifyExplicitPath.current?.(pathname)
  }, [pathname])
  useEffect(() => {
    routerRef.current = router
  }, [router])
  useEffect(() => {
    syncRef.current = sync
  }, [sync])

  useEffect(() => {
    if (launch.kind !== "resolving") return
    if (handledAttempt.current === launch.attempt) return
    handledAttempt.current = launch.attempt
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
          syncRef.current,
          () => pathRef.current,
          explicitPathDidChange,
        )
        if (!mountedRef.current) return

        const currentPath = pathRef.current
        const explicitNavigationArrived = currentPath !== initialPath
        const target = explicitNavigationArrived ? currentPath : resolvedTarget

        beginLaunchNavigation(target)
        if (currentPath === target) {
          commitLaunch(target)
        } else {
          routerRef.current.replace(target as never)
        }
      } catch (error) {
        if (!mountedRef.current) return
        recordLaunchFailure(error)
        failLaunch(error)
      } finally {
        releaseExplicitPathListener()
      }
    })()

    // The attempt intentionally survives ordinary rerenders. Expo Router and
    // mutation-hook identities can change while migrations or a killed-state
    // intent is pending; cancelling here would strand the one-shot attempt
    // behind handledAttempt until the readiness watchdog failed.
  }, [launch.attempt, launch.kind])

  useEffect(() => {
    if (launch.kind === "navigating" && pathname === launch.target) {
      commitLaunch(launch.target)
    }
  }, [launch, pathname])

  return null
}
